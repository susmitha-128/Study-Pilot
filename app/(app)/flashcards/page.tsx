import { createClient } from "@/lib/supabase/server";
import { FlashcardReviewer } from "@/components/flashcard-reviewer";

export default async function FlashcardsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cards } = await supabase
    .from("flashcards")
    .select("*, topics(title)")
    .eq("user_id", user!.id)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(30);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Flashcards</h1>
      <p className="mt-1 text-sm text-mist">Prioritized from your weakest topics first.</p>

      {!cards || cards.length === 0 ? (
        <p className="card mt-6 text-sm text-mist">
          Nothing due right now — flashcards are generated automatically from your study material
          and weak areas.
        </p>
      ) : (
        <div className="mt-6">
          <FlashcardReviewer cards={cards as any} />
        </div>
      )}
    </div>
  );
}
