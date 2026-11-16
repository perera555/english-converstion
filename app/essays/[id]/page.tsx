import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EssayReader from "@/components/EssayReader";
import { PracticeTimer } from "@/components/PracticeTimer";
import { LessonHeader, VocabAndTip } from "@/components/PageParts";
import { ESSAY_TOTAL, essays, getEssay } from "@/lib/essays";
import { estimateMinutes, levelMeta } from "@/lib/levels";
import { videosFor } from "@/lib/videos";

// Prerender a sample; the rest render on first visit and are cached.
export function generateStaticParams() {
  return essays.filter((e) => e.id % 25 === 1).map((e) => ({ id: String(e.id) }));
}

function load(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n >= 1 && n <= ESSAY_TOTAL ? getEssay(n) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/essays/[id]">): Promise<Metadata> {
  const e = load((await params).id);
  return e ? { title: `${e.title} (${levelMeta(e.level).label} essay)` } : { title: "Not found" };
}

export default async function EssayPage({ params }: PageProps<"/essays/[id]">) {
  const essay = load((await params).id);
  if (!essay) notFound();
  const lm = levelMeta(essay.level);

  return (
    <div className="mx-auto max-w-5xl py-8">
      <LessonHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/essays", label: "Essays" },
          { href: `/essays/${essay.id}`, label: `#${essay.id}` },
        ]}
        icon={essay.emoji}
        gradient={lm.gradient}
        chips={
          <>
            <span className={`rounded-full px-3 py-1 font-semibold ring-1 ${lm.chip}`}>
              {lm.label} · {lm.cefr}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-white/60 ring-1 ring-white/10">{essay.topic}</span>
          </>
        }
        title={essay.title}
        meta={<>by {essay.author} · {essay.words} words · ⏱ ≈{estimateMinutes(essay.words)} min</>}
        prev={essay.id > 1 ? `/essays/${essay.id - 1}` : null}
        next={essay.id < ESSAY_TOTAL ? `/essays/${essay.id + 1}` : null}
      />

      <div className="mb-6">
        <PracticeTimer estimate={estimateMinutes(essay.words)} />
      </div>

      <EssayReader key={essay.id} essay={essay} videos={videosFor(essay.topic)} search={`${lm.label} English ${essay.topic} listening`} />

      <VocabAndTip vocab={essay.vocab} tipTitle="Writing tip" tip={essay.tip} />

      <nav className="mt-12 grid grid-cols-2 gap-4">
        {essay.id > 1 ? (
          <Link href={`/essays/${essay.id - 1}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.07]">
            <div className="text-xs text-white/50">← Previous</div>
            <div className="font-semibold">Essay #{essay.id - 1}</div>
          </Link>
        ) : (
          <span />
        )}
        {essay.id < ESSAY_TOTAL && (
          <Link href={`/essays/${essay.id + 1}`} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 p-4 text-right">
            <div className="text-xs text-white/70">Next →</div>
            <div className="font-semibold">Essay #{essay.id + 1}</div>
          </Link>
        )}
      </nav>
    </div>
  );
}
