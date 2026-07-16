"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Sparkles } from "lucide-react";

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

const MEDS_KEY = "medassist_medications";
const LOG_KEY = "medassist_adherence_log";

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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [log, setLog] = useState<AdherenceLog>({});
  const [loaded, setLoaded] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    const savedMeds = window.localStorage.getItem(MEDS_KEY);
    if (savedMeds) {
      try {
        const parsed: unknown = JSON.parse(savedMeds);
        if (Array.isArray(parsed)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
          setMedicines(parsed as unknown as Medicine[]);
        }
      } catch {
        window.localStorage.removeItem(MEDS_KEY);
      }
    }

    const savedLog = window.localStorage.getItem(LOG_KEY);
    if (savedLog) {
      try {
        const parsed: unknown = JSON.parse(savedLog);
        if (parsed && typeof parsed === "object") {
          setLog(parsed as AdherenceLog);
        }
      } catch {
        window.localStorage.removeItem(LOG_KEY);
      }
    }

    setLoaded(true);
  }, []);

  const totalMeds = medicines.length;

  const last7Days = Array.from({ length: 7 }, (_, i) => 6 - i).map((offset) => {
    const dateKey = getDateKey(offset);
    const takenIds = log[dateKey] || [];
    const percentage =
      totalMeds > 0 ? Math.round((takenIds.length / totalMeds) * 100) : 0;
    return {
      label: getDayLabel(offset),
      percentage,
      taken: takenIds.length,
    };
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
      const settingsRaw = window.localStorage.getItem("medassist_settings");
      let language = "en";
      let literacyLevel = "simple";
      if (settingsRaw) {
        try {
          const parsed = JSON.parse(settingsRaw);
          language = parsed.language || "en";
          literacyLevel = parsed.literacyLevel || "simple";
        } catch {
          // use defaults
        }
      }

      const res = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines,
          weekData: last7Days,
          weekAverage,
          language,
          literacyLevel,
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
  }, [totalMeds, medicines, weekAverage, last7Days]);

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col items-center px-4 py-10 gap-5">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Weekly Report
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Last 7 days of medication adherence
        </p>
      </div>

      {!loaded ? null : totalMeds === 0 ? (
        <div className="w-full max-w-md flex flex-col items-center text-center gap-3 py-14">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
            <TrendingUp size={26} className="text-teal-700" />
          </div>
          <p className="text-sm text-stone-400 max-w-55">
            Add medicines and start marking them as taken to see your weekly
            report here
          </p>
        </div>
      ) : (
        <>
          <div className="w-full max-w-md bg-teal-700 rounded-2xl p-5 shadow-sm text-white flex items-center justify-between">
            <div>
              <p className="text-xs text-teal-100 uppercase tracking-wide">
                Weekly Average
              </p>
              <p className="text-3xl font-bold mt-1">{weekAverage}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
          </div>

          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">
              Daily Adherence
            </h2>
            <div className="flex items-end justify-between gap-2 h-32">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-24 flex items-end">
                    <div
                      className={`w-full rounded-md transition-all ${
                        day.percentage >= 80
                          ? "bg-teal-600"
                          : day.percentage >= 50
                          ? "bg-amber-400"
                          : day.percentage > 0
                          ? "bg-red-300"
                          : "bg-stone-100"
                      }`}
                      style={{ height: `${Math.max(day.percentage, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <Sparkles size={15} className="text-teal-700" />
                AI Summary
              </h2>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="text-xs text-teal-700 hover:underline disabled:opacity-50"
              >
                {summaryLoading
                  ? "Generating..."
                  : summary
                  ? "Regenerate"
                  : "Generate Summary"}
              </button>
            </div>

            {summaryError && (
              <p className="text-xs text-red-600">{summaryError}</p>
            )}

            {summary ? (
              <p className="text-sm text-stone-600 whitespace-pre-wrap">
                {summary}
              </p>
            ) : (
              !summaryLoading && (
                <p className="text-xs text-stone-400">
                  Tap &quot;Generate Summary&quot; for a plain-language
                  overview of your week.
                </p>
              )
            )}
          </div>
        </>
      )}

      <div className="w-full max-w-md flex items-start gap-2 text-xs text-stone-400 px-1">
        <p>Not a substitute for professional medical advice.</p>
      </div>
    </main>
  );
}