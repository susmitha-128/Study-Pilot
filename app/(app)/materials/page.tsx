import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MaterialsUploader } from "@/components/materials-uploader";

export default async function MaterialsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: materials } = await supabase
    .from("materials")
    .select("*, goals(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!goals || goals.length === 0) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <p className="text-sm text-mist">Create a goal first, then attach material to it.</p>
        <Link href="/goal/new" className="btn-primary mt-4 inline-block">
          Create My Goal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold">Materials</h1>
      <p className="mt-1 text-sm text-mist">
        Attach PDFs, lecture notes, slides, or even a photo of your handwritten notes — the agent
        reads it and grounds every note, quiz, and flashcard in exactly what you give it.
      </p>

      <div className="mt-6">
        <MaterialsUploader goals={goals} />
      </div>

      <h2 className="mb-3 mt-10 font-display text-sm font-semibold text-mist">Uploaded so far</h2>
      {!materials || materials.length === 0 ? (
        <p className="text-sm text-mist">
          Upload your first chapter and I&apos;ll turn it into a study plan.
        </p>
      ) : (
        <ul className="space-y-2">
          {materials.map((m: any) => (
            <li key={m.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{m.file_name}</p>
                <p className="text-xs text-mist">{m.goals?.title}</p>
              </div>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    uploaded: "bg-line/50 text-mist",
    analyzing: "bg-amber/15 text-amber",
    analyzed: "bg-mint/15 text-mint",
    failed: "bg-coral/15 text-coral",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}
