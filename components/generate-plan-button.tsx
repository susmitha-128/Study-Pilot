"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratePlanButton({ goalId }: { goalId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <button onClick={generate} disabled={loading} className="btn-primary">
        {loading ? "Building plan…" : "Generate My Plan"}
      </button>
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
