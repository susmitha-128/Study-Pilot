// Server-only Anthropic client. Never import this from a Client Component —
// the API key must stay server-side.
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AGENT_MODEL = "claude-sonnet-4-6";

// Helper: ask Claude for strict JSON and parse it, with one repair retry.
export async function askForJSON<T = unknown>(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: params.maxTokens ?? 2000,
    system: params.system + "\n\nRespond with ONLY valid JSON. No prose, no markdown fences.",
    messages: [{ role: "user", content: params.prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // one repair attempt
    const repair = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: params.maxTokens ?? 2000,
      system: "The previous output was not valid JSON. Return ONLY the corrected valid JSON, nothing else.",
      messages: [{ role: "user", content: cleaned }],
    });
    const repairedText = repair.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/^```json\s*|\s*```$/g, "")
      .trim();
    return JSON.parse(repairedText) as T;
  }
}
