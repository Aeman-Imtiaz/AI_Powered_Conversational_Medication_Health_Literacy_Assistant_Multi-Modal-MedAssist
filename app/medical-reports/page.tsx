"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ScanLine, Loader2, X, Check, AlertTriangle, Plus, Image as ImageIcon } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import FloatingBlob from "../components/FloatingBlob";

// Cloudinary — free image hosting, no card required (replaces Firebase Storage,
// which now requires the paid Blaze plan for new projects)
const CLOUDINARY_CLOUD_NAME = "pyojikbl"; // e.g. "dxyz1234"
const CLOUDINARY_UPLOAD_PRESET = "g4ahpqoe"; // the unsigned preset name you created

type Test = {
  name: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: "high" | "low" | "normal" | "unclear";
};

type AnalysisResult = {
  labName: string | null;
  reportDate: string | null;
  reportType: string | null;
  tests: Test[];
  notes: string;
};

// A saved record can be a Lab Report (structured, OCR'd) or a Scan (stored image only, never AI-interpreted)
type SavedReport =
  | {
      id: string;
      kind: "lab";
      labName: string | null;
      reportDate: string | null;
      reportType: string | null;
      tests: Test[];
      summary: string;
      fileUrl: string | null;
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

const REPORT_KINDS = [
  { id: "lab" as const, label: "Lab Report", icon: FileText, desc: "Blood test, urine test — extracted automatically" },
  { id: "scan" as const, label: "Scan / Ultrasound", icon: ScanLine, desc: "X-ray, ultrasound — stored for your doctor to review" },
];

export default function MedicalReportsPage() {
  const { user } = useAuth();
  const [kind, setKind] = useState<"lab" | "scan">("lab");

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // scan-only fields
  const [scanLabel, setScanLabel] = useState("");
  const [scanDate, setScanDate] = useState("");

  const [history, setHistory] = useState<SavedReport[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [viewingScan, setViewingScan] = useState<string | null>(null);
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      setHistory(Array.isArray(data.medicalReports) ? data.medicalReports : []);
      setLoadedHistory(true);
    };
    load();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 8 * 1024 * 1024) {
      setError("File size should be under 8MB.");
      return;
    }

    setResult(null);
    setError(null);
    setSaved(false);
    setFile(selected);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const analyzeReport = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      const [header, base64Data] = preview.split(",");
      const mimeType = header.match(/data:(.*);base64/)?.[1] || "image/jpeg";

      const res = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setSummary(data.summary);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveLabReport = async () => {
    if (!user || !result) return;

    setLoading(true);
    setError(null);

    try {
      let fileUrl: string | null = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          console.error("Cloudinary upload error:", uploadData);
          throw new Error(uploadData?.error?.message || "Image upload failed");
        }

        fileUrl = uploadData.secure_url;
      }

      const newReport: SavedReport = {
        id: Date.now().toString(),
        kind: "lab",
        labName: result.labName,
        reportDate: result.reportDate,
        reportType: result.reportType,
        tests: result.tests,
        summary,
        fileUrl,
        addedAt: new Date().toISOString(),
      };

      const updated = [newReport, ...history];
      await setDoc(doc(db, "users", user.uid), { medicalReports: updated }, { merge: true });
      setHistory(updated);
      setSaved(true);
    } catch (err) {
      console.error("Save lab report error:", err);
      const message = err instanceof Error ? err.message : "Couldn't save the report. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const saveScan = async () => {
    if (!user || !file) return;
    if (!scanLabel.trim()) {
      setError("Please give this scan a label, e.g. \"Ultrasound — Abdomen\".");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload to Cloudinary (free, no card required) — the image is never
      // sent to the AI for interpretation, it's stored as-is for the doctor to view
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        console.error("Cloudinary upload error:", uploadData);
        throw new Error(uploadData?.error?.message || "Image upload failed");
      }

      const fileUrl = uploadData.secure_url;

      const newReport: SavedReport = {
        id: Date.now().toString(),
        kind: "scan",
        label: scanLabel.trim(),
        reportDate: scanDate || null,
        fileUrl,
        addedAt: new Date().toISOString(),
      };

      const updated = [newReport, ...history];
      await setDoc(doc(db, "users", user.uid), { medicalReports: updated }, { merge: true });
      setHistory(updated);
      setSaved(true);
    } catch (err) {
      console.error("Save scan error:", err);
      const message = err instanceof Error ? err.message : "Couldn't save the scan. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setSummary("");
    setError(null);
    setSaved(false);
    setScanLabel("");
    setScanDate("");
  };

  const switchKind = (k: "lab" | "scan") => {
    setKind(k);
    reset();
  };

  const flagColor = (flag: string) => {
    if (flag === "high") return "text-red-600 bg-red-50";
    if (flag === "low") return "text-amber-600 bg-amber-50";
    if (flag === "normal") return "text-[#10B981] bg-[#10B981]/10";
    return "text-slate-400 bg-slate-50";
  };

  return (
    <main className="relative flex-1 bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 pt-10 gap-5">
      <FloatingBlob color="#2563EB" size={340} top="-100px" left="-100px" />
      <FloatingBlob color="#14B8A6" size={280} bottom="60px" right="-100px" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-sm">
            <FileText size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Medical Reports
            </h1>
            <p className="text-xs text-slate-400">Lab reports & scans, all in one place</p>
          </div>
        </div>
      </motion.div>

      {/* Kind toggle */}
      <div className="relative w-full max-w-2xl grid grid-cols-2 gap-2 z-10">
        {REPORT_KINDS.map((k) => {
          const Icon = k.icon;
          const active = kind === k.id;
          return (
            <button
              key={k.id}
              onClick={() => switchKind(k.id)}
              className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition ${
                active
                  ? "bg-[#2563EB] border-[#2563EB] text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-[#2563EB]/40"
              }`}
            >
              <Icon size={17} />
              <span className="text-sm font-semibold">{k.label}</span>
              <span className={`text-[11px] ${active ? "text-white/80" : "text-slate-400"}`}>{k.desc}</span>
            </button>
          );
        })}
      </div>

      {kind === "lab" ? (
        <div className="relative w-full max-w-2xl bg-amber-50/90 backdrop-blur border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl z-10">
          ⚠️ We extract and flag values against the printed reference range only.
          This is not a diagnosis — always review results with your doctor.
        </div>
      ) : (
        <div className="relative w-full max-w-2xl bg-amber-50/90 backdrop-blur border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl z-10">
          ⚠️ Scans are stored exactly as uploaded — our AI does not read, interpret, or
          comment on scan images. This keeps your doctor as the only source of
          interpretation for imaging.
        </div>
      )}

      {!preview && !loading && (
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#2563EB]/30 bg-white/60 backdrop-blur rounded-3xl p-10 cursor-pointer hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-colors z-10"
        >
          <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#2563EB]/10">
            <Plus size={24} className="text-[#2563EB]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {kind === "lab" ? "Upload a lab report" : "Upload a scan / ultrasound image"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {kind === "lab" ? "Blood test, urine test, or similar printed report" : "X-ray, ultrasound, or similar imaging report"}
            </p>
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        </motion.label>
      )}

      {preview && (
        <div className="relative w-full max-w-2xl z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-2xl border border-slate-200" />
          {!result && !saved && (
            <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* LAB flow */}
      {kind === "lab" && preview && !result && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={analyzeReport}
          disabled={loading}
          className="relative w-full max-w-2xl bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white font-medium px-4 py-3.5 rounded-2xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2 z-10"
        >
          {loading ? (<><Loader2 size={16} className="animate-spin" />Reading report...</>) : "Extract Report Data"}
        </motion.button>
      )}

      {/* SCAN flow */}
      {kind === "scan" && preview && !saved && (
        <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
          <input
            value={scanLabel}
            onChange={(e) => setScanLabel(e.target.value)}
            placeholder='Label, e.g. "Ultrasound — Abdomen"'
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
          <input
            type="date"
            value={scanDate}
            onChange={(e) => setScanDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={saveScan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white font-medium px-4 py-3.5 rounded-2xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (<><Loader2 size={16} className="animate-spin" />Saving...</>) : "Save Scan to History"}
          </motion.button>
        </div>
      )}

      {error && (
        <div className="relative w-full max-w-2xl border border-red-200 bg-red-50 text-red-700 p-4 rounded-2xl text-sm z-10">
          {error}
        </div>
      )}

      {/* LAB results */}
      {kind === "lab" && result && (
        <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
          {result.tests.length === 0 ? (
            <GlassCard hover={false} className="p-6 text-center">
              <p className="text-sm text-slate-400">{result.notes || "No lab values detected."}</p>
              <button onClick={reset} className="text-xs text-[#2563EB] mt-2 hover:underline">Try another photo</button>
            </GlassCard>
          ) : (
            <>
              <GlassCard hover={false} className="p-4">
                <p className="text-sm font-semibold text-slate-800">{result.reportType || "Lab Report"}</p>
                <p className="text-xs text-slate-400">
                  {result.labName || "Unknown lab"} {result.reportDate ? `· ${result.reportDate}` : ""}
                </p>
              </GlassCard>

              <GlassCard hover={false} className="p-4 flex flex-col gap-2">
                {result.tests.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-400">Range: {t.referenceRange || "—"}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${flagColor(t.flag)}`}>
                      {t.value} {t.unit || ""}
                    </span>
                  </div>
                ))}
              </GlassCard>

              {summary && (
                <GlassCard hover={false} className="p-4 bg-amber-50/60 border-amber-200/70 flex gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{summary}</p>
                </GlassCard>
              )}

              <div className="flex gap-2">
                <button onClick={reset} className="flex-1 text-sm text-slate-500 border border-slate-200 rounded-xl py-2.5">
                  Discard
                </button>
                <motion.button
                  whileHover={{ scale: saved || loading ? 1 : 1.02 }}
                  onClick={saveLabReport}
                  disabled={saved || loading}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl py-2.5 disabled:opacity-70 ${
                    saved ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#2563EB] text-white"
                  }`}
                >
                  {saved ? (
                    <><Check size={15} />Saved to History</>
                  ) : loading ? (
                    <><Loader2 size={15} className="animate-spin" />Saving...</>
                  ) : (
                    "Save to History"
                  )}
                </motion.button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SCAN saved confirmation */}
      {kind === "scan" && saved && (
        <GlassCard hover={false} className="relative w-full max-w-2xl p-4 flex items-center gap-3 z-10 bg-[#10B981]/5 border-[#10B981]/20">
          <Check size={18} className="text-[#10B981] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Scan saved to history</p>
            <p className="text-xs text-slate-400">Your doctor will be able to view this if you&apos;ve added them under Family Sharing.</p>
          </div>
          <button onClick={reset} className="text-xs text-[#2563EB] hover:underline shrink-0">Upload another</button>
        </GlassCard>
      )}

      {loadedHistory && history.length > 0 && (
        <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10 mt-2">
          <h2 className="text-sm font-semibold text-slate-700">History</h2>
          <AnimatePresence>
            {history.map((r) => {
              const isExpanded = expandedLab === r.id;
              return (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  onClick={() => {
                    if (r.kind === "scan") setViewingScan(r.fileUrl);
                    if (r.kind === "lab" && r.fileUrl) setViewingScan(r.fileUrl);
                  }}
                  className={r.kind === "scan" || (r.kind === "lab" && r.fileUrl) ? "cursor-pointer" : ""}
                >
                  <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      r.kind === "lab" ? "bg-[#2563EB]/10 text-[#2563EB]" : "bg-[#14B8A6]/10 text-[#14B8A6]"
                    }`}>
                      {r.kind === "lab" ? <FileText size={16} /> : <ImageIcon size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {r.kind === "lab" ? (r.reportType || "Lab Report") : r.label}
                        </p>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                          {r.reportDate || new Date(r.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.kind === "lab"
                          ? (r.tests.filter((t) => t.flag === "high" || t.flag === "low").length > 0
                              ? `${r.tests.filter((t) => t.flag === "high" || t.flag === "low").length} value(s) outside range`
                              : "All values within range")
                          : "Scan / Ultrasound — tap to view"}
                      </p>
                    </div>
                    {r.kind === "lab" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLab(isExpanded ? null : r.id);
                        }}
                        className="shrink-0 text-xs text-[#2563EB] font-medium px-2 py-1 hover:underline"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    )}
                  </div>

                  {r.kind === "lab" && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                      {r.tests.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 text-xs"
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
                  </GlassCard>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

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