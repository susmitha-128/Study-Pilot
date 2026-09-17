import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GoalProgressPage({ params }: { params: { goalId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", params.goalId)
    .eq("user_id", user!.id)
    .single();

  if (!goal) notFound();

  const { data: mastery } = await supabase
    .from("topic_mastery")
    .select("*, topics(title)")
    .eq("goal_id", goal.id);

  const { data: tasks } = await supabase
    .from("plan_tasks")
    .select("status")
    .in(
      "plan_id",
      (
        await supabase.from("study_plans").select("id").eq("goal_id", goal.id).eq("is_active", true)
      ).data?.map((p) => p.id) || []
    );

  const completed = tasks?.filter((t) => t.status === "completed").length || 0;
  const total = tasks?.length || 0;

  const weak = (mastery || []).filter((m) => m.classification === "weak").map((m: any) => m.topics?.title).filter(Boolean);
  const strong = (mastery || []).filter((m) => m.classification === "strong").map((m: any) => m.topics?.title).filter(Boolean);

  const { data: latestAction } = await supabase
    .from("agent_actions")
    .select("summary")
    .eq("goal_id", goal.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold">{goal.title}</h1>
      <p className="mt-1 text-sm text-mist">
        {goal.deadline ? `Deadline: ${new Date(goal.deadline).toLocaleDateString()}` : "No deadline set"} · Status:{" "}
        <span className="text-white">{(goal.readiness_status || "not_started").replace("_", " ")}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Progress" value={`${Math.round(goal.progress_pct || 0)}%`} />
        <Stat label="Mastery" value={`${Math.round(goal.mastery_pct || 0)}%`} />
        <Stat label="Tasks Completed" value={`${completed} / ${total}`} />
        <Stat label="Status" value={(goal.readiness_status || "not_started").replace("_", " ")} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-display text-sm font-semibold text-coral">Weak Topics</h2>
          {weak.length ? (
            <ul className="space-y-1.5 text-sm text-mist">
              {weak.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">No weak topics detected yet — keep studying and taking quizzes.</p>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-display text-sm font-semibold text-mint">Strong Topics</h2>
          {strong.length ? (
            <ul className="space-y-1.5 text-sm text-mist">
              {strong.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">Nothing marked strong yet.</p>
          )}
        </div>
      </div>

      {latestAction && (
        <div className="card mt-4">
          <h2 className="mb-2 font-display text-sm font-semibold text-cyan">Next Recommended Action</h2>
          <p className="text-sm text-mist">{latestAction.summary}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs text-mist">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold capitalize">{value}</p>
    </div>
  );
}
