import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quiz-runner";

export default async function QuizPage({ params }: { params: { quizId: string } }) {
  const supabase = createClient();
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", params.quizId).single();
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", params.quizId)
    .order("order_index", { ascending: true });

  if (!quiz || !questions) return <p className="card mx-auto mt-10 max-w-md text-center text-sm text-mist">Quiz not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">{quiz.title}</h1>
      <QuizRunner quizId={quiz.id} goalId={quiz.goal_id} questions={questions as any} />
    </div>
  );
}
