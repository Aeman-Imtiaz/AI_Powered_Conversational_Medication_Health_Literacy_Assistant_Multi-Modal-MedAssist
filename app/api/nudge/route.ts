import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type Medicine = {
  name: string;
  time: string;
};

type DayData = {
  label: string;
  percentage: number;
};

export async function POST(req: Request) {
  try {
    const { medicines, weekData, language, literacyLevel } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "AI service is not configured." }, { status: 500 });
    }

    if (!medicines || medicines.length === 0) {
      return NextResponse.json({ success: true, nudge: null });
    }

    const medsList = (medicines as Medicine[])
      .map((m) => `${m.name}${m.time ? ` at ${m.time}` : ""}`)
      .join(", ");

    const weakDays = (weekData as DayData[]).filter((d) => d.percentage < 60);
    const patternNote =
      weakDays.length > 0
        ? `Weaker adherence days: ${weakDays.map((d) => d.label).join(", ")}.`
        : "Adherence has been fairly consistent this week.";

    const languageInstruction =
      language === "ur"
        ? "Respond ONLY in native Urdu script (اردو), not Roman Urdu."
        : language === "roman"
        ? "Respond ONLY in Roman Urdu (Latin letters)."
        : "Respond in English.";

    const literacyInstruction =
      literacyLevel === "detailed"
        ? "You may briefly explain the reasoning behind the suggestion."
        : "Keep it to a single short, plain sentence.";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      systemInstruction: `You generate ONE short, warm, practical nudge (a gentle suggestion) for a medication adherence app, based on the person's medication schedule and recent adherence pattern. ${languageInstruction} ${literacyInstruction} Focus on ONE concrete, actionable tip — e.g. adjusting a reminder time, pairing a dose with a daily habit (like a meal), or encouragement if adherence is already good. Do NOT give medical advice, do NOT mention drug interactions or dosages. Do NOT add a disclaimer — keep it to just the nudge itself, one short sentence or two at most.`,
    });

    const prompt = `Medications and times: ${medsList}\n${patternNote}\n\nGenerate the nudge now.`;

    const result = await model.generateContent(prompt);
    const nudge = result.response.text().trim();

    return NextResponse.json({ success: true, nudge });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}