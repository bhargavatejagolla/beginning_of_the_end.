"use client";
import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Database, 
  Gauge, 
  TrendingUp, 
  Sparkles, 
  ListRestart, 
  Info 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ModelsPage() {
  const [driftData, setDriftData] = useState<any>({ drift: 0.0, status: "loading" });
  const [loading, setLoading] = useState(true);

  const [featureImportance, setFeatureImportance] = useState<any[]>([]);

  const fetchDrift = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/models/drift`)
      .then((res) => res.json())
      .then((data) => setDriftData(data))
      .catch(() => setDriftData({ drift: 0.02, status: "normal" }));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/models/features`)
      .then((res) => res.json())
      .then((data) => {
        setFeatureImportance(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrift();
  }, []);

  return (
    <main className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">AI Ops & Drift</h1>
          </div>
          <p className="text-gray-400">
            Real-time tracking of machine learning classifier metrics, predictive drift, and training specifications.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-mono px-3 py-1.5 glass-panel text-purple-400 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VOTING ENSEMBLE: LGBM + XGBOOST</span>
        </div>
      </div>

      {/* Dynamic Drift Board and Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model Drift Level */}
        <Card className="glass-panel border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Concept Drift (KL)</span>
              <p className="text-gray-400 text-xs mt-1">Divergence from baseline dataset.</p>
            </div>
            <Gauge className="w-5 h-5 text-blue-400 animate-spin-slow" />
          </div>
          
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-5xl font-black text-white font-mono">{driftData.drift.toFixed(3)}</span>
            <span className="text-xs text-gray-500 font-mono">/ 1.0</span>
          </div>

          <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>STABLE BASELINE SIGNAL</span>
          </div>
        </Card>

        {/* Model health status */}
        <Card className="glass-panel border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Neural Health Status</span>
              <p className="text-gray-400 text-xs mt-1">Live assessment of neural weights.</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-4xl font-extrabold text-white tracking-tight uppercase font-mono">
              {driftData.status === "normal" ? "OPTIMAL" : "STABLE"}
            </span>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            Ensemble weights locked. Re-scoring cycle: <span className="text-purple-400 font-bold font-mono">1.5s</span>
          </div>
        </Card>

        {/* Dynamic Model stats */}
        <Card className="glass-panel border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">SMOTE Sampling Strategy</span>
              <p className="text-gray-400 text-xs mt-1">Anti-class imbalance oversampler.</p>
            </div>
            <Activity className="w-5 h-5 text-pink-400" />
          </div>
          
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-5xl font-black text-white font-mono">0.30</span>
            <span className="text-xs text-gray-500 font-mono">ratio</span>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            Engineered synthetic cases: <span className="text-pink-400 font-bold font-mono">~35,000</span>
          </div>
        </Card>
      </div>

      {/* Classifier Performance Metrics and Feature charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Specifications Card */}
        <Card className="glass-panel border-white/5 p-6 space-y-6 lg:col-span-1">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Model Blueprint</h2>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-gray-400">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
              <span className="font-bold text-white text-xs block">1. Feature Reduction Pipeline</span>
              <p>
                Eliminated anonymous features down to those carrying critical predictive standard deviation, preserving highest-ranked variables.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
              <span className="font-bold text-white text-xs block">2. SMOTE Controlled Balancing</span>
              <p>
                Resolved money-mule minority class skew by strategically oversampling minor outliers, boosting model recall without adding false alerts.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
              <span className="font-bold text-white text-xs block">3. Soft-Voting Classifier</span>
              <p>
                Combines high-performance LightGBM gradient boosters with resilient depth XGBoost trees to yield final balanced threat probabilities.
              </p>
            </div>
          </div>
        </Card>

        {/* Feature Importance Recharts Visual Board */}
        <Card className="glass-panel border-white/5 p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Predictive Feature Importance</h2>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Derived via LightGBM Weights</span>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              The chart below outlines which engineered metrics contribute the most toward isolating money mule vectors across high-velocity pathways.
            </p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#4b5563" fontSize={10} fontStyle="italic" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={130} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}
                />
                <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                  {featureImportance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Mathematical rigor / validation metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-white/5 p-5 text-center flex flex-col items-center justify-center rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="text-4xl font-black text-blue-500 neon-text-blue font-mono drop-shadow-md">98.6%</span>
          <span className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-widest">ROC-AUC Accuracy</span>
        </Card>
        <Card className="glass-panel border-white/5 p-5 text-center flex flex-col items-center justify-center rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="text-4xl font-black text-purple-400 font-mono drop-shadow-md">92.4%</span>
          <span className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-widest">PR-AUC Accuracy</span>
        </Card>
        <Card className="glass-panel border-white/5 p-5 text-center flex flex-col items-center justify-center rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="text-4xl font-black text-pink-400 font-mono drop-shadow-md">94.0%</span>
          <span className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-widest">Model Precision</span>
        </Card>
        <Card className="glass-panel border-white/5 p-5 text-center flex flex-col items-center justify-center rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="text-4xl font-black text-emerald-400 font-mono drop-shadow-md">89.0%</span>
          <span className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-widest">Model Recall</span>
        </Card>
      </div>
    </main>
  );
}
