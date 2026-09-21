"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/brand";

// Shared header used on the landing page AND inside the app shell.
// The logo/name is always a link back to "/" (the landing page), per product
// requirement: clicking the brand mark never traps the user inside the app.
export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Clickable brand mark -> always returns to the landing page */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan"
          aria-label={`${APP_NAME} — go to homepage`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-signal shadow-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2 3 7l9 5 9-5-9-5Z" stroke="#070B14" strokeWidth="1.6" strokeLinejoin="round" fill="#070B14" fillOpacity="0.08" />
              <path d="M3 12l9 5 9-5M3 17l9 5 9-5" stroke="#070B14" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            {APP_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {loading ? null : email ? (
            <>
              {!pathname?.startsWith("/dashboard") && (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-mist transition hover:text-white"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-mist transition hover:border-cyan/50 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-mist transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
