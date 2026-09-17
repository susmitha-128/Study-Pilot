"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">Choose a new password</h1>
      {done ? (
        <p className="mt-4 text-sm text-mint">Password updated — redirecting to login…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="New password"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
