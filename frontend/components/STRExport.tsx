"use client";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download, ShieldAlert } from "lucide-react";

export default function STRExport({ report }: { report: any }) {
  const [downloading, setDownloading] = useState(false);

  const generatePDF = async () => {
    setDownloading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/cases/${report.account_id}/str`);
      
      if (!res.ok) throw new Error("Backend PDF generation failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `STR_CASE_${report.account_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Backend PDF generator offline, falling back to client-side jsPDF compile:", e);
      
      // Standalone jsPDF fallback
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Suspicious Transaction Report (FIU-IND Inspired)", 20, 20);
      doc.setFontSize(10);
      doc.text(`Case ID: ${report.case_id}`, 20, 30);
      doc.text(`Account ID: ${report.account_id}`, 20, 36);
      doc.text(`Risk Score: ${report.risk_score}`, 20, 42);
      doc.text(`Fraud Type: ${report.fraud_type}`, 20, 48);
      doc.text(`Confidence: ${(report.confidence * 100).toFixed(0)}%`, 20, 54);
      doc.text(`Recommended Action: ${report.recommended_action || "FREEZE ACCOUNT"}`, 20, 60);
      
      let nextY = 70;
      doc.text("Victims:", 20, nextY);
      (report.victims || []).forEach((v: any, idx: number) => {
        doc.text(
          `- Account ${v.account_id} (${v.bank || "BOI"}): INR ${v.amount.toFixed(2)}`,
          25,
          nextY + 6 + idx * 6,
        );
      });
      
      nextY = nextY + 10 + (report.victims?.length || 0) * 6;
      doc.text("Linked Accounts:", 20, nextY);
      (report.linked_accounts || []).forEach((a: any, idx: number) => {
        doc.text(`- ACT-${a.account_id} (${a.bank || "Bank B"})`, 25, nextY + 6 + idx * 6);
      });

      nextY = nextY + 16 + (report.linked_accounts?.length || 0) * 6;

      if (report.timeline && report.timeline.length > 0) {
        doc.text("Transaction Timeline:", 20, nextY);
        
        const tableColumn = ["Time", "Event Description", "Type"];
        const tableRows = report.timeline.map((event: any) => [
            event.time, 
            event.description, 
            event.type.toUpperCase()
        ]);

        autoTable(doc, {
          startY: nextY + 4,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [220, 38, 38] } // Red header for fraud report
        });
      }

      doc.save(`STR_LOCAL_${report.case_id}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={downloading}
      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
    >
      {downloading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <span>Compiling Regulatory PDF...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export FIU Compliant STR</span>
        </>
      )}
    </Button>
  );
}
