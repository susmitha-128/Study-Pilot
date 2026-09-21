import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/gemini";

// Claude calls can run long, especially on a cold start — give this
// route real room so a slow-but-successful call isn't killed mid-flight.
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { topicId } = await req.json();
    const { data: existing } = await supabase.from("flashcards").select("id").eq("topic_id", topicId).eq("user_id", user.id);
    if (existing && existing.length > 0) return NextResponse.json({ created: 0, note: "Flashcards already exist for this topic." });

    const { data: topic } = await supabase.from("topics").select("*, materials(extracted_text)").eq("id", topicId).eq("user_id", user.id).single();
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const source = (topic as any).materials?.extracted_text?.slice(0, 6000) || topic.summary || topic.title;
    const result = await askForJSON<{ cards: { front: string; back: string }[] }>({
      system: "Generate concise flashcards (front = question/concept, back = answer/explanation) grounded in the given material.",
      prompt: `Topic: ${topic.title}\nSource: ${source}\n\nGenerate 6 flashcards. Return JSON: {"cards":[{"front":string,"back":string}]}`,
      maxTokens: 1200,
    });

    const { error } = await supabase.from("flashcards").insert(
      result.cards.map((c) => ({ user_id: user.id, topic_id: topicId, front: c.front, back: c.back, status: "new" }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("agent_actions").insert({
      user_id: user.id,
      goal_id: topic.goal_id,
      action_type: "generated_flashcards",
      summary: `Created ${result.cards.length} flashcards for "${topic.title}".`,
    });

    return NextResponse.json({ created: result.cards.length });
  } catch (err: any) {
    console.error("flashcards/generate error:", err);
    return NextResponse.json({ error: err?.message || "Flashcard generation failed." }, { status: 500 });
  }
}
