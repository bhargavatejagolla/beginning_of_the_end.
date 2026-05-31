"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function LiveTicker() {
  const { liveTransactions } = useWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveTransactions]);

  if (liveTransactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-gray-500 font-mono text-sm animate-pulse">
        [ WAITING FOR DATA STREAM... ]
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="h-[300px] overflow-y-auto p-4 space-y-2 font-mono text-xs md:text-sm scroll-smooth custom-scrollbar"
    >
      {liveTransactions.map((tx, idx) => {
        const isFlagged = tx?.risk_score > 0.7;
        return (
          <div 
            key={idx} 
            className={`flex items-start p-3 rounded border ${
              isFlagged 
                ? 'bg-red-500/10 border-red-500/30 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : 'bg-white/5 border-white/5 text-gray-300'
            } transition-all animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className="mr-3 mt-0.5">
              {isFlagged ? (
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="opacity-50">TX:</span> <span className="text-white">{tx?.tx_id ? tx.tx_id.substring(0, 8) : 'N/A'}...</span>
              </div>
              <div>
                <span className="opacity-50">AMT:</span> <span className="text-white">₹{tx?.amount ? tx.amount.toLocaleString() : '0'}</span>
              </div>
              <div className="col-span-1 md:col-span-2 flex items-center space-x-2 opacity-75">
                <span className="truncate">{tx?.source_node || 'Unknown'}</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{tx?.target_node || 'Unknown'}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="opacity-50 text-[10px]">RISK</div>
              <div className={`font-bold ${isFlagged ? 'text-red-400' : 'text-green-400'}`}>
                {((tx?.risk_score || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
