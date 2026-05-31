"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, Sparkles } from "lucide-react";
import dynamic from 'next/dynamic';
import { useWebSocket } from "@/context/WebSocketContext";

type HeatPoint = {
  account_id: number;
  latitude: number;
  longitude: number;
  risk_score: number;
  location: string;
  type: string;
};

// Dynamically import the map component with SSR disabled
const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center space-y-3 h-full">
      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-blue-400/80 font-mono text-[11px] uppercase tracking-widest animate-pulse">Initializing Geospatial Engine...</p>
    </div>
  )
});

export default function RiskHeatmap() {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const { liveTransactions } = useWebSocket();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/heatmap`)
      .then((res) => res.json())
      .then((data) => {
        setPoints(data);
        setLoading(false);
      })
      .catch((e) => {
        console.warn("Heatmap API failed to fetch:", e);
        setPoints([]);
        setLoading(false);
      });
  }, []);

  // Dynamically add new flagged transactions to the map!
  useEffect(() => {
    if (liveTransactions.length > 0) {
      const latest = liveTransactions[0];
      if (latest && latest.flagged) {
        setPoints(prev => {
          // Check if we already added it
          if (prev.some(p => p.account_id === latest.account_id)) return prev;
          
          // Generate a dynamic coordinate (mostly India)
          const lat = 20.0 + (Math.random() * 10 - 5);
          const lng = 78.0 + (Math.random() * 12 - 6);
          
          const newPoint = {
            account_id: latest.account_id,
            latitude: lat,
            longitude: lng,
            risk_score: Math.round(latest.risk_score * 100),
            location: "Live Intercept Node",
            type: "Dynamic Endpoint"
          };
          
          // Keep top 100 on map
          return [newPoint, ...prev].slice(0, 100);
        });
      }
    }
  }, [liveTransactions]);

  return (
    <div className="flex flex-col h-[550px] space-y-4">
      <div className="flex justify-between items-center px-6 pt-6">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-200">National Fraud Hotspots</h2>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 shadow-inner">
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>India Geospatial Intelligence</span>
        </div>
      </div>

      <div className="flex-1 relative p-4 pb-6 h-full">
        <div className="w-full h-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3 h-full bg-black/40">
              <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-red-400/80 font-mono text-[11px] uppercase tracking-widest animate-pulse">Connecting to CartoDB...</p>
            </div>
          ) : (
            <DynamicLeafletMap points={points} />
          )}
        </div>
      </div>
    </div>
  );
}
