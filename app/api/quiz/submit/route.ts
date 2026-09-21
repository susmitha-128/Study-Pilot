import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/gemini";

// Claude calls can run long, especially on a cold start — give this
// route real room so a slow-but-successful call isn't killed mid-flight.
export const maxDuration = 60;

function classify(pct: number): "weak" | "needs_practice" | "strong" {
  if (pct >= 75) return "strong";
  if (pct >= 50) return "needs_practice";
  return "weak";
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
  const { quizId, goalId, answers } = await req.json();

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).eq("user_id", user.id).single();
  const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId);
  if (!quiz || !questions) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Grade: exact/normalized match for objective types; Claude judges free-text leniently.
  const breakdown: any[] = [];
  let correctCount = 0;
  const freeText = questions.filter((q) => q.type === "short_answer" || q.type === "scenario");
  let leniencyMap: Record<string, boolean> = {};

  if (freeText.length > 0) {
    const judged = await askForJSON<{ results: { questionId: string; correct: boolean }[] }>({
      system: "You grade short student answers leniently — correct if the core idea matches, even with different wording.",
      prompt: `Grade each answer as correct or incorrect:\n${freeText
        .map((q) => `Q(${q.id}): ${q.question}\nExpected: ${q.correct_answer}\nStudent answered: ${answers[q.id] || "(blank)"}`)
        .join("\n\n")}\n\nReturn JSON: {"results":[{"questionId": string, "correct": boolean}]}`,
      maxTokens: 800,
    });
    leniencyMap = Object.fromEntries(judged.results.map((r) => [r.questionId, r.correct]));
  }

  for (const q of questions) {
    const studentAnswer = answers[q.id] ?? "";
    let isCorrect: boolean;
    if (q.type === "short_answer" || q.type === "scenario") {
      isCorrect = !!leniencyMap[q.id];
    } else {
      isCorrect = studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
    }
    if (isCorrect) correctCount++;
    breakdown.push({
      questionId: q.id,
      question: q.question,
      isCorrect,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    });
  }

  const scorePct = (correctCount / questions.length) * 100;

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .insert({ user_id: user.id, quiz_id: quizId, score_pct: scorePct, completed_at: new Date().toISOString() })
    .select()
    .single();

  await supabase.from("quiz_answers").insert(
    breakdown.map((b) => ({
      attempt_id: attempt!.id,
      question_id: b.questionId,
      student_answer: answers[b.questionId] ?? "",
      is_correct: b.isCorrect,
    }))
  );

  // Update mastery for this topic.
  let planUpdated = false;
  let planUpdateReason = "";

  if (quiz.topic_id) {
    const classification = classify(scorePct);
    await supabase
      .from("topic_mastery")
      .upsert(
        {
          user_id: user.id,
          topic_id: quiz.topic_id,
          goal_id: goalId,
          mastery_pct: scorePct,
          classification,
          quiz_avg_pct: scorePct,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" }
      );

    await supabase.from("agent_actions").insert({
      user_id: user.id,
      goal_id: goalId,
      action_type: "evaluated_quiz",
      summary: `Scored ${Math.round(scorePct)}% on "${quiz.title}" — classified ${classification.replace("_", " ")}.`,
    });

    // ADAPT: if this topic is now weak, bump its next practice earlier and
    // push the least urgent still-strong topic later, then explain why.
    if (classification === "weak") {
      const { data: activePlan } = await supabase
        .from("study_plans")
        .select("id")
        .eq("goal_id", goalId)
        .eq("is_active", true)
        .maybeSingle();

      if (activePlan) {
        const { data: pendingTasks } = await supabase
          .from("plan_tasks")
          .select("*")
          .eq("plan_id", activePlan.id)
          .eq("status", "pending")
          .order("scheduled_date", { ascending: true });

        if (pendingTasks && pendingTasks.length > 0) {
          const earliestDate = pendingTasks[0].scheduled_date;
          const { data: topic } = await supabase.from("topics").select("title").eq("id", quiz.topic_id).single();

          await supabase.from("plan_tasks").insert({
            user_id: user.id,
            plan_id: activePlan.id,
            topic_id: quiz.topic_id,
            scheduled_date: earliestDate,
            title: `Targeted practice: ${topic?.title}`,
            duration_minutes: 30,
            status: "pending",
            order_index: -1, // sort first for that date
          });

          planUpdated = true;
          planUpdateReason = `You scored ${Math.round(scorePct)}% on ${topic?.title}, so I moved extra targeted practice into your next session ahead of lower-priority review.`;

          await supabase.from("agent_actions").insert({
            user_id: user.id,
            goal_id: goalId,
            action_type: "adapted_plan",
            summary: planUpdateReason,
            requires_approval: true,
            approved: true, // auto-applied; shown transparently for the student to review/undo
          });
        }
      }
    }
  }

  // Refresh goal-level aggregates.
  const { data: allMastery } = await supabase.from("topic_mastery").select("mastery_pct").eq("goal_id", goalId);
  const { data: allTasks } = await supabase
    .from("plan_tasks")
    .select("status, plan_id, study_plans!inner(goal_id)")
    .eq("study_plans.goal_id", goalId);

  const avgMastery = allMastery && allMastery.length ? allMastery.reduce((s, m) => s + (m.mastery_pct || 0), 0) / allMastery.length : 0;
  const completedTasks = (allTasks || []).filter((t: any) => t.status === "completed").length;
  const totalTasks = (allTasks || []).length || 1;
  const progressPct = (completedTasks / totalTasks) * 100;

  const { data: goal } = await supabase.from("goals").select("deadline").eq("id", goalId).single();
  let readiness: string = "on_track";
  if (goal?.deadline) {
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    const remainingWork = 1 - progressPct / 100;
    if (avgMastery >= 85 && progressPct >= 90) readiness = "ready";
    else if (daysLeft <= 0) readiness = remainingWork > 0.1 ? "behind" : "ready";
    else if (remainingWork > daysLeft / 30) readiness = "behind";
    else readiness = "on_track";
  }

  await supabase.from("goals").update({ progress_pct: progressPct, mastery_pct: avgMastery, readiness_status: readiness }).eq("id", goalId);
  await supabase.from("progress_snapshots").insert({ user_id: user.id, goal_id: goalId, progress_pct: progressPct, mastery_pct: avgMastery });

  return NextResponse.json({ scorePct, breakdown, planUpdated, planUpdateReason });
  } catch (err: any) {
    console.error("quiz/submit error:", err);
    return NextResponse.json({ error: err?.message || "Grading failed. Please try again." }, { status: 500 });
  }
}
