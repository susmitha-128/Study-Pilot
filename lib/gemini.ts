// Server-only Google Gemini client. Never import this from a Client
// Component — the API key must stay server-side.
//
// Get a free key at https://aistudio.google.com/app/apikey — no billing
// required for the free tier (rate-limited, but plenty for development and
// a seminar demo). Set it as GEMINI_API_KEY in your environment.
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// "gemini-2.0-flash" is fast and included in the free tier. Swap to
// "gemini-1.5-pro" for higher quality if you're on a paid tier.
export const AGENT_MODEL = "gemini-2.0-flash";

function cleanJson(text: string) {
  return text.replace(/^```json\s*|\s*```$/g, "").trim();
}

// Helper: ask Gemini for strict JSON and parse it, with one repair retry.
export async function askForJSON<T = unknown>(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: AGENT_MODEL,
    systemInstruction: params.system + "\n\nRespond with ONLY valid JSON. No prose, no markdown fences.",
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? 2000,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(params.prompt);
  const text = result.response.text();

  try {
    return JSON.parse(cleanJson(text)) as T;
  } catch {
    // one repair attempt
    const repairModel = genAI.getGenerativeModel({
      model: AGENT_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });
    const repair = await repairModel.generateContent(
      `The following was supposed to be valid JSON but isn't. Return ONLY the corrected valid JSON, nothing else:\n\n${text}`
    );
    return JSON.parse(cleanJson(repair.response.text())) as T;
  }
}

// Same idea, but with an image attached (used for photos of notes/whiteboards
// in materials analysis) — Gemini reads the image directly, no OCR step needed.
export async function askForJSONWithImage<T = unknown>(params: {
  system: string;
  prompt: string;
  base64: string;
  mimeType: string;
  maxTokens?: number;
}): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: AGENT_MODEL,
    systemInstruction: params.system + "\n\nRespond with ONLY valid JSON. No prose, no markdown fences.",
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? 2000,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    { inlineData: { data: params.base64, mimeType: params.mimeType } },
    params.prompt,
  ]);
  const text = result.response.text();
  return JSON.parse(cleanJson(text)) as T;
}
