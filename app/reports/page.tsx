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

// --- PDF color helpers ---
type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const PDF_COLORS = {
  blue: hexToRgb("#2563EB"),
  cyan: hexToRgb("#06B6D4"),
  green: hexToRgb("#10B981"),
  amber: hexToRgb("#FBBF24"),
  red: hexToRgb("#F87171"),
  redLight: hexToRgb("#FCA5A5"),
  slate900: hexToRgb("#0F172A"),
  slate500: hexToRgb("#64748B"),
  slate400: hexToRgb("#94A3B8"),
  slate100: hexToRgb("#F1F5F9"),
  slateBg: hexToRgb("#F8FAFC"),
  summaryBg: hexToRgb("#EFF6FF"),
  white: [255, 255, 255] as RGB,
};

const barColor = (pct: number): RGB => {
  if (pct >= 80) return PDF_COLORS.blue;
  if (pct >= 50) return PDF_COLORS.amber;
  if (pct > 0) return PDF_COLORS.redLight;
  return PDF_COLORS.slate100;
};

const medColor = (pct: number): RGB => {
  if (pct >= 80) return PDF_COLORS.green;
  if (pct >= 50) return PDF_COLORS.amber;
  return PDF_COLORS.red;
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

  const perMedicineStats = medicines.map((med) => {
    let takenDays = 0;
    for (let offset = 0; offset < 7; offset++) {
      const dateKey = getDateKey(offset);
      if ((log[dateKey] || []).includes(med.id)) takenDays++;
    }
    return {
      name: med.name,
      percentage: Math.round((takenDays / 7) * 100),
    };
  }).sort((a, b) => a.percentage - b.percentage);

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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    const c = PDF_COLORS;

    const ensureSpace = (currentY: number, needed: number) => {
      if (currentY + needed > pageHeight - 20) {
        pdf.addPage();
        return 20;
      }
      return currentY;
    };

    // --- Header banner ---
    pdf.setFillColor(...c.blue);
    pdf.rect(0, 0, pageWidth, 38, "F");

    pdf.setTextColor(...c.white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("MedAssist", marginX, 18);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Weekly Adherence Report", marginX, 27);

    pdf.setFontSize(9);
    pdf.text(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      marginX,
      34
    );

    let y = 52;

    // --- Weekly Adherence summary card ---
    pdf.setFillColor(...c.slateBg);
    pdf.roundedRect(marginX, y, contentWidth, 30, 3, 3, "F");

    pdf.setTextColor(...c.slate500);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("WEEKLY ADHERENCE", marginX + 8, y + 10);

    pdf.setTextColor(...c.slate900);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text(`${weekAverage}%`, marginX + 8, y + 21);

    pdf.setTextColor(...c.slate400);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Last 7 days", marginX + 8, y + 26);

    // mini progress bar (right side of card)
    const barW = 60;
    const barX = marginX + contentWidth - barW - 8;
    const barY = y + 14;
    pdf.setFillColor(...c.slate100);
    pdf.roundedRect(barX, barY, barW, 5, 2, 2, "F");
    pdf.setFillColor(...barColor(weekAverage));
    pdf.roundedRect(barX, barY, (barW * Math.min(weekAverage, 100)) / 100, 5, 2, 2, "F");

    y += 42;

    // --- Daily Adherence bar chart ---
    pdf.setTextColor(...c.slate900);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Daily Adherence", marginX, y);
    y += 10;

    const chartHeight = 32;
    const chartTop = y;
    const barGap = 4;
    const barWidth = (contentWidth - barGap * (last7Days.length - 1)) / last7Days.length;

    last7Days.forEach((day, i) => {
      const x = marginX + i * (barWidth + barGap);
      const h = Math.max((day.percentage / 100) * chartHeight, 2);
      const color = barColor(day.percentage);

      // background track
      pdf.setFillColor(...c.slate100);
      pdf.roundedRect(x, chartTop, barWidth, chartHeight, 1, 1, "F");

      // value bar (bottom-aligned)
      pdf.setFillColor(...color);
      pdf.roundedRect(x, chartTop + (chartHeight - h), barWidth, h, 1, 1, "F");

      // percentage above bar
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...c.slate500);
      pdf.text(`${day.percentage}%`, x + barWidth / 2, chartTop - 2, { align: "center" });

      // day label below bar
      pdf.setFontSize(8);
      pdf.setTextColor(...c.slate400);
      pdf.text(day.label, x + barWidth / 2, chartTop + chartHeight + 6, { align: "center" });
    });

    y = chartTop + chartHeight + 18;

    // --- Per-Medicine Adherence ---
    y = ensureSpace(y, 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...c.slate900);
    pdf.text("Per-Medicine Adherence", marginX, y);
    y += 9;

    perMedicineStats.forEach((med) => {
      y = ensureSpace(y, 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...c.slate500);
      pdf.text(med.name, marginX, y);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...medColor(med.percentage));
      pdf.text(`${med.percentage}%`, marginX + contentWidth, y, { align: "right" });

      y += 3;
      pdf.setFillColor(...c.slate100);
      pdf.roundedRect(marginX, y, contentWidth, 3, 1.5, 1.5, "F");
      pdf.setFillColor(...medColor(med.percentage));
      pdf.roundedRect(marginX, y, (contentWidth * med.percentage) / 100, 3, 1.5, 1.5, "F");

      y += 11;
    });

    // --- AI Summary ---
    if (summary) {
      const lines: string[] = pdf.splitTextToSize(summary, contentWidth - 16);
      const boxHeight = lines.length * 5 + 20;

      y = ensureSpace(y + 4, boxHeight);

      pdf.setFillColor(...c.summaryBg);
      pdf.roundedRect(marginX, y, contentWidth, boxHeight, 3, 3, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...c.blue);
      pdf.text("AI Summary", marginX + 8, y + 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...c.slate500);
      pdf.text(lines, marginX + 8, y + 18);

      y += boxHeight + 10;
    }

    // --- Footer disclaimer on every page ---
    const pageCount = pdf.internal.pages.length - 1;
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...c.slate400);
      pdf.text(
        "MedAssist provides educational information only and is not a substitute for professional medical advice.",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      pdf.text(`Page ${p} of ${pageCount}`, pageWidth - marginX, pageHeight - 10, {
        align: "right",
      });
    }

    pdf.save("medassist-weekly-report.pdf");
  };

  const shareViaEmail = () => {
    downloadPDF();
    const subject = encodeURIComponent("My MedAssist Weekly Report");
    const body = encodeURIComponent(
      `Hi,\n\nHere is a summary of my weekly medication adherence: ${weekAverage}%.\n\n${summary || ""}\n\n(Please attach the PDF that was just downloaded to your device before sending.)`
    );
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <main className="relative flex-1 bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
      <FloatingBlob color="#14B8A6" size={340} top="-100px" left="-100px" />
      <FloatingBlob color="#2563EB" size={280} bottom="60px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl z-10"
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
        <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-3 py-14 z-10">
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
          <GlassCard delay={0.05} hover={false} className="relative w-full max-w-2xl p-5 flex items-center justify-between z-10">
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

          <GlassCard delay={0.1} hover={false} className="relative w-full max-w-2xl p-5 z-10">
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

          <GlassCard delay={0.12} hover={false} className="relative w-full max-w-2xl p-5 z-10">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Per-Medicine Adherence
            </h2>
            <div className="flex flex-col gap-3">
              {perMedicineStats.map((med) => (
                <div key={med.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{med.name}</span>
                    <span
                      className={
                        med.percentage >= 80
                          ? "text-[#10B981] font-semibold"
                          : med.percentage >= 50
                          ? "text-amber-600 font-semibold"
                          : "text-red-500 font-semibold"
                      }
                    >
                      {med.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        med.percentage >= 80
                          ? "bg-[#10B981]"
                          : med.percentage >= 50
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${med.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.15} hover={false} className="relative w-full max-w-2xl p-5 flex flex-col gap-3 z-10">
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