"use client";
import { useEffect, useState } from "react";
import { 
  Radio, 
  PlusCircle, 
  BellRing, 
  Send, 
  Phone, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  FileText, 
  ShieldAlert,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeedsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulated alert ingestion form states
  const [phone, setPhone] = useState("");
  const [fraudType, setFraudType] = useState("SIM Swap");
  const [ingesting, setIngesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchFeeds = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/feeds`)
      .then((res) => res.json())
      .then((data) => {
        // Reverse so newest is first
        setAlerts([...data].reverse());
        setLoading(false);
      })
      .catch(() => {
        setAlerts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIngesting(true);
    setSuccessMsg("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feeds/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          fraud_type: fraudType,
          details: {
            source: "I4C Cyber Crime Coordination Portal",
            severity: "CRITICAL",
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (res.ok) {
        setSuccessMsg("⚠️ Bullet broadcast successfully! Live clients notified.");
        setPhone("");
        // Refresh feed list
        setTimeout(() => {
          fetchFeeds();
          setSuccessMsg("");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  const getSeverityPill = (type: string) => {
    const isCritical = type === "SIM Swap" || type === "Identity Theft";
    return (
      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
        isCritical 
          ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]" 
          : "bg-orange-500/10 border-orange-500/20 text-orange-400"
      }`}>
        {isCritical ? "CRITICAL OUTBREAK" : "WARNING BULLETIN"}
      </span>
    );
  };

  return (
    <main className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Regulatory Feeds</h1>
          </div>
          <p className="text-gray-400">
            Real-time feed ingestion from central intelligence agencies, including I4C bulletins and SIM-swap intelligence.
          </p>
        </div>

        <Button 
          variant="outline"
          size="sm"
          className="glass-panel border-white/10 hover:bg-white/10 text-gray-300 flex items-center space-x-1.5 transition-colors"
          onClick={fetchFeeds}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Database</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Broadcast / Simulation Terminal */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Send className="w-4 h-4 text-blue-400 animate-bounce" />
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Simulate Agency Alert</h2>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            As a judge or operator, simulate feeding cyber-crime bulletins into the system. This triggers instant WebSocket notifications and recalculates account risk profiles automatically.
          </p>

          <form onSubmit={handleIngest} className="space-y-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Linked Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Fraud Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Threat Intelligence Type</label>
              <select
                value={fraudType}
                onChange={(e) => setFraudType(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/80 border border-white/15 rounded-xl text-sm text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60"
              >
                <option value="SIM Swap">SIM Swap Outbreak</option>
                <option value="Mule Alert">Mule Account Recruiter</option>
                <option value="Identity Theft">KYC Deceptive Anomaly</option>
                <option value="Device Spoofing">Device Spoofing Network</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={ingesting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center space-x-1.5 rounded-xl shadow-md transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{ingesting ? "Broadcasting..." : "Broadcast Intelligence"}</span>
            </Button>
          </form>

          {/* Toast Msg */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg text-center animate-pulse">
              {successMsg}
            </div>
          )}
        </div>

        {/* Right Side: Visual Intel Bulletin Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 pb-1">
            <BellRing className="w-4 h-4 text-red-500 animate-pulse" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Bulletins Log</h2>
          </div>

          {loading ? (
            <div className="flex flex-col h-64 items-center justify-center space-y-4 glass-panel rounded-xl">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-blue-400 text-xs font-mono tracking-widest uppercase animate-pulse">Accessing Intelligence Grid...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-center glass-panel rounded-xl">
              <ShieldAlert className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-gray-400 font-medium">No bulletins active in the database.</p>
              <p className="text-xs text-gray-500 mt-1">Use the panel on the left to inject simulated threat intelligence.</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1">
              {alerts.map((alert, idx) => (
                <Card key={idx} className="glass-panel border-white/5 p-5 relative overflow-hidden group transition-all duration-300 hover:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityPill(alert.fraud_type)}
                        <span className="text-[10px] text-gray-500 font-mono font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{alert.details?.timestamp ? new Date(alert.details.timestamp).toLocaleTimeString() : "Live Broadcast"}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-lg font-bold text-white font-mono">{alert.fraud_type} Incident</span>
                      </div>
                      
                      <div className="flex items-center space-x-1.5 text-sm text-gray-400">
                        <span className="text-gray-500">Phone Identifier:</span>
                        <span className="font-mono text-gray-300 font-semibold">{alert.phone}</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto p-3 bg-black/40 rounded-lg border border-white/5 text-xs text-gray-400 font-mono space-y-1">
                      <div className="flex justify-between space-x-8">
                        <span className="text-gray-500">Intel Hub:</span>
                        <span className="text-gray-300">{alert.details?.source || "Regulatory Portal"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vector:</span>
                        <span className="text-emerald-400">BROADCASTED</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
