import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Player from "@/components/Player";
import { PracticeTimer } from "@/components/PracticeTimer";
import { LessonHeader, VocabAndTip } from "@/components/PageParts";
import { conversations, getConversation, TOTAL } from "@/lib/conversations";
import { estimateMinutes, levelMeta } from "@/lib/levels";
import { videosFor } from "@/lib/videos";

// Prerender a sample at build time; the rest render on first visit and are then cached.
export function generateStaticParams() {
  return conversations.filter((c) => c.id % 25 === 1).map((c) => ({ id: String(c.id) }));
}

function load(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n)) return undefined;
  return getConversation(n);
}

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const conv = load((await params).id);
  if (!conv) return { title: "Not found" };
  return {
    title: `${conv.title} (${levelMeta(conv.level).label})`,
    description: `Practice this ${levelMeta(conv.level).label.toLowerCase()} English conversation with voice, karaoke and speaking scores.`,
  };
}

export default async function ConversationPage({ params }: PageProps<"/c/[id]">) {
  const conv = load((await params).id);
  if (!conv) notFound();
  const lm = levelMeta(conv.level);
  const prev = conv.id > 1 ? conv.id - 1 : null;
  const next = conv.id < TOTAL ? conv.id + 1 : null;
  const minutes = estimateMinutes(conv.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0));

  return (
    <div className="mx-auto max-w-5xl py-8">
      <LessonHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/conversations", label: "Conversations" },
          { href: `/c/${conv.id}`, label: `#${conv.id}` },
        ]}
        icon={conv.emoji}
        gradient={lm.gradient}
        chips={
          <>
            <span className={`rounded-full px-3 py-1 font-semibold ring-1 ${lm.chip}`}>
              {lm.label} · {lm.cefr}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-white/60 ring-1 ring-white/10">{conv.topic}</span>
          </>
        }
        title={conv.title}
        meta={
          <>
            {conv.speakers.A.name} ({conv.speakers.A.role}) & {conv.speakers.B.name} ({conv.speakers.B.role}) · {conv.lines.length} lines · ⏱ ≈{minutes} min
          </>
        }
        prev={prev ? `/c/${prev}` : null}
        next={next ? `/c/${next}` : null}
      />

      <div className="mb-6">
        <PracticeTimer estimate={minutes} />
      </div>

      <Player key={conv.id} conv={conv} videos={videosFor(conv.topic)} search={`${lm.label} English conversation ${conv.topic}`} />

      <VocabAndTip vocab={conv.vocab} tipTitle="Teacher's tip" tip={conv.tip} />

      <nav className="mt-12 grid grid-cols-2 gap-4">
        {prev ? (
          <Link href={`/c/${prev}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.07]">
            <div className="text-xs text-white/50">← Previous</div>
            <div className="font-semibold">Conversation #{prev}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/c/${next}`}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 p-4 text-right shadow-lg shadow-fuchsia-500/20 transition hover:scale-[1.02]"
          >
            <div className="text-xs text-white/70">Next →</div>
            <div className="font-semibold">Conversation #{next}</div>
          </Link>
        )}
      </nav>
    </div>
  );
}
