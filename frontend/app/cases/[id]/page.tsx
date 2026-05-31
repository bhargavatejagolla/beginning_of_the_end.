"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RadarChart from "@/components/RadarChart";
import TimelineReplay from "@/components/TimelineReplay";
import EntityLinkerGraph from "@/components/EntityLinkerGraph";
import CopilotPanel from "@/components/CopilotPanel";
import STRExport from "@/components/STRExport";
import { Button } from "@/components/ui/button";

export default function InvestigationPage() {
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // Phase 3 FIU Submission Modal States
  const [fiuModalOpen, setFiuModalOpen] = useState(false);
  const [fiuStep, setFiuStep] = useState(0);
  const [fiuLogs, setFiuLogs] = useState<string[]>([]);

  useEffect(() => {
    // Fetch investigation data from backend
    async function fetchData() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/investigate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: parseInt(id), features: {} }),
          },
        );
        const data = await res.json();
        setCaseData(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [id]);

  if (!caseData) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-blue-400 font-mono tracking-widest animate-pulse uppercase">Fetching Neural Analysis...</p>
      </div>
    </div>
  );

  const radarData = [
    { axis: "Velocity", value: Math.min(Math.max((caseData.features?.BehaviorStd || 1.2) / 3.0, 0.1), 1.0) },
    { axis: "Night", value: caseData.features?.night_activity || (caseData.features?.BehaviorNonZeroCount % 2 === 0) ? 0.85 : 0.25 },
    { axis: "Device", value: caseData.risk_score >= 70 ? 0.85 : 0.15 },
    { axis: "Beneficiary", value: Math.min(Math.max((caseData.features?.BehaviorNonZeroCount || 2) / 12.0, 0.15), 1.0) },
    { axis: "Geo", value: caseData.risk_score >= 80 ? 0.75 : 0.2 },
    { axis: "Dormancy", value: Math.min(Math.max(100.0 / ((caseData.features?.AccountAgeDays || 30) + 1.0), 0.1), 1.0) },
  ];

  const timelineEvents = caseData.timeline || [
    {
      time: "11:47 PM",
      description: "Victim transfer ₹50,000",
      type: "transfer" as const,
    },
    { time: "11:47:04", description: "Mule receives funds", type: "transfer" as const },
    { time: "11:47:12", description: "Split into 4 accounts", type: "split" as const },
    {
      time: "11:47:19",
      description: "Device overlap detected",
      type: "detection" as const,
    },
    { time: "11:47:25", description: "Freeze recommendation", type: "freeze" as const },
  ];

  // Phase 3 FIU Submission Modal States handled at top level

  const startFiuSubmission = () => {
    setFiuModalOpen(true);
    setFiuStep(1);
    setFiuLogs([
      "🔒 GENERATING SECURE END-TO-END GATEWAY TO FINANCIAL INTELLIGENCE UNIT (FIU-IND)...",
    ]);

    setTimeout(() => {
      setFiuStep(2);
      setFiuLogs(prev => [
        ...prev,
        "🔑 ENCRYPTING CASE DATA ENVELOPE WITH BRANCH AES-256 CIPHER...",
        "🔑 GENERATING COMPLIANT AUTHORIZED OFFICERS PKI DIGITAL SIGNATURE...",
      ]);
    }, 1200);

    setTimeout(() => {
      setFiuStep(3);
      setFiuLogs(prev => [
        ...prev,
        "⚡ SECURE TRANSACTION REPORT (STR) BINARY METADATA TRANSMITTED SUCCESSFUL...",
        "⚡ REGISTERING RECIPIENT REGULATORY INCIDENT TICKET IN NATIONAL CENTRAL DATABASE...",
      ]);
    }, 2500);

    setTimeout(() => {
      setFiuStep(4);
      setFiuLogs(prev => [
        ...prev,
        "🎉 STATUS: COMPLETED SUCCESSFULLY.",
        `🎉 NATIONAL INCIDENT REGISTRATION RECEIPT GENERATED: BOI-2026-FIU-${id}-${Math.floor(1000 + Math.random()*9000)}`,
        "🛡️ SECURITY LOCK APPLIED: THIS ACCOUNT IS NOW FROZEN AT GENERAL CORE BANKING SUITE."
      ]);
    }, 3800);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      {/* Dynamic FIU compliance gateway hologram modal overlay */}
      {fiuModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[550px] bg-[#09090c] border border-white/10 p-6 rounded-2xl shadow-2xl space-y-6 font-mono relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.03)_0%,_transparent_75%)] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center space-x-2 text-red-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold text-sm tracking-widest">FIU GATEWAY SECURE TRANSMISSION</span>
              </div>
              {fiuStep === 4 && (
                <button 
                  onClick={() => setFiuModalOpen(false)}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all"
                >
                  Close Gateway
                </button>
              )}
            </div>

            {/* Matrix logs console */}
            <div className="bg-black border border-white/5 p-4 rounded-xl text-[10px] text-emerald-400 space-y-3 h-[250px] overflow-y-auto custom-scrollbar relative z-10 shadow-inner">
              {fiuLogs.map((log, index) => {
                const isStepFinished = index < fiuStep;
                return (
                  <div key={index} className="flex items-start space-x-2 animate-in fade-in duration-500">
                    <span className="text-gray-600 select-none">&gt;&gt;</span>
                    <span className={log.startsWith("🎉") ? "text-emerald-300 font-bold" : ""}>{log}</span>
                  </div>
                );
              })}
              {fiuStep < 4 && (
                <div className="flex items-center space-x-2 text-gray-500 animate-pulse text-[9px] pt-2">
                  <div className="w-3 h-3 border-2 border-gray-500/20 border-t-gray-500 rounded-full animate-spin"></div>
                  <span>Transmitting telemetry packets to FIU-IND Central Node...</span>
                </div>
              )}
            </div>

            {/* Visual steps indicator */}
            <div className="grid grid-cols-4 gap-2 relative z-10 pt-2 border-t border-white/5">
              {[
                { name: "CONNECT", val: 1 },
                { name: "ENCRYPT", val: 2 },
                { name: "SEND", val: 3 },
                { name: "COMPLETE", val: 4 }
              ].map((step) => {
                const active = fiuStep >= step.val;
                return (
                  <div 
                    key={step.name} 
                    className={`text-center py-2 rounded-lg border text-[10px] font-bold transition-all ${
                      fiuStep === step.val 
                        ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse" 
                        : active 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-white/5 border-white/5 text-gray-600"
                    }`}
                  >
                    {step.name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Investigation Case</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-sm">#{caseData.case_id}</span>
          </div>
          <p className="text-gray-400 font-medium">Account ID: <span className="text-gray-200">{id}</span></p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 glass-panel px-4 py-2 rounded-xl">
          <span className="text-sm text-gray-300 font-medium">AI Privacy Mode</span>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${privacyMode ? "bg-green-500" : "bg-gray-600"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacyMode ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-xs font-bold ${privacyMode ? 'text-green-400' : 'text-blue-400'}`}>
            {privacyMode ? "LOCAL (Secure Heuristic)" : "CLOUD (Llama3 Analysis)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Risk Assessment</h2>
          <div className="flex items-baseline space-x-2">
            <span className="text-6xl font-black text-red-500 neon-text-red drop-shadow-md">{caseData.risk_score}</span>
            <span className="text-xl text-gray-300">/ 100</span>
          </div>
          <p className="text-red-400 font-bold mt-2 flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span> {caseData.risk_level}</p>
          <p className="text-sm text-gray-300 mt-4 leading-relaxed border-l-2 border-red-500/50 pl-3">{caseData.summary}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Pattern Recognition</h2>
          <p className="text-3xl font-bold text-orange-400 tracking-tight">{caseData.fraud_type}</p>
          <div className="mt-4 bg-gray-900/50 rounded-full h-2 w-full overflow-hidden border border-white/5">
            <div className="bg-gradient-to-r from-orange-600 to-yellow-400 h-full rounded-full" style={{ width: `${Math.round(caseData.confidence * 100)}%` }}></div>
          </div>
          <p className="text-right text-xs text-orange-300 mt-2 font-mono">{Math.round(caseData.confidence * 100)}% Confidence Match</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Incident Response</h2>
          <div className="space-y-3">
            <Button 
              onClick={startFiuSubmission}
              className="w-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              Freeze Account (Critical)
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="glass-panel hover:bg-green-500/10 hover:text-green-400 transition-colors border-white/10">Mark Safe</Button>
              <Button variant="outline" className="glass-panel hover:bg-blue-500/10 hover:text-blue-400 transition-colors border-white/10">Escalate to L2</Button>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-200">Fraud Timeline</h2>
            <div className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/5">Auto-generated</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <TimelineReplay events={timelineEvents} />
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-200">Behavioural Fingerprint</h2>
            <div className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/5">Deviation Analysis</div>
          </div>
          <div className="h-[300px] bg-black/20 rounded-xl border border-white/5 p-2">
            <RadarChart data={radarData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">Graph Network Linkages</h2>
          <div className="flex-1 bg-black/40 rounded-xl border border-white/5 min-h-[400px]">
            <EntityLinkerGraph linkedAccounts={caseData.linked_accounts} />
          </div>
        </div>
        <div className="glass-panel p-0 overflow-hidden flex flex-col h-[500px]">
          <CopilotPanel caseData={caseData} privacyMode={privacyMode} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <STRExport report={caseData} />
      </div>
    </div>
  );
}
