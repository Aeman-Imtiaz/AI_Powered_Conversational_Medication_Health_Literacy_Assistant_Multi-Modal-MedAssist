"use client";

import { useState } from "react";
import Image from "next/image";

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

export default function PrescriptionPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      // preview ek "data:image/jpeg;base64,XXXXX" jaisi string hoti hai
      // hume sirf base64 part aur mimeType alag se chahiye
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
    } catch  {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-4">
      <h1 className="text-2xl font-bold">Prescription Vision Test</h1>

      <div className="w-full max-w-md bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs p-3 rounded">
        ⚠️ This is a test tool. Always verify medicine details with your
        doctor or pharmacist.
      </div>

      <label className="w-full max-w-md flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-black hover:bg-gray-50 transition">
        <span className="text-sm text-gray-500">
          📷 Click to choose a prescription photo
        </span>
        <span className="bg-black text-white px-4 py-2 rounded text-sm">
          Choose File
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {preview && (
        <Image
          src={preview}
          alt="Preview"
          width={400}
          height={400}
          className="w-full max-w-md rounded border h-auto"
          unoptimized
        />
      )}

      {preview && (
        <button
          onClick={analyzeImage}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Prescription"}
        </button>
      )}

      {error && (
        <div className="w-full max-w-md border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="w-full max-w-md border rounded p-4 bg-gray-50 flex flex-col gap-3">
          <h2 className="font-semibold">Extracted Details:</h2>
          {result.medicines.length === 0 ? (
            <p className="text-sm text-gray-500">No medicines detected.</p>
          ) : (
            result.medicines.map((med, i) => (
              <div key={i} className="border rounded p-3 bg-white text-sm">
                <p><strong>Name:</strong> {med.name || "Not detected"}</p>
                <p><strong>Dosage:</strong> {med.dosage || "Not detected"}</p>
                <p><strong>Frequency:</strong> {med.frequency || "Not detected"}</p>
                <p><strong>Instructions:</strong> {med.instructions || "None"}</p>
                <p><strong>Confidence:</strong> {med.confidence}</p>
              </div>
            ))
          )}
          {result.notes && (
            <p className="text-xs text-gray-500 italic">Note: {result.notes}</p>
          )}
        </div>
      )}
    </main>
  );
}