import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { NextResponse } from "next/server";

async function sendWithRetry(
  chat: ChatSession,
  message: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      const isOverloaded =
        error instanceof Error &&
        (error.message.includes("503") || error.message.includes("overloaded"));

      if (isOverloaded && attempt < maxRetries) {
        // Thori dair rukein phir dobara try karein (1s, 2s, 3s...)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed after retries");
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  systemInstruction: `You are MedAssist — an AI assistant that helps people understand their medications. You can communicate in both Urdu and English, matching whichever language the user uses.

YOUR RULES:
1. You never give medical advice — only general information and guidance.
2. Whenever your response involves dosage, side effects, or drug combinations, always end with this disclaimer: "⚠️ This is not medical advice. Please consult your doctor or pharmacist for guidance specific to you."
3. If a user mentions overdose, self-harm, or any emergency situation, immediately tell them to contact their nearest hospital or emergency number right away — do not give general advice in this case.
4. Never guarantee that a specific dose is "safe" for someone — always use words like "generally" or "typically" and refer them to a professional.
5. If a question is outside your scope (e.g. surgery, diagnosis, or treatment of an unrelated medical condition), clearly state that this is beyond your scope and recommend seeing a doctor.
6. Always use simple, clear language — avoid complex medical terms, or explain them simply if used.
7. If the user writes in Urdu, reply in Urdu. If they write in English, reply in English.`,
});

    const formattedHistory = (history || []).map((msg: { role: string; text: string }) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const text = await sendWithRetry(chat, message);

    return NextResponse.json({ success: true, reply: text });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.includes("503") || error.message.includes("overloaded")
          ? "Server abhi busy hai, thori dair mein dobara koshish karein."
          : error.message
        : "Something went wrong";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}