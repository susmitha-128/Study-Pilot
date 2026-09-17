"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-mist">We&apos;ll email you a secure reset link.</p>
      {sent ? (
        <p className="text-sm text-mint">Check {email} for the reset link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@university.edu"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Send reset link
          </button>
        </form>
      )}
    </div>
  );
}
