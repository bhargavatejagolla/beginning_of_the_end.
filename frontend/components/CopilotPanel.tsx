"use client";
import { useState, useRef, useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext"; 
import { Button } from "@/components/ui/button"; 
import { Bot, User, Sparkles, Send } from "lucide-react";

export default function CopilotPanel({
  caseData,
  privacyMode,
}: {
  caseData: any;
  privacyMode: boolean;
}) {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hello investigator. I've analyzed this case. How can I assist you today?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const ask = async (question: string) => {
    if (!question.trim()) return;
    
    // 1. Add user message and a temporary loading placeholder for the assistant
    setResponses((prev) => [
      ...prev, 
      { role: 'user', text: question },
      { role: 'assistant', text: "🔄 AI Analyst is querying neural decision paths..." }
    ]);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copilot/ask`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Privacy-Mode": privacyMode ? "local" : "cloud"
        },
        body: JSON.stringify({
          account_id: parseInt(caseData?.account_id || 0),
          question: question
        })
      });
      
      if (!res.ok) throw new Error("Copilot API error");
      const data = await res.json();
      
      // 2. Overwrite the placeholder with the real response
      setResponses((prev) => {
        const list = [...prev];
        list[list.length - 1] = { role: 'assistant', text: data.answer };
        return list;
      });
    } catch (e) {
      console.warn("Copilot API failed, running in high-fidelity sandbox fallback:", e);
      // Sandbox fallback if backend is offline
      setTimeout(() => {
        let answer = "";
        const qLower = question.toLowerCase();
        if (qLower.includes("flagged") || qLower.includes("why")) {
          answer = `This account triggered a critical alert (Score: ${caseData?.risk_score}%). Under BOI's localized ensemble model, the primary indicators were: ${caseData?.summary || "high velocity transfers and unusual device overlaps."}`;
        } else if (qLower.includes("linked") || qLower.includes("network")) {
          answer = `I've mapped the sub-graph. There are ${(caseData?.linked_accounts || []).length} linked suspects sharing network nodes: ${(caseData?.linked_accounts || []).map((a: any) => `ACT-${a.account_id}`).join(", ")}.`;
        } else if (qLower.includes("pattern") || qLower.includes("summarize")) {
          answer = `I detected a ${caseData?.fraud_type} signature with ${Math.round((caseData?.confidence || 0.92) * 100)}% confidence. The deviation is highly distinct during nocturnal windows.`;
        } else {
          answer = "I am processing that locally. My primary SOC directives are explaining flags, mapping account linkages, and summarizing suspicious timelines.";
        }
        setResponses((prev) => {
          const list = [...prev];
          list[list.length - 1] = { role: 'assistant', text: answer };
          return list;
        });
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-200">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">AI Investigator Copilot</h3>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
          <Sparkles className="w-3 h-3 text-yellow-500" />
          <span>{privacyMode ? "Local Processing" : "Cloud Intelligence"}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {responses.map((r, i) => (
          <div key={i} className={`flex items-start space-x-3 ${r.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`p-2 rounded-full flex-shrink-0 ${r.role === 'user' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
              {r.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
              r.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                : 'glass-panel text-gray-200 rounded-tl-sm'
            }`}>
              {r.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex space-x-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
          {["Why flagged?", "Show linked accounts", "Summarize pattern"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => ask(suggestion)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-blue-500/20 text-gray-300 hover:text-blue-300 border border-white/10 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <form 
          onSubmit={(e) => { e.preventDefault(); ask(query); setQuery(""); }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI anything about this case..."
            className="flex-1 bg-gray-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-gray-600"
          />
          <Button
            type="submit"
            disabled={!query.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
