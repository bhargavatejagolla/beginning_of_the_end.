"use client";
import { useMemo } from "react";

export default function RiskMeter({ score }: { score: number }) {
  const color = useMemo(() => {
    if (score >= 90) return "border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]";
    if (score >= 70) return "border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]";
    if (score >= 40) return "border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]";
    return "border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]";
  }, [score]);

  const rotation = (score / 100) * 180 - 90; // half-circle gauge

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        <div
          className="w-40 h-40 rounded-full border-[10px] border-white/5 absolute bottom-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        />
        <div
          className={`w-40 h-40 rounded-full border-[10px] absolute bottom-0 transition-all duration-1000 ${color.split(' ')[0]}`}
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
            transform: `rotate(${rotation}deg)`,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 w-1.5 h-10 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] origin-bottom -translate-x-1/2 rounded-t-full transition-transform duration-1000"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,1)] z-10" />
      </div>
      <div className={`text-4xl font-black mt-4 drop-shadow-md ${color.split(' ')[1]}`}>
        {score.toFixed(0)}
      </div>
    </div>
  );
}
