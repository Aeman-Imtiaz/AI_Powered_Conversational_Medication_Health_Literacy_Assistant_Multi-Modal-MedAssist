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
      const isRateLimited =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("Too Many Requests"));

      const isOverloaded =
        error instanceof Error &&
        (error.message.includes("503") || error.message.includes("overloaded"));

      if (isRateLimited) {
        throw error;
      }

      if (isOverloaded && attempt < maxRetries) {
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
    const { message, history, medications, language, literacyLevel, profile } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured. Please set GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const languageInstruction =
      language === "ur"
        ? `CRITICAL LANGUAGE RULE: You must respond ONLY in native Urdu script (اردو رسم الخط), using the Perso-Arabic alphabet — NOT Roman/Latin letters, even if the user's messages are in Roman Urdu or English. For example, write "آپ کی دوا" not "aap ki dawa". This applies to every single response, no exceptions, regardless of what script appears earlier in the conversation.`
        : language === "roman"
        ? `CRITICAL LANGUAGE RULE: You must respond ONLY in Roman Urdu (Urdu language written in Latin/English alphabet), NOT in native Urdu script (اردو) and NOT in plain English. For example, write "aap ki dawa" not "آپ کی دوا" and not "your medicine". Use natural, everyday Roman Urdu phrasing, the way people commonly text in Pakistan. This applies to every single response, no exceptions.`
        : "The user has selected English as their preferred language. Always respond in English, regardless of what script the user types in.";

    const literacyInstruction =
      literacyLevel === "detailed"
        ? "DETAILED MODE: For each medicine, explain the mechanism of action (how it works in the body), not just what it's for. Include relevant interaction warnings between the specific medicines listed. Longer, thorough responses are expected and encouraged here."
        : "SIMPLE MODE (STRICT): For each medicine, give ONLY a one-line plain-language purpose (e.g. 'Panadol — for pain and fever'). Do NOT explain mechanism of action, do NOT use medical/scientific terms. Maximum 2 short sentences of safety notes at the end, not a detailed breakdown per medicine. If asked to explain the whole list, respond as a short bullet list, one line per medicine, nothing more.";
    const medicationContext =
      medications && medications.length > 0
        ? `\n\nUSER'S CURRENT MEDICATIONS:\n${medications
            .map(
              (med: { name: string; dosage: string; frequency: string }) =>
                `- ${med.name}: ${med.dosage}, ${med.frequency}`
            )
            .join("\n")}`
        : "";

    const profileContext =
      profile && (profile.age || profile.conditions || profile.allergies || profile.notes)
        ? `\n\nUSER'S PROFILE (use this to personalize and make suggestions more relevant and safe, but never state it back verbatim unless asked):
${profile.age ? `- Age: ${profile.age}` : ""}
${profile.gender ? `- Gender: ${profile.gender}` : ""}
${profile.conditions ? `- Existing health conditions: ${profile.conditions}` : ""}
${profile.allergies ? `- Known allergies: ${profile.allergies}` : ""}
${profile.notes ? `- Other notes: ${profile.notes}` : ""}
IMPORTANT: If the user's known allergies overlap with something they're asking about, warn them clearly. Factor in age and existing conditions when giving general information (e.g. be more cautious with elderly users or those with relevant conditions), but always still redirect to a doctor for anything specific to their situation.`
        : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      systemInstruction: `You are MedAssist — an AI assistant that helps people understand their medications.

${languageInstruction}
${literacyInstruction}

YOUR RULES:
1. You never give medical advice — only general information and guidance.
2. Whenever your response involves dosage, side effects, or drug combinations, always end with this disclaimer: "⚠️ This is not medical advice. Please consult your doctor or pharmacist for guidance specific to you."
3. If a user mentions overdose, self-harm, or any emergency situation, immediately and firmly redirect them to real help. Do not give general medical advice in this case. Use exactly these verified Pakistan resources:
   - Emergency (medical/fire/police): 1122
   - Umang 24/7 Mental Health Helpline (Pakistan): 0311-7786264
   Tell them clearly: this is a medical emergency, do not wait for symptoms, go to the nearest hospital emergency room immediately, or call one of the numbers above right now. Never invent, guess, or use any other helpline number — only use the two listed above.
4. Never guarantee that a specific dose is "safe" for someone — always use words like "generally" or "typically" and refer them to a professional.
5. If a question is outside your scope (e.g. surgery, diagnosis, or treatment of an unrelated medical condition), clearly state that this is beyond your scope and recommend seeing a doctor.
6. Avoid complex medical terms, or explain them simply if used.
7. You have access to the user's medication list below, if provided. Reference it when relevant, and ground any claim about their specific medications only in this list — never invent drug interactions, dosages, or side effects not present in it.
8. When summarizing extracted prescription data, explicitly state your confidence level and ask the user to confirm or correct it before saving.${medicationContext}${profileContext}`,

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
          ? "The server is currently busy. Please try again in a moment."
          : error.message.includes("429") || error.message.includes("Too Many Requests")
          ? "You're sending messages too quickly. The free plan has a limited number of requests per minute — please wait 30-60 seconds and try again."
          : error.message
        : "Something went wrong";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}