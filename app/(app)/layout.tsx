import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import { AppSidebarNav } from "@/components/app-sidebar-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-ink bg-grid-fade text-white lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/60 bg-panel/60 lg:flex">
        {/* Clickable brand icon/name -> landing page, per product requirement */}
        <Link
          href="/"
          className="flex items-center gap-2.5 border-b border-line/60 px-5 py-5 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan"
          aria-label={`${APP_NAME} — go to homepage`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-signal shadow-glow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2 3 7l9 5 9-5-9-5Z" fill="#070B14" fillOpacity="0.15" stroke="#070B14" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M3 12l9 5 9-5M3 17l9 5 9-5" stroke="#070B14" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-base font-semibold">{APP_NAME}</span>
        </Link>
        <AppSidebarNav />
      </aside>

      {/* Mobile top bar — brand icon still clickable back to landing page */}
      <div className="flex items-center justify-between border-b border-line/60 bg-panel/60 px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} — go to homepage`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan to-signal" />
          <span className="font-display text-sm font-semibold">{APP_NAME}</span>
        </Link>
        <MobileNavLinks />
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

function MobileNavLinks() {
  return (
    <nav className="flex gap-3 text-xs text-mist">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/materials">Materials</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
