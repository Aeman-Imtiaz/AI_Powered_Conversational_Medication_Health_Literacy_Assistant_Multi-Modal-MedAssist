"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Camera, Loader2, X, Check, Plus } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import FloatingBlob from "../components/FloatingBlob";
type Medicine = {
  name: string | null;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  confidence: string;
};

type AnalysisResult = {
  medicines: Medicine[];
  notes: string;
};

type SavedMedicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

export default function PrescriptionPage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [header, base64Data] = preview.split(",");
      const mimeType = header.match(/data:(.*);base64/)?.[1] || "image/jpeg";

      const res = await fetch("/api/analyze-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setAddedIds(new Set());
  };

  const addToMedications = async (med: Medicine, index: number) => {
    if (!user) return;

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const current: SavedMedicine[] = Array.isArray(data.medications) ? data.medications : [];

      const newMed: SavedMedicine = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + index,
        name: med.name || "Unknown medicine",
        dosage: med.dosage || "",
        frequency: med.frequency || "",
        time: "",
      };

      await setDoc(doc(db, "users", user.uid), { medications: [...current, newMed] }, { merge: true });
      setAddedIds((prev) => new Set(prev).add(index));
    } catch {
      // silently ignore for now
    }
  };

  const confidenceColor = (level: string) => {
    if (level === "high") return "bg-[#10B981]/10 text-[#10B981]";
    if (level === "medium") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-600";
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden flex flex-col items-center px-4 py-10 pb-28 gap-5">
      <FloatingBlob color="#06B6D4" size={340} top="-110px" right="-110px" />
      <FloatingBlob color="#2563EB" size={280} bottom="80px" left="-100px" delay={2} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl text-center z-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#2563EB] shadow-md mb-3 text-2xl"
        >
          💊
        </motion.div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Prescription Reader
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Snap or upload a photo — we&apos;ll pull out the details for you
        </p>
      </motion.div>

      <div className="relative w-full max-w-2xl bg-amber-50/90 backdrop-blur border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl z-10">
        ⚠️ This is a test tool. Always verify medicine details with your
        doctor or pharmacist.
      </div>

      {!preview && (
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.01 }}
          className="relative w-full max-w-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#2563EB]/30 bg-white/60 backdrop-blur rounded-3xl p-10 cursor-pointer hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-colors z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#2563EB]/10"
          >
            <Camera size={24} className="text-[#2563EB]" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Take a photo or choose a file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prescription, medicine box, or blister pack
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </motion.label>
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-10"
          >
            <Image
              src={preview}
              alt="Preview"
              width={400}
              height={400}
              className="w-full h-auto"
              unoptimized
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-600 shadow hover:bg-white"
              aria-label="Remove photo"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {preview && !result && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={analyzeImage}
          disabled={loading}
          className="relative w-full max-w-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-medium px-4 py-3.5 rounded-2xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2 z-10"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Reading prescription...
            </>
          ) : (
            "Analyze Prescription"
          )}
        </motion.button>
      )}

      {error && (
        <div className="relative w-full max-w-2xl border border-red-200 bg-red-50 text-red-700 p-4 rounded-2xl text-sm z-10">
          {error}
        </div>
      )}

      {result && (
        <div className="relative w-full max-w-2xl flex flex-col gap-3 z-10">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">
              Extracted Details
            </h2>
            <button
              onClick={reset}
              className="text-xs text-[#2563EB] hover:underline"
            >
              Try another photo
            </button>
          </div>

          {result.medicines.length === 0 ? (
            <GlassCard hover={false} className="p-6 text-center">
              <p className="text-sm text-slate-400">No medicines detected.</p>
            </GlassCard>
          ) : (
            result.medicines.map((med, i) => {
              const isAdded = addedIds.has(i);
              return (
                <GlassCard key={i} delay={i * 0.08} hover={false} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-900">
                      {med.name || "Not detected"}
                    </h3>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${confidenceColor(
                        med.confidence
                      )}`}
                    >
                      {med.confidence} confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="text-slate-400 text-xs block">Dosage</span>
                      {med.dosage || "—"}
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Frequency</span>
                      {med.frequency || "—"}
                    </div>
                  </div>
                  {med.instructions && (
                    <div className="text-sm text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 text-xs block">Instructions</span>
                      {med.instructions}
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: isAdded ? 1 : 1.02 }}
                    whileTap={{ scale: isAdded ? 1 : 0.97 }}
                    onClick={() => !isAdded && addToMedications(med, i)}
                    disabled={isAdded || !med.name}
                    className={`mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isAdded
                        ? "bg-[#10B981]/10 text-[#10B981] cursor-default"
                        : "bg-[#2563EB] text-white hover:opacity-90 disabled:opacity-40"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={15} />
                        Added to My Medications
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Add to My Medications
                      </>
                    )}
                  </motion.button>
                </GlassCard>
              );
            })
          )}

          {result.notes && (
            <p className="text-xs text-slate-400 italic px-1">
              Note: {result.notes}
            </p>
          )}
        </div>
      )}
    </main>
  );
}