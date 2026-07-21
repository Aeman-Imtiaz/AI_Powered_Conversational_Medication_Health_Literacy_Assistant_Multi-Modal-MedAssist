import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
};

type DayData = {
  label: string;
  percentage: number;
  taken: number;
};

export async function POST(req: Request) {
  try {
    const { medicines, weekData, weekAverage, language, literacyLevel } =
      await req.json();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const medsList = (medicines as Medicine[])
      .map((m) => `${m.name} (${m.dosage}, ${m.frequency})`)
      .join(", ");

    const dailyBreakdown = (weekData as DayData[])
      .map((d) => `${d.label}: ${d.percentage}% (${d.taken} taken)`)
      .join("\n");

const languageInstruction =
      language === "ur"
        ? "CRITICAL: Respond ONLY in native Urdu script (اردو رسم الخط), not Roman Urdu."
        : language === "roman"
        ? "CRITICAL: Respond ONLY in Roman Urdu (Urdu written in Latin/English letters), not native Urdu script and not plain English."
        : "Respond in English.";
    const literacyInstruction =
      literacyLevel === "detailed"
        ? "Give a slightly more thorough summary, gently noting patterns (e.g. specific days that were weaker) and encouragement."
        : "Keep it to 2-3 short, plain sentences. No medical jargon.";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      systemInstruction: `You are writing a short, warm, encouraging weekly medication adherence summary for a caregiver or patient. ${languageInstruction} ${literacyInstruction} Do not give medical advice. Do not diagnose. Just summarize adherence patterns supportively and suggest one practical tip if adherence is below 80%. End with the disclaimer: "⚠️ This is not medical advice."`,
    });

    const prompt = `Medications being tracked: ${medsList}\n\nThis week's adherence:\n${dailyBreakdown}\n\nWeekly average: ${weekAverage}%\n\nWrite the summary now.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}