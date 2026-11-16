"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/#library", label: "Conversations", short: "Talk", icon: "💬", match: (p: string) => p.startsWith("/c/") },
  { href: "/essays", label: "Essays", icon: "📝", match: (p: string) => p.startsWith("/essays") },
  { href: "/twisters", label: "Twisters", icon: "👅", match: (p: string) => p.startsWith("/twisters") },
  { href: "/exams", label: "IELTS/PTE", icon: "🎓", match: (p: string) => p.startsWith("/exams") },
];

/** Desktop links in the header. */
export function HeaderLinks() {
  const path = usePathname();
  return (
    <div className="hidden items-center gap-1 lg:flex">
      {ITEMS.slice(1).map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${i.match(path) ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
        >
          {i.icon} {i.label}
        </Link>
      ))}
    </div>
  );
}

/** Bottom tab bar for phones and tablets. */
export function BottomTabs() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07070f]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((i) => {
          const on = i.match(path);
          return (
            <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on ? "text-white" : "text-white/50"}`}>
              <span className={`flex h-8 w-12 items-center justify-center rounded-full text-lg transition ${on ? "bg-gradient-to-r from-fuchsia-500/40 to-cyan-400/30" : ""}`}>
                {i.icon}
              </span>
              {i.short ?? i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
