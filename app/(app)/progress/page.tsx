import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /progress with no id -> send the student to their most recently active goal,
// or back to the dashboard's empty state if they have none yet.
export default async function ProgressIndexPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (goal) redirect(`/progress/${goal.id}`);

  return (
    <div className="card mx-auto mt-10 max-w-md text-center">
      <p className="text-sm text-mist">You don&apos;t have a goal yet — create one to start tracking progress.</p>
      <Link href="/goal/new" className="btn-primary mt-4 inline-block">
        Create My Goal
      </Link>
    </div>
  );
}
