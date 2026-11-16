import type { Metadata } from "next";
import Link from "next/link";
import Library from "@/components/Library";
import { SectionHero } from "@/components/PageParts";
import { getSummaries, TOTAL } from "@/lib/conversations";
import { LEVELS } from "@/lib/levels";

export const metadata: Metadata = {
  title: "Conversations",
  description: "1,250 real-life English conversations from beginner to native with real videos, karaoke and voice practice.",
};

export default function ConversationsPage() {
  const items = getSummaries();
  return (
    <div className="pb-10">
      <SectionHero icon="💬" kicker="Talk like a native" title="Conversations" count={TOTAL} unit="conversations · Beginner → Native">
        Pick a conversation: watch the real video, follow the animated scene with karaoke subtitles, then do voice practice or role-play.
        Repeat any conversation up to 50 times.
      </SectionHero>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {LEVELS.map((l, i) => {
          const first = items.find((c) => c.level === l.id)!;
          return (
            <Link key={l.id} href={`/c/${first.id}`} data-tilt="10" className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.gradient}`} />
              <div className={`text-xs font-bold ${l.text}`}>
                Level {i + 1} · {l.cefr}
              </div>
              <div className="mt-1 font-black">{l.label}</div>
              <div className="mt-2 text-xs font-semibold text-white/60">Start lesson →</div>
            </Link>
          );
        })}
      </div>

      <Library items={items} />
    </div>
  );
}
