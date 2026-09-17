import { createClient } from "@/lib/supabase/server";

export default async function AgentActivityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: actions } = await supabase
    .from("agent_actions")
    .select("*, goals(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold">Agent Activity</h1>
      <p className="mt-1 text-sm text-mist">Every decision the agent has made, in order.</p>

      {!actions || actions.length === 0 ? (
        <p className="card mt-6 text-sm text-mist">
          No activity yet — create a goal and upload material to see the agent get to work.
        </p>
      ) : (
        <ol className="mt-6 space-y-3 border-l border-line pl-5">
          {actions.map((a: any) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan" />
              <p className="text-sm text-white">✓ {a.summary}</p>
              <p className="mt-0.5 text-xs text-mist">
                {a.goals?.title ? `${a.goals.title} · ` : ""}
                {new Date(a.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
