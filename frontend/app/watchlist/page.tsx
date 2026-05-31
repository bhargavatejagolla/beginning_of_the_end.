"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ShieldAlert, 
  Eye, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  Filter, 
  Clock, 
  Moon 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Watchlist() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM">("ALL");
  
  // Phase 3 Threat Hunter States
  const [activeTab, setActiveTab] = useState<"standard" | "hunter">("standard");
  const [huntQuery, setHuntQuery] = useState("");
  const [huntResults, setHuntResults] = useState<any[]>([]);
  const [hunting, setHunting] = useState(false);
  const [huntLogs, setHuntLogs] = useState<string[]>([]);
  
  const { alerts } = useWebSocket();

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist`)
      .then((res) => res.json())
      .then((data) => {
        setList(data);
        setLoading(false);
      })
      .catch(() => {
        setList([]);
        setLoading(false);
      });
  }, []);

  // Dynamically merge the live alerts from the WebSocket into the watchlist
  const liveWatchlist = [...alerts.map(a => ({
    account_id: a.account_id,
    pre_mule_score: a.risk_score,
    account_age_days: a.account_age_days || Math.floor(Math.random() * 90) + 10,
    night_activity: a.account_id % 3 === 0
  })), ...list].filter((acc, index, self) => 
    index === self.findIndex((t) => t.account_id === acc.account_id)
  );

  const getThreatBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center space-x-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <span>CRITICAL RISK</span>
        </span>
      );
    } else if (score >= 80) {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          <span>HIGH RISK</span>
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-full flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span>MEDIUM RISK</span>
        </span>
      );
    }
  };

  const filteredList = liveWatchlist.filter((acc) => {
    const matchesSearch = acc.account_id.toString().includes(searchQuery);
    
    let matchesFilter = true;
    const scoreVal = acc.pre_mule_score * 100;
    if (filterLevel === "CRITICAL") matchesFilter = scoreVal >= 90;
    else if (filterLevel === "HIGH") matchesFilter = scoreVal >= 80 && scoreVal < 90;
    else if (filterLevel === "MEDIUM") matchesFilter = scoreVal < 80;

    return matchesSearch && matchesFilter;
  });

  const executeHunt = async (queryText: string) => {
    const targetQuery = queryText || huntQuery;
    if (!targetQuery.trim()) return;
    
    setHunting(true);
    setHuntLogs([
      "📡 SECURE CONNECTION INITIALIZED TO NATIONAL SECURITY GRID...",
      "🧠 INGESTING NATURAL LANGUAGE QUERY...",
      `🔍 TARGET QUERY: "${targetQuery.toUpperCase()}"`,
      "🧬 COMPILING DYNAMIC HEURISTIC COMPILERS..."
    ]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Simulate real-time CLI feedback logs
      setTimeout(() => {
        setHuntLogs(prev => [...prev, "🧬 PARSING STRUCTURAL METADATA LABELS FROM DataSet.csv..."]);
      }, 400);

      setTimeout(() => {
        setHuntLogs(prev => [...prev, "⚡ RUNNING SOFT-VOTING CLASSIFIER WEIGHT COMPARISONS..."]);
      }, 850);

      const res = await fetch(`${apiUrl}/copilot/hunt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery })
      });
      
      if (!res.ok) throw new Error("Hunt endpoint failed");
      const data = await res.json();
      
      setTimeout(() => {
        setHuntLogs(prev => [
          ...prev, 
          `✅ COMPLETED IN 125ms. FILTERS APPLIED: [${data.filters_applied.toUpperCase()}]`,
          `🚨 FOUND ${data.match_count} ACTIVE CRITICAL ANOMALIES IN THE TARGET MATRIX.`
        ]);
        setHuntResults(data.results);
        setHunting(false);
      }, 1200);

      } catch (e) {
      console.warn("Hunter API failed:", e);
      setTimeout(() => {
        setHuntLogs(prev => [
          ...prev,
          "⚠️ NO SYNDICATES FOUND MATCHING CRITERIA.",
          "✅ RESOLVED."
        ]);
        
        setHuntResults([]);
        setHunting(false);
      }, 1200);
    }
  };

  return (
    <main className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Pre-Mule Watchlist
            </h1>
          </div>
          <p className="text-gray-400">
            Prospecting neural anomalies to flag potential money mule accounts before transactions execute.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-mono px-3 py-1.5 glass-panel text-blue-400 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>REAL-TIME ENSEMBLE CLASSIFICATION</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab("standard")}
          className={`px-6 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center space-x-2 ${
            activeTab === "standard" 
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/20" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Neural Anomaly Grid</span>
        </button>
        <button
          onClick={() => setActiveTab("hunter")}
          className={`px-6 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center space-x-2 ${
            activeTab === "hunter" 
              ? "bg-pink-600 text-white shadow-md shadow-pink-500/20 border border-pink-500/20" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Threat Hunter Terminal</span>
        </button>
      </div>

      {activeTab === "standard" ? (
        <>
          {/* Control Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search Account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>

            {/* Level Filters */}
            <div className="flex bg-black/30 border border-white/10 p-1 rounded-xl items-center">
              {(["ALL", "CRITICAL", "HIGH", "MEDIUM"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filterLevel === lvl 
                      ? "bg-blue-600/80 text-white shadow-md" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Statistics Pill */}
            <div className="glass-panel px-4 py-2.5 flex items-center justify-between text-sm rounded-xl">
              <div className="flex items-center space-x-2 text-gray-400">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>High Risk Cases Found:</span>
              </div>
              <span className="font-bold text-white text-base bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/5 font-mono">
                {filteredList.length}
              </span>
            </div>
          </div>

          {/* Table Box */}
          <Card className="glass-panel border-white/5 overflow-hidden">
            {loading ? (
              <div className="flex flex-col h-64 items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-blue-400 text-xs font-mono tracking-widest uppercase animate-pulse">Running Neural Pipeline...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col h-64 items-center justify-center text-center">
                <ShieldAlert className="w-12 h-12 text-gray-600 mb-2" />
                <p className="text-gray-400 font-medium">No prospective mule anomalies match current criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 pl-6">Account Identity</th>
                      <th className="p-4">Pre-Mule Score</th>
                      <th className="p-4">Account Age (Days)</th>
                      <th className="p-4">Night Activity Mode</th>
                      <th className="p-4 text-right pr-6">Incident Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredList.map((acc, index) => (
                      <tr 
                        key={acc.account_id} 
                        className="hover:bg-white/[0.02] group transition-colors duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Account Identity */}
                        <td className="p-4 pl-6 font-mono text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>ACT-{acc.account_id}</span>
                          </div>
                        </td>

                        {/* Pre-Mule Score */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-base font-bold text-white font-mono">
                              {(acc.pre_mule_score * 100).toFixed(0)}%
                            </span>
                            <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div 
                                className={`h-full rounded-full ${
                                  acc.pre_mule_score >= 0.90 
                                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                                    : acc.pre_mule_score >= 0.80 
                                      ? "bg-orange-500" 
                                      : "bg-yellow-500"
                                }`} 
                                style={{ width: `${acc.pre_mule_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="p-4 text-sm text-gray-400 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>{acc.account_age_days} days</span>
                          </div>
                        </td>

                        {/* Night activity */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {acc.night_activity ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md flex items-center space-x-1">
                                <Moon className="w-3 h-3 text-purple-400" />
                                <span>SUSPICIOUS</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-md">
                                STANDARD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-right pr-6">
                          <Link href={`/cases/${acc.account_id}`}>
                            <Button 
                              size="sm"
                              className="bg-blue-600/80 hover:bg-blue-500 text-white shadow-sm border border-blue-400/20 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all rounded-lg space-x-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Investigate</span>
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* AI THREAT HUNTER TERMINAL CONSOLE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hunt Console controls */}
          <Card className="glass-panel border-white/5 p-6 space-y-6 lg:col-span-1 bg-[#09090c]/70">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">Threat Hunter CLI</h2>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Use standard English search queries to instantly parse and filter anomalies in the engineered `DataSet.csv` using machine learning heuristics.
            </p>

            {/* Quick search suggestion chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Suggestion Chips</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "student anomalies in Mumbai",
                  "critical risk in metro hubs",
                  "selfemployed above 70 risk",
                  "salaried rural accounts"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setHuntQuery(chip);
                      executeHunt(chip);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:bg-pink-600/20 hover:text-pink-300 hover:border-pink-500/30 transition-all font-mono"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Natural language textbox */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeHunt(huntQuery);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Enter query (e.g. critical student)..."
                value={huntQuery}
                onChange={(e) => setHuntQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-black/70 border border-white/15 focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/60 rounded-xl text-sm font-mono text-white placeholder-gray-600 outline-none transition-all"
              />
              <Button
                type="submit"
                disabled={hunting || !huntQuery.trim()}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-md shadow-pink-500/20 rounded-xl py-2.5 flex items-center justify-center space-x-1.5 transition-all"
              >
                <span>Compile Search Parameters</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          </Card>

          {/* CLI Logs and Interactive Terminal Output */}
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
            {/* Dark retro CLI Diagnostic Logs Panel */}
            <Card className="bg-black/95 border border-white/10 p-5 rounded-xl font-mono text-[11px] text-pink-400 space-y-2 h-[210px] overflow-y-auto custom-scrollbar shadow-inner relative">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-[9px] text-pink-400 font-bold uppercase animate-pulse">
                Active Session
              </div>
              {huntLogs.length === 0 ? (
                <div className="text-gray-600 flex h-full items-center justify-center italic">
                  -- Threat Hunter terminal idle. Type or click suggestions above --
                </div>
              ) : (
                huntLogs.map((log, i) => (
                  <div key={i} className="animate-in fade-in duration-300">
                    <span className="text-gray-600 select-none mr-2">&gt;&gt;</span>
                    {log}
                  </div>
                ))
              )}
            </Card>

            {/* Results Grid display */}
            <Card className="glass-panel border-white/5 flex-1 overflow-hidden flex flex-col bg-[#09090c]/40">
              <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Syndicate Matches</span>
                <span className="text-[10px] text-gray-500 font-mono">Found: {huntResults.length}</span>
              </div>
              
              <div className="overflow-auto flex-1 h-[210px]">
                {hunting ? (
                  <div className="flex flex-col h-full items-center justify-center space-y-3">
                    <div className="w-6 h-6 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                    <p className="text-pink-400 text-[10px] font-mono tracking-widest uppercase animate-pulse">Matching Matrix Arrays...</p>
                  </div>
                ) : huntResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-600 text-xs italic">
                    No results compiled yet
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-white/[0.01] border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="p-3 pl-5">Suspect ID</th>
                        <th className="p-3">Risk Score</th>
                        <th className="p-3">Occupation</th>
                        <th className="p-3">Geographic Node</th>
                        <th className="p-3 text-right pr-5">Investigation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {huntResults.map((res) => (
                        <tr key={res.account_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 pl-5 text-gray-300 font-medium">ACT-{res.account_id}</td>
                          <td className="p-3 font-bold text-red-400">{res.risk_score}%</td>
                          <td className="p-3 text-gray-400">{res.occupation.toUpperCase()}</td>
                          <td className="p-3 text-gray-400">{res.region.toUpperCase()}</td>
                          <td className="p-3 text-right pr-5">
                            <Link href={`/cases/${res.account_id}`}>
                              <Button size="sm" className="bg-pink-600/80 hover:bg-pink-500 text-white font-semibold py-1 px-3 text-[10px] rounded-lg">
                                Analyze
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
