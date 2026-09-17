import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/anthropic";

const SYSTEM = `You are a patient, expert tutor. Generate student-friendly study notes for ONE topic,
grounded strictly in the provided source material. If the material doesn't cover something,
rely on well-established knowledge of the subject rather than inventing textbook-specific claims.
Keep it concise and structured — this will be rendered as cards, not a wall of text.`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { topicId } = await req.json();
  const { data: topic } = await supabase.from("topics").select("*, materials(extracted_text)").eq("id", topicId).eq("user_id", user.id).single();
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  // Return existing notes if already generated (avoid regenerating on every visit).
  const { data: existing } = await supabase.from("notes").select("*").eq("topic_id", topicId).maybeSingle();
  if (existing) return NextResponse.json({ notes: existing });

  const source = (topic as any).materials?.extracted_text?.slice(0, 12000) || topic.summary || topic.title;

  const jsonShape = `{"summary": string, "keyConcepts": string[], "detailedExplanation": string, "definitions": [{"term": string, "definition": string}], "examples": string[], "examPoints": string[], "commonConfusions": string[]}`;

  const generated = await askForJSON<any>({
    system: SYSTEM,
    prompt: `Topic: ${topic.title}\nSummary: ${topic.summary || ""}\n\nSource material:\n${source}\n\nReturn JSON matching: ${jsonShape}`,
    maxTokens: 2500,
  });

  const { data: notes, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      topic_id: topicId,
      summary: generated.summary,
      key_concepts: generated.keyConcepts,
      detailed_explanation: generated.detailedExplanation,
      definitions: generated.definitions,
      examples: generated.examples,
      exam_points: generated.examPoints,
      common_confusions: generated.commonConfusions,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes });
}
