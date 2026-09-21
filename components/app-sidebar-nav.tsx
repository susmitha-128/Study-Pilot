"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard#goals", label: "My Goals", icon: "🎯" },
  { href: "/materials", label: "Materials", icon: "📎" },
  { href: "/flashcards", label: "Flashcards", icon: "🗂️" },
  { href: "/progress", label: "Progress", icon: "📊" },
  { href: "/agent-activity", label: "Agent Activity", icon: "⚡" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {ITEMS.map((item) => {
        const active = pathname === item.href.split("#")[0];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-cyan/10 text-cyan" : "text-mist hover:bg-panel2 hover:text-white"
            )}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
