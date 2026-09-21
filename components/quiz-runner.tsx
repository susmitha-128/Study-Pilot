"use client";

import { useState } from "react";
import Link from "next/link";

interface Q {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
}

export function QuizRunner({ quizId, goalId, questions }: { quizId: string; goalId: string; questions: Q[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, goalId, answers }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("Grading didn't finish in time. Please try again.");
      }
      if (!res.ok) throw new Error(data.error || "Grading failed.");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mt-6 space-y-4">
        <div className="card text-center">
          <p className="text-xs text-mist">Score</p>
          <p className="font-display text-3xl font-semibold text-cyan">{Math.round(result.scorePct)}%</p>
        </div>
        {result.planUpdated && (
          <div className="card border-cyan/30">
            <p className="mb-1 text-xs font-semibold text-cyan">PLAN UPDATED</p>
            <p className="text-sm text-mist">{result.planUpdateReason}</p>
          </div>
        )}
        <div className="space-y-3">
          {result.breakdown.map((b: any) => (
            <div key={b.questionId} className="card">
              <p className="text-sm font-medium">{b.question}</p>
              <p className={`mt-1 text-xs ${b.isCorrect ? "text-mint" : "text-coral"}`}>
                {b.isCorrect ? "Correct" : `Incorrect — correct answer: ${b.correctAnswer}`}
              </p>
              {b.explanation && <p className="mt-1 text-xs text-mist">{b.explanation}</p>}
            </div>
          ))}
        </div>
        <Link href={`/progress/${goalId}`} className="btn-primary block text-center">
          View Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="card">
          <p className="mb-3 text-sm font-medium">
            {i + 1}. {q.question}
          </p>
          {q.type === "mcq" || q.type === "true_false" ? (
            <div className="space-y-2">
              {(q.options || (q.type === "true_false" ? ["true", "false"] : [])).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-mist">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              className="input"
              placeholder="Your answer"
            />
          )}
        </div>
      ))}
      {error && <p className="text-center text-xs text-coral">{error}</p>}
      <button onClick={submit} disabled={submitting} className="btn-primary w-full">
        {submitting ? "Grading…" : "Submit Quiz"}
      </button>
    </div>
  );
}
