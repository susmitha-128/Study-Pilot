"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Msg {
  role: "agent" | "student";
  content: string;
}

const OPENING: Msg = {
  role: "agent",
  content: "Hi! I'm your Study Pilot agent. Tell me what you're trying to achieve.",
};

export default function NewGoalPage() {
  const [messages, setMessages] = useState<Msg[]>([OPENING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [goalPreview, setGoalPreview] = useState<any>(null);
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const next = [...messages, { role: "student" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      // The server route always returns JSON, even on error — but guard the
      // parse itself too (e.g. a platform-level timeout can return HTML).
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("The agent didn't respond in time. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setGoalPreview(data.goal);
      setMessages((m) => [...m, { role: "agent", content: data.reply }]);
      if (data.done && data.goalId) {
        setTimeout(() => router.push(`/materials?goal=${data.goalId}`), 1400);
      }
    } catch (err: any) {
      setMessages((m) => [...m, { role: "agent", content: `Something went wrong: ${err.message}` }]);
    } finally {
      // Always runs — success, handled error, or unexpected throw — so the
      // chat can never get stuck showing "Thinking…" with no way forward.
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "70vh" }}>
      <h1 className="mb-4 font-display text-xl font-semibold">Build your study goal</h1>

      <div className="card flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: "50vh" }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "student" ? "bg-cyan text-ink" : "bg-panel2 text-white"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-mist">Thinking…</p>}
        <div ref={endRef} />
      </div>

      {goalPreview && (
        <div className="card mt-4 border-cyan/30">
          <p className="mb-2 text-xs font-semibold text-cyan">Here&apos;s what I understand so far</p>
          <dl className="grid grid-cols-2 gap-2 text-xs text-mist">
            <dt>Goal</dt>
            <dd className="text-white">{goalPreview.title || "—"}</dd>
            <dt>Deadline</dt>
            <dd className="text-white">{goalPreview.deadline || "—"}</dd>
            <dt>Daily time</dt>
            <dd className="text-white">{goalPreview.dailyStudyMinutes ? `${goalPreview.dailyStudyMinutes} min` : "—"}</dd>
            <dt>Level</dt>
            <dd className="text-white">{goalPreview.currentLevel || "—"}</dd>
          </dl>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) send(input.trim());
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          className="input"
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
