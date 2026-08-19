import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWithRetry(model: any, parts: unknown[], maxRetries = 5) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err) {
      lastError = err;

      const isOverloaded =
        err instanceof Error &&
        (err.message.includes("503") || err.message.includes("overloaded"));

      const isRateLimited =
        err instanceof Error &&
        (err.message.includes("429") || err.message.includes("Too Many Requests"));

      // Rate limits won't fix themselves in seconds — fail fast instead of wasting retries
      if (isRateLimited) {
        throw err;
      }

      if (isOverloaded && attempt < maxRetries) {
        // Longer, increasing backoff: ~1.5s, 3s, 5s, 8s
        const delay = Math.min(1500 * attempt, 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: `You are a medical lab report reader. You will be shown a photo of a printed lab report (blood test, urine test, or similar). Extract ONLY the text that is printed on the report — do not diagnose, interpret, or speculate about what the results mean clinically.

For each test result visible, extract:
- Test name (e.g. "Hemoglobin")
- Value (e.g. "10.2")
- Unit (e.g. "g/dL")
- Reference range AS PRINTED on the report (e.g. "12.0 - 16.0")
- Flag: compare the value to the printed reference range mathematically and mark "high", "low", "normal", or "unclear" if the range isn't legible. This is a factual numeric comparison, NOT a medical interpretation.

Also extract (if visible): lab/hospital name, report date, patient name.

Respond ONLY in valid JSON, no markdown, no code fences:
{
  "labName": "string or null",
  "reportDate": "string or null",
  "reportType": "e.g. Complete Blood Count, Urine Analysis, etc, or null",
  "tests": [
    { "name": "string", "value": "string", "unit": "string or null", "referenceRange": "string or null", "flag": "high | low | normal | unclear" }
  ],
  "notes": "any warnings, e.g. image unclear, or if this is not a lab report at all"
}

If the image is not a lab report (e.g. it's a scan, ultrasound image, or unrelated photo), return an empty tests array and explain in notes that this type of image is not supported for automatic extraction.`,
    });

    let rawText: string;
    try {
      rawText = await generateWithRetry(model, [
        { inlineData: { data: image, mimeType: mimeType || "image/jpeg" } },
        { text: "Extract the lab report details from this image." },
      ]);
    } catch (err) {
      console.error("Lab report extraction failed after retries:", err);
      const message =
        err instanceof Error && (err.message.includes("503") || err.message.includes("overloaded"))
          ? "The AI service is very busy right now. Please wait a minute and try again."
          : err instanceof Error && (err.message.includes("429") || err.message.includes("Too Many Requests"))
          ? "Too many requests right now. Please wait a bit and try again."
          : "Something went wrong reading the report. Please try again.";
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not parse AI response" },
        { status: 500 }
      );
    }

    // Ab ek chota, factual summary bhi generate karte hain (sirf abnormal values ka zikr)
    const abnormalTests = (parsed.tests || []).filter(
      (t: { flag: string }) => t.flag === "high" || t.flag === "low"
    );

    let summary = "All extracted values are within the printed reference range.";
    if (abnormalTests.length > 0) {
      const summaryModel = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        systemInstruction: `Write a short, plain-language, non-diagnostic note (2-3 sentences max) listing which lab values were outside the printed reference range and by how much, factually. Do NOT speculate about causes or conditions. End with: "Please discuss these results with your doctor."`,
      });

      try {
        summary = await generateWithRetry(
          summaryModel,
          [`Abnormal test results: ${JSON.stringify(abnormalTests)}`],
          3
        );
      } catch (err) {
        // The summary is a nice-to-have — if the AI is too busy for it, don't fail
        // the whole request. Fall back to a simple factual line instead.
        console.error("Summary generation failed, using fallback:", err);
        summary = `${abnormalTests.length} value(s) were outside the printed reference range. Please discuss these results with your doctor.`;
      }
    }

    return NextResponse.json({ success: true, data: parsed, summary });
  } catch (error) {
    console.error("analyze-report error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}