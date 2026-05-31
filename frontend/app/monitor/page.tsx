"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Activity, 
  Search, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ChevronRight, 
  X, 
  Info, 
  Layers, 
  Database,
  Eye,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function Monitor() {
  const { liveTransactions, connected } = useWebSocket();
  const [selected, setSelected] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter((txn) => 
      txn.account_id.toString().includes(searchQuery) ||
      (txn.risk_level && txn.risk_level.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [liveTransactions, searchQuery]);

  // Map ML technical feature names to human-readable forensic labels
  const getReadableFeatureName = (name: string) => {
    const mapping: Record<string, string> = {
      "BehaviorStd": "Anomalous Velocity",
      "BehaviorMax": "Peak Burst Amount",
      "SparseToBehaviorRatio": "Stealth Ratio",
      "AccountAgeDays": "Account Age",
      "AnomalyDensity": "Anomaly Density",
      "ActivityRiskScore": "Composite Activity Risk",
      "BehaviorMean": "Average Velocity Intensity",
      "BehaviorNonZeroCount": "Active Channels Count"
    };
    return mapping[name] || name;
  };

  const shapContributions = useMemo(() => {
    if (!selected || !selected.shap_values || !selected.feature_names) {
      // Mock some fallback SHAP features if not present in the payload (e.g. fallback mockup)
      return [
        { name: "BehaviorStd", value: 1.84 },
        { name: "AnomalyDensity", value: 1.25 },
        { name: "F2230", value: 0.64 },
        { name: "AccountAgeDays", value: -0.95 },
        { name: "F159", value: -0.42 }
      ];
    }

    const combined = selected.feature_names.map((name: string, idx: number) => ({
      name,
      value: selected.shap_values[idx] || 0
    }));

    // Sort by absolute impact and take top 5
    return combined
      .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);
  }, [selected]);

  return (
    <div className="flex h-screen overflow-hidden animate-in fade-in duration-500">
      {/* Main Panel */}
      <div className="flex-1 p-8 flex flex-col h-full overflow-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Live Monitoring</h1>
            </div>
            <p className="text-gray-400">Real-time threat pipeline and neural score evaluation ticker.</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-gray-500">Connection Status:</span>
            {!connected && (
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center space-x-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>DISCONNECTED</span>
              </div>
            )}
            {connected && (
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                <span>LIVE FEED STREAMING</span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex flex-col justify-between rounded-xl">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Feed Count</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-white font-mono">{liveTransactions.length}</span>
              <span className="text-xs text-gray-500 font-mono">buffered</span>
            </div>
          </div>
          <div className="glass-panel p-4 flex flex-col justify-between rounded-xl border-l-2 border-l-red-500/50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Critical Anomalies</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-red-500 neon-text-red font-mono">
                {liveTransactions.filter(t => t.risk_level === "CRITICAL").length}
              </span>
              <span className="text-xs text-gray-500 font-mono">flagged</span>
            </div>
          </div>
          <div className="glass-panel p-4 flex flex-col justify-between rounded-xl border-l-2 border-l-orange-500/50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">High Risk Activity</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-orange-400 font-mono">
                {liveTransactions.filter(t => t.risk_level === "HIGH").length}
              </span>
              <span className="text-xs text-gray-500 font-mono">anomalous</span>
            </div>
          </div>
          <div className="glass-panel p-4 flex flex-col justify-between rounded-xl">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Pipeline Speed</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-blue-400 font-mono">1.5s</span>
              <span className="text-xs text-gray-500 font-mono">polling loop</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by Account ID or Threat Level (e.g. CRITICAL, HIGH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {/* Live Stream Table */}
        <Card className="glass-panel border-white/5 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                  <th className="p-4 pl-6">Time</th>
                  <th className="p-4">Account Profile</th>
                  <th className="p-4">Simulated Amount</th>
                  <th className="p-4 text-center">Threat Risk Score</th>
                  <th className="p-4 text-right pr-6">Severity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((txn, i) => {
                  const isSelected = selected && selected.account_id === txn.account_id;
                  return (
                    <tr
                      key={i}
                      className={`hover:bg-white/[0.03] cursor-pointer transition-colors duration-200 group ${
                        isSelected ? "bg-blue-600/10 border-y border-y-blue-500/25" : ""
                      }`}
                      onClick={() => setSelected(txn)}
                    >
                      <td className="p-4 pl-6 text-sm text-gray-400 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>{new Date(txn.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                        ACT-{txn.account_id}
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-300 font-semibold">
                        ₹{txn.amount ? txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {((txn.risk_score || 0) * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold font-sans shadow-sm border ${
                            txn.risk_level === "CRITICAL"
                              ? "bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse"
                              : txn.risk_level === "HIGH"
                                ? "bg-orange-500/20 border-orange-500/30 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)]"
                                : txn.risk_level === "MEDIUM"
                                  ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                                  : "bg-green-500/10 border-green-500/20 text-green-400"
                          }`}
                        >
                          {txn.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Futuristic SHAP Diagnostic Sidebar */}
      {selected && (
        <div className="w-[420px] h-full bg-[#0d0d11]/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-300 z-20 backdrop-blur-xl">
          <div className="space-y-6 overflow-y-auto flex-1 pr-1">
            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white tracking-tight uppercase">AI Forensic Analysis</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Identity Details */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono">ACCOUNT PROFILE:</span>
                <span className="text-sm font-mono font-bold text-white">ACT-{selected.account_id}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono">RISK SCORE:</span>
                <span className={`text-2xl font-black font-mono ${
                  selected.risk_score >= 0.9 ? "text-red-500 animate-pulse" : selected.risk_score >= 0.7 ? "text-orange-400" : "text-emerald-400"
                }`}>
                  {((selected.risk_score || 0) * 100).toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono">AMOUNT:</span>
                <span className="text-sm font-mono font-bold text-white">
                  ₹{selected.amount ? selected.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                </span>
              </div>
            </div>

            {/* Ensemble Model Consensus Breakdown */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Classifier Consensus</span>
              </span>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-500">LightGBM:</span>
                    <span className="text-gray-300 font-bold">{selected.lgbm_score || ((selected.risk_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${selected.lgbm_score || (selected.risk_score * 100)}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-500">XGBoost:</span>
                    <span className="text-gray-300 font-bold">{selected.xgb_score || ((selected.risk_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${selected.xgb_score || (selected.risk_score * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>


            {/* Neural explanation block */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>SHAP Feature Influence</span>
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">Local Interpretability</span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                The visual chart below indicates how various behavioral features drove the machine learning ensemble model to raise or lower the prospective risk score.
              </p>

              {/* Dynamic Feature bars */}
              <div className="space-y-3.5 pt-2">
                {shapContributions.map((contrib: any) => {
                  const isPositive = contrib.value > 0;
                  // Cap value percentage for visualization
                  const maxAbsVal = Math.max(...shapContributions.map((c: any) => Math.abs(c.value))) || 1;
                  const percentWidth = Math.min((Math.abs(contrib.value) / maxAbsVal) * 100, 100);
                  
                  return (
                    <div key={contrib.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-300 font-medium">{getReadableFeatureName(contrib.name)}</span>
                        <span className={isPositive ? "text-red-400" : "text-emerald-400"}>
                          {isPositive ? "+" : ""}{contrib.value.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Positive / Negative indicators */}
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        
                        {/* Progress Bar background */}
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full ${
                              isPositive 
                                ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                                : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                            }`}
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Trigger in Footer */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <Link href={`/cases/${selected.account_id}`} className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md flex items-center justify-center space-x-1.5 py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                <Eye className="w-4 h-4" />
                <span>Open Forensic Report</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
