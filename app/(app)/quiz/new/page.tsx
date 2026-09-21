import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/gemini";

// Generates (or reuses) a quiz for a topic, then redirects to it.
// Generation happens inline (not via a nested fetch) since Server Components
// can't reliably forward auth cookies to their own API routes.
export default async function NewQuizPage({ searchParams }: { searchParams: { topic?: string; goal?: string } }) {
  const supabase = createClient();
  const { topic: topicId, goal: goalId } = searchParams;
  if (!topicId || !goalId) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("topic_id", topicId)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) redirect(`/quiz/${existing.id}`);

  const { data: topic } = await supabase
    .from("topics")
    .select("*, materials(extracted_text)")
    .eq("id", topicId)
    .eq("user_id", user!.id)
    .single();
  if (!topic) redirect("/dashboard");

  const source = (topic as any).materials?.extracted_text?.slice(0, 8000) || topic.summary || topic.title;
  const result = await askForJSON<{ questions: any[] }>({
    system:
      "You write short diagnostic quizzes for students, grounded in the given topic and source material. Mix question types and difficulty. Never invent facts not supported by well-established knowledge of the subject.",
    prompt: `Topic: ${topic.title}\nSource: ${source}\n\nGenerate 5 questions. Return JSON: {"questions":[{"type":"mcq"|"true_false"|"fill_blank"|"short_answer"|"scenario","question":string,"options":string[]|null,"correctAnswer":string,"explanation":string,"difficulty":"easy"|"medium"|"hard"}]}`,
    maxTokens: 2000,
  });

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({ user_id: user!.id, goal_id: goalId, topic_id: topicId, title: `Quiz: ${topic.title}` })
    .select()
    .single();
  if (quizError || !quiz) redirect("/dashboard");

  await supabase.from("quiz_questions").insert(
    result.questions.map((q, i) => ({
      quiz_id: quiz.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      order_index: i,
    }))
  );

  redirect(`/quiz/${quiz.id}`);
}
