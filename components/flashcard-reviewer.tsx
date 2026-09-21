"use client";

import { useState } from "react";

interface Card {
  id: string;
  front: string;
  back: string;
  status: string;
  topics?: { title: string } | null;
}

const RATINGS: { key: string; label: string; color: string }[] = [
  { key: "again", label: "Again", color: "border-coral text-coral" },
  { key: "hard", label: "Hard", color: "border-amber text-amber" },
  { key: "good", label: "Good", color: "border-cyan text-cyan" },
  { key: "easy", label: "Easy", color: "border-mint text-mint" },
];

export function FlashcardReviewer({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [remaining, setRemaining] = useState(cards);

  const card = remaining[index];
  if (!card) {
    return <p className="card text-center text-sm text-mint">All caught up for now 🎉</p>;
  }

  async function rate(rating: string) {
    await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcardId: card.id, rating }),
    }).catch(() => {});
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div>
      <p className="mb-2 text-xs text-mist">
        Card {index + 1} of {remaining.length} {card.topics?.title ? `· ${card.topics.title}` : ""}
      </p>
      <div
        onClick={() => setRevealed((r) => !r)}
        className="card flex min-h-[180px] cursor-pointer items-center justify-center text-center"
      >
        <p className="text-base">{revealed ? card.back : card.front}</p>
      </div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="btn-secondary mt-4 w-full">
          Show answer
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button key={r.key} onClick={() => rate(r.key)} className={`rounded-lg border py-2 text-xs font-semibold ${r.color}`}>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
