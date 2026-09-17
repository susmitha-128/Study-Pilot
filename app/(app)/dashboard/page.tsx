import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Good to see you, {firstName}</h1>
      <p className="mt-1 text-sm text-mist">Let&apos;s move you closer to your goal.</p>

      <div id="goals" className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">My Goals</h2>
        <Link href="/goal/new" className="btn-primary">
          + New Goal
        </Link>
      </div>

      {!goals || goals.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-sm text-mist">You haven&apos;t created a goal yet.</p>
          <Link href="/goal/new" className="btn-primary">
            Create My Goal
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <div key={goal.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold">{goal.title}</h3>
                  {goal.deadline && (
                    <p className="mt-0.5 text-xs text-mist">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <StatusPill status={goal.readiness_status} />
              </div>

              <div className="mt-4 space-y-2">
                <ProgressBar label="Progress" value={goal.progress_pct} color="bg-cyan" />
                <ProgressBar label="Mastery" value={goal.mastery_pct} color="bg-mint" />
              </div>

              <div className="mt-5 flex gap-2">
                <Link href={`/study/${goal.id}`} className="btn-primary flex-1 text-center">
                  Start Today&apos;s Study
                </Link>
                {/* Track Progress — dedicated per-goal progress view */}
                <Link href={`/progress/${goal.id}`} className="btn-secondary flex-1 text-center">
                  Track Progress
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-mist">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    on_track: "bg-mint/15 text-mint",
    ahead: "bg-mint/15 text-mint",
    ready: "bg-cyan/15 text-cyan",
    behind: "bg-amber/15 text-amber",
    not_started: "bg-line/50 text-mist",
  };
  const label: Record<string, string> = {
    on_track: "On track",
    ahead: "Ahead",
    ready: "Ready",
    behind: "Behind",
    not_started: "Not started",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${map[status] || map.not_started}`}>
      {label[status] || "Not started"}
    </span>
  );
}
