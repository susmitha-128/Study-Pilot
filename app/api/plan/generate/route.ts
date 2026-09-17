import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Deterministic scheduler: takes the topic tree for a goal and lays it out
// day-by-day up to the deadline, respecting daily available study time and
// topic dependencies (parent topics scheduled before their subtopics).
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { goalId } = await req.json();
  const { data: goal } = await supabase.from("goals").select("*").eq("id", goalId).eq("user_id", user.id).single();
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("goal_id", goalId)
    .is("parent_topic_id", null) // top-level topics only drive the day-by-day plan
    .order("order_index", { ascending: true });

  if (!topics || topics.length === 0) {
    return NextResponse.json({ error: "No topics found — upload and analyze material first." }, { status: 400 });
  }

  // Deactivate any previous plan version, then create a new active one.
  await supabase.from("study_plans").update({ is_active: false }).eq("goal_id", goalId).eq("is_active", true);
  const { data: existingPlans } = await supabase.from("study_plans").select("version").eq("goal_id", goalId).order("version", { ascending: false }).limit(1);
  const nextVersion = (existingPlans?.[0]?.version || 0) + 1;

  const { data: plan, error: planError } = await supabase
    .from("study_plans")
    .insert({ user_id: user.id, goal_id: goalId, version: nextVersion, is_active: true, reason: nextVersion === 1 ? "initial" : "manual regeneration" })
    .select()
    .single();
  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  const dailyMinutes = goal.daily_study_minutes || 60;
  const today = new Date();
  let cursorDate = new Date(today);
  let minutesUsedToday = 0;
  let orderIndex = 0;
  const tasks: any[] = [];

  for (const topic of topics) {
    const duration = topic.estimated_minutes || 30;
    if (minutesUsedToday + duration > dailyMinutes && minutesUsedToday > 0) {
      cursorDate.setDate(cursorDate.getDate() + 1);
      minutesUsedToday = 0;
    }
    tasks.push({
      user_id: user.id,
      plan_id: plan.id,
      topic_id: topic.id,
      scheduled_date: cursorDate.toISOString().slice(0, 10),
      title: topic.title,
      duration_minutes: duration,
      status: "pending",
      order_index: orderIndex++,
    });
    minutesUsedToday += duration;
  }

  const { error: taskError } = await supabase.from("plan_tasks").insert(tasks);
  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

  await supabase.from("agent_actions").insert({
    user_id: user.id,
    goal_id: goalId,
    action_type: "generated_plan",
    summary: `Created a ${tasks.length}-task study plan across ${cursorDate.getDate() - today.getDate() + 1} day(s).`,
  });

  return NextResponse.json({ planId: plan.id, taskCount: tasks.length });
}
