import { createClient } from "@/lib/supabase/server";
import { StudySessionClient } from "@/components/study-session-client";
import { GeneratePlanButton } from "@/components/generate-plan-button";

export default async function StudyPage({ params }: { params: { goalId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal } = await supabase.from("goals").select("*").eq("id", params.goalId).eq("user_id", user!.id).single();

  const { data: activePlan } = await supabase
    .from("study_plans")
    .select("id")
    .eq("goal_id", params.goalId)
    .eq("is_active", true)
    .maybeSingle();

  if (!activePlan) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <p className="text-sm text-mist">
          No study plan yet for <span className="text-white">{goal?.title}</span>. Upload material
          on the Materials page, then generate your plan.
        </p>
        <GeneratePlanButton goalId={params.goalId} />
      </div>
    );
  }

  const { data: nextTask } = await supabase
    .from("plan_tasks")
    .select("*, topics(*)")
    .eq("plan_id", activePlan.id)
    .eq("status", "pending")
    .order("scheduled_date", { ascending: true })
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextTask) {
    return <p className="card mx-auto mt-10 max-w-md text-center text-sm text-mint">Every task in your current plan is complete 🎉</p>;
  }

  return <StudySessionClient task={nextTask as any} goalId={params.goalId} />;
}
