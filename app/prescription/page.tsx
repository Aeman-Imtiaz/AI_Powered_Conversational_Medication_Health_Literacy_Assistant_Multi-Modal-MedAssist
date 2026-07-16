"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

const MEDICATIONS_KEY = "medassist_medications";

export default function PrescriptionPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    if (!result) return;
    const updatedMedicines = result.medicines.map((medicine, medicineIndex) =>
      medicineIndex === index ? { ...medicine, [field]: value } : medicine
    );
    setResult({ ...result, medicines: updatedMedicines });
  };

  const saveToMedicationList = () => {
    if (!result) return;

    const saved = result.medicines
      .filter((medicine) => medicine.name?.trim())
      .map((medicine) => ({
        id: `${medicine.name}-${Date.now()}`,
        name: medicine.name || "Medication",
        dosage: medicine.dosage || "1 dose",
        frequency: medicine.frequency || "daily",
        shared: false,
        next: "Today",
      }));

    const existing = window.localStorage.getItem(MEDICATIONS_KEY);
    const current = existing ? JSON.parse(existing) : [];
    window.localStorage.setItem(MEDICATIONS_KEY, JSON.stringify([...current, ...saved]));
    router.push("/");
  };

  const confidenceColor = (level: string) => {
    if (level === "high") return "bg-accent-100 text-accent-800";
    if (level === "medium") return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-700";
  };

  return (
    <main className="min-h-screen bg-medical-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="rounded-[28px] border border-medical-border bg-medical-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-2xl">💊</div>
            <div>
              <h1 className="text-2xl font-semibold text-medical-text">Prescription scan</h1>
              <p className="text-sm text-medical-muted">Review the extracted details before saving them.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-medical-border bg-medical-surface p-4 shadow-soft">
          <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-3 text-sm text-brand-800">
            ⚠️ This is a support tool. Please verify all medication details with a doctor or pharmacist.
          </div>

          {!preview && (
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-brand-300 bg-brand-50/50 p-10 text-center transition hover:border-brand-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-200 bg-white text-2xl">📷</div>
              <div>
                <p className="text-sm font-semibold text-medical-text">Take a photo or choose a file</p>
                <p className="mt-1 text-xs text-medical-muted">Prescription, medicine box, or blister pack</p>
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </label>
          )}

          {preview && (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-medical-border">
              <Image src={preview} alt="Prescription preview" width={800} height={600} className="h-auto w-full" unoptimized />
              <button onClick={reset} className="m-3 min-h-[44px] rounded-full bg-white/90 px-3 text-sm font-semibold text-medical-muted">Remove photo</button>
            </div>
          )}

          {preview && !result && (
            <button onClick={analyzeImage} disabled={loading} className="mt-4 min-h-[44px] w-full rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Reading prescription..." : "Analyze prescription"}
            </button>
          )}

          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        {result && (
          <div className="rounded-[28px] border border-medical-border bg-medical-surface p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-medical-text">Review extracted details</h2>
                <p className="text-sm text-medical-muted">Edit anything before saving it to your medication list.</p>
              </div>
              <button onClick={reset} className="min-h-[44px] rounded-full border border-medical-border px-3 text-sm text-medical-muted">Try another photo</button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {result.medicines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-medical-border bg-medical-bg p-6 text-center text-sm text-medical-muted">No medicines detected.</div>
              ) : (
                result.medicines.map((medicine, index) => (
                  <div key={`${medicine.name}-${index}`} className="rounded-2xl border border-medical-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <input
                        value={medicine.name || ""}
                        onChange={(event) => updateMedicine(index, "name", event.target.value)}
                        className="w-full rounded-xl border border-medical-border bg-medical-bg px-3 py-2 text-sm font-semibold text-medical-text"
                        placeholder="Medicine name"
                      />
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${confidenceColor(medicine.confidence)}`}>{medicine.confidence} confidence</span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-sm text-medical-muted">
                        Dose
                        <input value={medicine.dosage || ""} onChange={(event) => updateMedicine(index, "dosage", event.target.value)} className="mt-1 w-full rounded-xl border border-medical-border bg-medical-bg px-3 py-2 text-sm text-medical-text" />
                      </label>
                      <label className="text-sm text-medical-muted">
                        Frequency
                        <input value={medicine.frequency || ""} onChange={(event) => updateMedicine(index, "frequency", event.target.value)} className="mt-1 w-full rounded-xl border border-medical-border bg-medical-bg px-3 py-2 text-sm text-medical-text" />
                      </label>
                    </div>
                    <label className="mt-3 block text-sm text-medical-muted">
                      Instructions
                      <textarea value={medicine.instructions || ""} onChange={(event) => updateMedicine(index, "instructions", event.target.value)} className="mt-1 min-h-[88px] w-full rounded-xl border border-medical-border bg-medical-bg px-3 py-2 text-sm text-medical-text" />
                    </label>
                  </div>
                ))
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={saveToMedicationList} className="min-h-[44px] rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white">Save to medication list</button>
                <button onClick={() => router.push("/")} className="min-h-[44px] rounded-2xl border border-medical-border px-4 py-3 text-sm font-semibold text-medical-muted">Back to home</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}