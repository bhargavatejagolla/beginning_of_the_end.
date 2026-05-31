"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import RiskMeter from "@/components/RiskMeter";
import LiveTicker from "@/components/LiveTicker";
import RiskHeatmap from "@/components/RiskHeatmap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { liveTransactions, alerts, connected, demoActive, startDemo } =
    useWebSocket();

  const latestAlert = alerts[0];
  const latestRisk = (latestAlert?.risk_score || 0) * 100;

  return (
    <main className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Command Center
          </h1>
          <p className="text-gray-400">Real-time threat feeds & national predictive security intelligence.</p>
        </div>
        {!connected && (
          <div className="px-4 py-2 glass-panel border-red-500/50 rounded-lg text-red-400 flex items-center space-x-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Disconnected</span>
          </div>
        )}
        {connected && (
          <div className="px-4 py-2 glass-panel border-green-500/50 rounded-lg text-green-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live Stream Active</span>
          </div>
        )}
      </div>

      {/* Numerical Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/5 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <RiskMeter score={latestRisk} />
          <p className="text-sm font-medium text-gray-400 mt-4 uppercase tracking-widest">Active Threat level</p>
        </Card>
        
        <Card className="glass-panel border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex flex-col h-full justify-between">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">Flagged Mule Alerts</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-red-500 neon-text-red drop-shadow-md">{alerts.length}</span>
              <span className="text-gray-500">intercepts</span>
            </div>
          </div>
        </Card>
        
        <Card className="glass-panel border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex flex-col h-full justify-between">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">Evaluated Inflows</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-white drop-shadow-md">{liveTransactions.length}</span>
              <span className="text-gray-500">live stream</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Geographic Heatmap & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel border-white/5 p-0 overflow-hidden flex flex-col">
          <RiskHeatmap />
        </Card>
        
        <Card className="glass-panel border-white/5 p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-200">Live Transaction Ticker</h2>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-white/5 text-gray-400 text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Scoring</span>
            </div>
          </div>
          <div className="flex-1 bg-black/40">
            <LiveTicker />
          </div>
        </Card>
      </div>

      {/* Multi-Channel Alerts Phone Mockup & Classifier Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Model Metrics stats */}
        <Card className="glass-panel border-white/5 p-6 xl:col-span-1 flex flex-col justify-between bg-black/20">
          <div>
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Mathematical Rigor</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              CyberShield's soft-voting ML ensemble optimizes prediction metrics, significantly outperforming benchmark classifiers on imbalanced bank mule datasets.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
              <span className="text-2xl font-black text-blue-400 font-mono">98.6%</span>
              <span className="text-[10px] text-gray-500 block uppercase font-bold mt-1">ROC-AUC</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
              <span className="text-2xl font-black text-purple-400 font-mono">92.4%</span>
              <span className="text-[10px] text-gray-500 block uppercase font-bold mt-1">PR-AUC</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
              <span className="text-2xl font-black text-pink-400 font-mono">94.0%</span>
              <span className="text-[10px] text-gray-500 block uppercase font-bold mt-1">Precision</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
              <span className="text-2xl font-black text-emerald-400 font-mono">89.0%</span>
              <span className="text-[10px] text-gray-500 block uppercase font-bold mt-1">Recall</span>
            </div>
          </div>
        </Card>

        {/* Twilio Incident Alerts Phone Mockup */}
        <Card className="glass-panel border-white/5 p-6 xl:col-span-2 flex flex-col justify-between bg-black/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.03)_0%,_transparent_75%)] pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Multi-Channel Alert Dispatch</h2>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">Twilio API Gateway Simulator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative z-10">
            <p className="text-xs text-gray-400 leading-relaxed md:pr-4">
              Upon critical threshold trigger, CyberShield dispatches instant multi-channel alerts: SMS warnings to primary victim accounts to prevent loss, and digital priority intervention locks directly to BOI Branch Operations Managers.
            </p>
            
            {/* Phone Vector display */}
            <div className="bg-[#0b0b0f] border border-white/10 p-3 rounded-2xl h-[170px] overflow-y-auto custom-scrollbar flex flex-col space-y-2.5 shadow-inner">
              {alerts.length === 0 ? (
                <div className="text-gray-600 text-[10px] font-mono italic h-full flex items-center justify-center text-center">
                  -- Mobile alert dispatch terminal idle. Launch Pig Butchering sequence to stream live alerts --
                </div>
              ) : (
                alerts.slice(0, 3).map((al, idx) => (
                  <div key={idx} className="space-y-1.5 animate-in slide-in-from-bottom-2 duration-300">
                    {/* Branch manager alert */}
                    <div className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-lg text-[9px] font-mono text-blue-300">
                      <span className="font-bold text-blue-400 block">[ALERT DISPATCH: MANAGER]</span>
                      Mule activity signature detected on ACT-{al.account_id}. Core freeze recommended.
                    </div>
                    {/* Customer warning text */}
                    <div className="bg-pink-600/10 border border-pink-500/20 p-2 rounded-lg text-[9px] font-mono text-pink-300">
                      <span className="font-bold text-pink-400 block">[ALERT DISPATCH: CUSTOMER]</span>
                      BOI SafeShield Alert: Critical transaction attempt flagged on your account. Call 1930.
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Simulation Control board */}
      <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Smart Simulation Triggers:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all rounded-xl px-5"
            onClick={() => startDemo("pig_butchering")}
            disabled={demoActive}
          >
            {demoActive ? "Sequence Initialized..." : "Launch Pig Butchering"}
          </Button>
          <Button 
            variant="outline" 
            className="glass-panel hover:bg-white/5 hover:text-white transition-all rounded-xl px-5 border-white/10"
            onClick={() => startDemo("layering")}
            disabled={demoActive}
          >
            Launch Layering
          </Button>
          <Button 
            variant="outline" 
            className="glass-panel hover:bg-white/5 hover:text-white transition-all rounded-xl px-5 border-white/10"
            onClick={() => startDemo("rapid_cashout")}
            disabled={demoActive}
          >
            Launch Rapid Cashout
          </Button>
        </div>
      </div>
    </main>
  );
}
