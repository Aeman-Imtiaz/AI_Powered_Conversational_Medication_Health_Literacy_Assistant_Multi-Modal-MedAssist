import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: `You are a medical prescription/medicine-package reader. You will be shown a photo of a prescription, medicine box, blister pack, or pill. Extract the following details as accurately as possible:
- Medicine name
- Dosage/strength (e.g. 500mg)
- Frequency (e.g. twice daily)
- Any visible instructions (e.g. "after food")

CONFIDENCE CALIBRATION (critical):
- Only use "high" confidence for clearly printed text (e.g. a retail medicine box) that is fully legible with no ambiguity.
- Use "medium" for handwritten prescriptions that are legible but require some interpretation.
- Use "low" for handwritten prescriptions with unclear, cursive, faded, or ambiguous handwriting, or where any field had to be guessed.
- When in doubt, prefer the lower confidence level.

DOSAGE FIELD — IMPORTANT DISTINCTION:
- For prescriptions with a "Sig" / "Signa" / "Take" / "Directions" line, the "dosage" field must reflect the actual dose to be taken per administration (e.g. "5ml"), NOT the total quantity of an ingredient or the total volume of a compounded/mixed solution (e.g. do not report "15ml" if that is the total amount of one ingredient used to prepare the mixture).
- If the total compounded quantity and the per-dose amount are both visible, extract the per-dose amount as "dosage" and you may mention the total compounded quantity in "instructions" instead.
- If unclear which number represents the actual dose, lower the confidence level and note the ambiguity in "notes".

Respond ONLY in valid JSON, in this exact format, with no extra text, no markdown formatting, and no code fences:
{
  "medicines": [
    {
      "name": "string or null if unreadable",
      "dosage": "string or null if unreadable",
      "frequency": "string or null if unreadable",
      "instructions": "string or null if none visible",
      "confidence": "high | medium | low"
    }
  ],
  "notes": "any warnings, e.g. image unclear, handwriting illegible, etc."
}

If the image is not a medicine/prescription at all, return an empty medicines array and explain in notes.`,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: image,
          mimeType: mimeType || "image/jpeg",
        },
      },
      { text: "Extract the medicine details from this image." },
    ]);

    const rawText = result.response.text();

    // Gemini kabhi kabhi ```json fences add kar deta hai, unhein saaf karte hain
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not parse AI response", raw: rawText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}