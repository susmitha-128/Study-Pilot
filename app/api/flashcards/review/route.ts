import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simplified SM-2-style spaced repetition.
const INTERVALS: Record<string, number> = { again: 0, hard: 1, good: 3, easy: 6 };
const EASE_DELTA: Record<string, number> = { again: -0.3, hard: -0.15, good: 0, easy: 0.15 };
const STATUS_AFTER: Record<string, string> = { again: "learning", hard: "learning", good: "review", easy: "mastered" };

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { flashcardId, rating } = await req.json();
  const { data: card } = await supabase.from("flashcards").select("*").eq("id", flashcardId).eq("user_id", user.id).single();
  if (!card) return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });

  const newEase = Math.max(1.3, (card.ease_factor || 2.5) + (EASE_DELTA[rating] ?? 0));
  const intervalDays = INTERVALS[rating] ?? 1;
  const dueAt = new Date(Date.now() + intervalDays * 86400000).toISOString();

  await supabase
    .from("flashcards")
    .update({ ease_factor: newEase, interval_days: intervalDays, due_at: dueAt, status: STATUS_AFTER[rating] || card.status })
    .eq("id", card.id);

  await supabase.from("flashcard_reviews").insert({ user_id: user.id, flashcard_id: card.id, rating });

  return NextResponse.json({ ok: true });
}
