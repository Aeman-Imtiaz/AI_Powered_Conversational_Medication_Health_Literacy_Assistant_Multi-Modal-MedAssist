"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Users, Pill, FileText, Image as ImageIcon, X, ChevronDown } from "lucide-react";
import GlassCard from "../components/GlassCard";
import FloatingBlob from "../components/FloatingBlob";

type Owner = { uid: string; name: string };
type Medicine = { id: string; name: string; dosage: string; frequency: string };

type Test = {
  name: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: "high" | "low" | "normal" | "unclear";
};

type SavedReport =
  | {
      id: string;
      kind: "lab";
      labName: string | null;
      reportDate: string | null;
      reportType: string | null;
      tests: Test[];
      summary: string;
      addedAt: string;
    }
  | {
      id: string;
      kind: "scan";
      label: string;
      reportDate: string | null;
      fileUrl: string;
      addedAt: string;
    };

export default function SharedPage() {
  const { user } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selected, setSelected] = useState<Owner | null>(null);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [tab, setTab] = useState<"medications" | "reports">("medications");
  const [loaded, setLoaded] = useState(false);
  const [viewingScan, setViewingScan] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      const shareDocId = user.email!.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const snap = await getDoc(doc(db, "shares", shareDocId));
      if (snap.exists() && Array.isArray(snap.data().owners)) {
        setOwners(snap.data().owners as Owner[]);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const viewOwner = async (owner: Owner) => {
    if (selected?.uid === owner.uid) {
      setSelected(null);
      return;
    }

    setSelected(owner);
    setTab("medications");
    const snap = await getDoc(doc(db, "users", owner.uid));
    const data = snap.exists() ? snap.data() : {};
    setMeds(Array.isArray(data.medications) ? data.medications : []);
    setReports(Array.isArray(data.medicalReports) ? data.medicalReports : []);
  };

  const abnormalCount = (r: Extract<SavedReport, { kind: "lab" }>) =>
    r.tests.filter((t) => t.flag === "high" || t.flag === "low").length;

  const flagColor = (flag: string) => {
    if (flag === "high") return "text-red-600 bg-red-50";
    if (flag === "low") return "text-amber-600 bg-amber-50";
    if (flag === "normal") return "text-[#10B981] bg-[#10B981]/10";
    return "text-slate-400 bg-slate-50";
  };

  const totalAbnormalForOwner = reports
    .filter((r): r is Extract<SavedReport, { kind: "lab" }> => r.kind === "lab")
    .reduce((sum, r) => sum + abnormalCount(r), 0);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#14B8A6" size={300} top="-90px" right="-100px" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#2563EB] flex items-center justify-center shadow-sm">
            <Users size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Shared With Me
            </h1>
            <p className="text-xs text-slate-400">
              Family members who added you as a caregiver
            </p>
          </div>
        </div>
      </motion.div>

      {loaded && owners.length === 0 && (
        <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-3 py-14 z-10">
          <div className="w-14 h-14 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
            <Users size={26} className="text-[#14B8A6]" />
          </div>
          <p className="text-sm text-slate-400 max-w-55">
            No one has shared their medications with you yet
          </p>
        </div>
      )}

      <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
        {owners.map((owner) => {
          const isOpen = selected?.uid === owner.uid;
          return (
            <GlassCard key={owner.uid} className="p-4">
              <button
                onClick={() => viewOwner(owner)}
                className="w-full text-left flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-800">{owner.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-[#2563EB]">
                  {isOpen ? "Hide details" : "View details"}
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {/* Sub-tabs */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setTab("medications")}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition ${
                        tab === "medications" ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Pill size={12} />
                      Medications
                    </button>
                    <button
                      onClick={() => setTab("reports")}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition ${
                        tab === "reports" ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <FileText size={12} />
                      Reports
                      {totalAbnormalForOwner > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {totalAbnormalForOwner}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Medications tab */}
                  {tab === "medications" && (
                    <div className="flex flex-col gap-2">
                      {meds.length === 0 ? (
                        <p className="text-xs text-slate-400">No medications added yet.</p>
                      ) : (
                        meds.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm text-slate-600">
                            <Pill size={13} className="text-[#2563EB]" />
                            {m.name} — {m.dosage}, {m.frequency}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Reports tab */}
                  {tab === "reports" && (
                    <div className="flex flex-col gap-2">
                      {reports.length === 0 ? (
                        <p className="text-xs text-slate-400">No medical reports uploaded yet.</p>
                      ) : (
                        reports.map((r) => {
                          const isLab = r.kind === "lab";
                          const abnormal = isLab ? abnormalCount(r) : 0;
                          const expanded = expandedReport === r.id;

                          return (
                            <div key={r.id} className="border border-slate-100 rounded-xl overflow-hidden">
                              <button
                                onClick={() =>
                                  isLab
                                    ? setExpandedReport(expanded ? null : r.id)
                                    : setViewingScan(r.fileUrl)
                                }
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isLab ? "bg-[#2563EB]/10 text-[#2563EB]" : "bg-[#14B8A6]/10 text-[#14B8A6]"
                                }`}>
                                  {isLab ? <FileText size={14} /> : <ImageIcon size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {isLab ? (r.reportType || "Lab Report") : r.label}
                                    </p>
                                    <span className="text-[11px] text-slate-400 shrink-0">
                                      {r.reportDate || new Date(r.addedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {isLab && (
                                    <p className={`text-[11px] mt-0.5 ${abnormal > 0 ? "text-red-600 font-medium" : "text-slate-400"}`}>
                                      {abnormal > 0 ? `${abnormal} value(s) outside range` : "All values within range"}
                                    </p>
                                  )}
                                  {!isLab && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tap to view image</p>
                                  )}
                                </div>
                              </button>

                              {isLab && expanded && (
                                <div className="px-3 pb-3 flex flex-col gap-1.5 bg-slate-50/60">
                                  {r.tests.map((t, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${
                                        t.flag === "high" || t.flag === "low" ? "bg-white border border-red-100" : ""
                                      }`}
                                    >
                                      <span className="text-slate-600">{t.name}</span>
                                      <span className={`font-semibold px-2 py-0.5 rounded-full ${flagColor(t.flag)}`}>
                                        {t.value} {t.unit || ""}
                                      </span>
                                    </div>
                                  ))}
                                  {r.summary && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">
                                      {r.summary}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Scan viewer modal */}
      <AnimatePresence>
        {viewingScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingScan(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewingScan} alt="Scan" className="max-w-full max-h-full rounded-xl" />
            <button
              onClick={() => setViewingScan(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}