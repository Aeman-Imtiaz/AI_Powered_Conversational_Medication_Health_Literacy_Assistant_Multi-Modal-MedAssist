"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, ChartColumn, Download, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import Footer from "../components/Footer";
import ProgressRing from "../components/ProgressRing";
import FloatingBlob from "../components/FloatingBlob";

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

type AdherenceLog = {
  [date: string]: string[];
};

const getDateKey = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDayLabel = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [log, setLog] = useState<AdherenceLog>({});
  const [settingsLanguage, setSettingsLanguage] = useState("en");
  const [settingsLiteracy, setSettingsLiteracy] = useState("simple");
  const [loaded, setLoaded] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!user) {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMedicines([]);
      setLog({});
      setLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        setMedicines(Array.isArray(data.medications) ? data.medications : []);
        setLog(data.adherenceLog && typeof data.adherenceLog === "object" ? data.adherenceLog : {});
        setSettingsLanguage(data.settings?.language || "en");
        setSettingsLiteracy(data.settings?.literacyLevel || "simple");
      } catch {
        setMedicines([]);
        setLog({});
      }
      setLoaded(true);
    };

    loadData();
  }, [user]);

  const totalMeds = medicines.length;

  const last7Days = Array.from({ length: 7 }, (_, i) => 6 - i).map((offset) => {
    const dateKey = getDateKey(offset);
    const takenIds = log[dateKey] || [];
    const percentage = totalMeds > 0 ? Math.round((takenIds.length / totalMeds) * 100) : 0;
    return { label: getDayLabel(offset), percentage, taken: takenIds.length };
  });

  const weekAverage =
    totalMeds > 0
      ? Math.round(last7Days.reduce((sum, day) => sum + day.percentage, 0) / 7)
      : 0;

  const generateSummary = useCallback(async () => {
    if (totalMeds === 0) return;
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const res = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines,
          weekData: last7Days,
          weekAverage,
          language: settingsLanguage,
          literacyLevel: settingsLiteracy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        setSummaryError(data.error || "Something went wrong.");
      }
    } catch {
      setSummaryError("Something went wrong. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }, [totalMeds, medicines, weekAverage, last7Days, settingsLanguage, settingsLiteracy]);

  const downloadPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("MedAssist — Weekly Report", 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Weekly Adherence: ${weekAverage}%`, 14, 32);

    let y = 44;
    pdf.setFontSize(13);
    pdf.text("Daily Breakdown", 14, y);
    pdf.setFontSize(10);
    last7Days.forEach((day) => {
      y += 7;
      pdf.text(`${day.label}: ${day.percentage}% (${day.taken}/${totalMeds} taken)`, 14, y);
    });

    if (summary) {
      y += 12;
      pdf.setFontSize(13);
      pdf.text("AI Summary", 14, y);
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(summary, 180);
      pdf.text(lines, 14, y + 8);
    }

    pdf.save("medassist-weekly-report.pdf");
  };

  const shareViaEmail = () => {
    downloadPDF();
    const subject = encodeURIComponent("My MedAssist Weekly Report");
    const body = encodeURIComponent(
      `Hi,\n\nHere is a summary of my weekly medication adherence: ${weekAverage}%.\n\n${summary || ""}\n\n(Please attach the PDF that was just downloaded to your device before sending.)`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#14B8A6" size={340} top="-100px" left="-100px" />
      <FloatingBlob color="#2563EB" size={280} bottom="60px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#2563EB] flex items-center justify-center shadow-sm">
            <ChartColumn size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Weekly Report
            </h1>
            <p className="text-xs text-slate-400">Your medication journey</p>
          </div>
        </div>
      </motion.div>

      {!loaded ? null : totalMeds === 0 ? (
        <div className="relative w-full max-w-md flex flex-col items-center text-center gap-3 py-14 z-10">
          <div className="w-14 h-14 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
            <TrendingUp size={26} className="text-[#14B8A6]" />
          </div>
          <p className="text-sm text-slate-400 max-w-55">
            Add medicines and start marking them as taken to see your weekly
            report here
          </p>
        </div>
      ) : (
        <>
          <GlassCard delay={0.05} hover={false} className="relative w-full max-w-md p-5 flex items-center justify-between z-10">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Weekly Adherence
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {weekAverage}%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <ProgressRing percentage={weekAverage} size={80} color="#2563EB" />
          </GlassCard>

          <GlassCard delay={0.1} hover={false} className="relative w-full max-w-md p-5 z-10">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Daily Adherence
            </h2>
            <div className="flex items-end justify-between gap-2 h-32">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-24 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(day.percentage, 4)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                      className={`w-full rounded-md ${
                        day.percentage >= 80
                          ? "bg-[#2563EB]"
                          : day.percentage >= 50
                          ? "bg-amber-400"
                          : day.percentage > 0
                          ? "bg-red-300"
                          : "bg-slate-100"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{day.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.15} hover={false} className="relative w-full max-w-md p-5 flex flex-col gap-3 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={15} className="text-[#2563EB]" />
                AI Summary
              </h2>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="text-xs text-[#2563EB] hover:underline disabled:opacity-50"
              >
                {summaryLoading ? "Generating..." : summary ? "Regenerate" : "Generate Summary"}
              </button>
            </div>

            {summaryError && <p className="text-xs text-red-600">{summaryError}</p>}

            {summary ? (
              <>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{summary}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={downloadPDF}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB]/30 rounded-xl py-2 hover:bg-[#2563EB]/5"
                  >
                    <Download size={13} />
                    Download PDF
                  </button>
                  <button
                    onClick={shareViaEmail}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-[#2563EB] rounded-xl py-2 hover:opacity-90"
                  >
                    <Mail size={13} />
                    Share via Email
                  </button>
                </div>
              </>
            ) : (
              !summaryLoading && (
                <p className="text-xs text-slate-400">
                  Tap &quot;Generate Summary&quot; for a plain-language overview of your week.
                </p>
              )
            )}
          </GlassCard>
        </>
      )}

      <Footer />
    </main>
  );
}