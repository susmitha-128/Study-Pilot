import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/anthropic";

// Claude calls can run long, especially on a cold start — give this
// route real room so a slow-but-successful call isn't killed mid-flight.
export const maxDuration = 60;

const SYSTEM = `You write short diagnostic quizzes for students, grounded in the given topic and
source material. Mix question types. Keep explanations concise. Never invent facts not
supported by well-established knowledge of the subject.`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { topicId, goalId } = await req.json();
    const { data: topic } = await supabase.from("topics").select("*, materials(extracted_text)").eq("id", topicId).eq("user_id", user.id).single();
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const jsonShape = `{"questions": [{"type": "mcq"|"true_false"|"fill_blank"|"short_answer"|"scenario", "question": string, "options": string[]|null, "correctAnswer": string, "explanation": string, "difficulty": "easy"|"medium"|"hard"}]}`;
    const source = (topic as any).materials?.extracted_text?.slice(0, 8000) || topic.summary || topic.title;

    const result = await askForJSON<{ questions: any[] }>({
      system: SYSTEM,
      prompt: `Topic: ${topic.title}\nSource: ${source}\n\nGenerate 5 questions, mixed types and difficulty. Return JSON matching: ${jsonShape}`,
      maxTokens: 2000,
    });

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({ user_id: user.id, goal_id: goalId, topic_id: topicId, title: `Quiz: ${topic.title}` })
      .select()
      .single();
    if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 });

    const rows = result.questions.map((q, i) => ({
      quiz_id: quiz.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      order_index: i,
    }));
    const { error: qError } = await supabase.from("quiz_questions").insert(rows);
    if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

    return NextResponse.json({ quizId: quiz.id });
  } catch (err: any) {
    console.error("quiz/generate error:", err);
    return NextResponse.json({ error: err?.message || "Quiz generation failed. Please try again." }, { status: 500 });
  }
}
