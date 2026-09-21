"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StudySessionClient({ task, goalId }: { task: any; goalId: string }) {
  const [notes, setNotes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!task.topic_id) {
      setLoading(false);
      return;
    }
    fetch("/api/notes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: task.topic_id }),
    })
      .then((r) => r.json())
      .then((d) => {
        setNotes(d.notes);
        fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: task.topic_id }),
        }).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [task.topic_id]);

  async function markComplete() {
    setCompleting(true);
    await fetch("/api/plan/task-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    });
    router.push(`/quiz/new?topic=${task.topic_id}&goal=${goalId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-wide text-cyan">Today&apos;s Goal</p>
      <h1 className="mt-1 font-display text-2xl font-semibold">{task.title}</h1>

      {loading ? (
        <p className="card mt-6 text-sm text-mist">Preparing your notes…</p>
      ) : notes ? (
        <div className="mt-6 space-y-4">
          <Section title="Quick Summary">{notes.summary}</Section>
          <Section title="Key Concepts">
            <ul className="list-disc space-y-1 pl-5 text-sm text-mist">
              {(notes.key_concepts || []).map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Section>
          <Section title="Detailed Explanation">{notes.detailed_explanation}</Section>
          {notes.definitions?.length > 0 && (
            <Section title="Important Definitions">
              <dl className="space-y-2 text-sm">
                {notes.definitions.map((d: any, i: number) => (
                  <div key={i}>
                    <dt className="font-medium text-white">{d.term}</dt>
                    <dd className="text-mist">{d.definition}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {notes.examples?.length > 0 && (
            <Section title="Examples">
              <ul className="list-disc space-y-1 pl-5 text-sm text-mist">
                {notes.examples.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Section>
          )}
          {notes.exam_points?.length > 0 && (
            <Section title="Exam Points">
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber">
                {notes.exam_points.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      ) : (
        <p className="card mt-6 text-sm text-mist">No source material linked to this topic yet.</p>
      )}

      <button onClick={markComplete} disabled={completing} className="btn-primary mt-6 w-full">
        {completing ? "Saving…" : "I've studied this — Take the quiz"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="mb-2 font-display text-sm font-semibold text-cyan">{title}</h2>
      <div className="text-sm leading-relaxed text-mist">{children}</div>
    </div>
  );
}
