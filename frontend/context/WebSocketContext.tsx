"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

type Transaction = {
  timestamp: string;
  account_id: number;
  risk_score: number;
  risk_level: string;
  flagged: boolean;
  amount?: number;
  [key: string]: any;
};

type WebSocketContextType = {
  liveTransactions: Transaction[];
  alerts: Transaction[];
  connected: boolean;
  demoActive: boolean;
  startDemo: (scenario: string) => void;
};

const WebSocketContext = createContext<WebSocketContextType>({
  liveTransactions: [],
  alerts: [],
  connected: false,
  demoActive: false,
  startDemo: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const [demoActive, setDemoActive] = useState(false);

  const startDemo = useCallback(async (scenario: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/demo/scenario/${scenario}`,
        { method: "POST" },
      );
      setDemoActive(true);
      setTimeout(() => {
        setDemoActive(false);
      }, 15000); // Reset state after the 15-second scenario completes
    } catch (e) {
      console.error("Demo start failed:", e);
    }
  }, []);

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/live";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "transaction") {
          setLiveTransactions((prev) => [message.data, ...prev].slice(0, 100)); // keep last 100
        } else if (message.type === "alert") {
          setAlerts((prev) => [message.data, ...prev].slice(0, 50));
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ liveTransactions, alerts, connected, demoActive, startDemo }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
