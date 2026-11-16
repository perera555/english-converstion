import Link from "next/link";
import { DailyGoalCard } from "./PracticeTimer";

/** Same header for every section page: icon, title, count, description + daily goal. */
export function SectionHero({ icon, kicker, title, count, unit, children }: { icon: string; kicker: string; title: string; count: number; unit: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 grid items-center gap-6 pt-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">{kicker}</div>
        <h1 className="text-3d mt-2 text-4xl font-black tracking-tight sm:text-6xl">
          {icon} {title}
        </h1>
        <div className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
          {count.toLocaleString()} {unit}
        </div>
        <p className="mt-4 max-w-2xl text-white/65">{children}</p>
      </div>
      <DailyGoalCard />
    </div>
  );
}

/** Same header for every lesson page: breadcrumb, title, meta, and prev/next at the top. */
export function LessonHeader({
  crumbs,
  icon,
  gradient,
  chips,
  title,
  meta,
  prev,
  next,
}: {
  crumbs: { href: string; label: string }[];
  icon: string;
  gradient: string;
  chips: React.ReactNode;
  title: string;
  meta: React.ReactNode;
  prev?: string | null;
  next?: string | null;
}) {
  return (
    <header className="mb-6">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/50">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            <Link href={c.href} className="hover:text-white">
              {c.label}
            </Link>
          </span>
        ))}
        <span className="ml-auto flex gap-2">
          {prev ? (
            <Link href={prev} className="rounded-full bg-white/5 px-3 py-1 font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10">
              ← Prev
            </Link>
          ) : null}
          {next ? (
            <Link href={next} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 font-semibold text-white">
              Next →
            </Link>
          ) : null}
        </span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} text-5xl shadow-2xl`}>{icon}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs">{chips}</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <div className="mt-1 text-sm text-white/55">{meta}</div>
        </div>
      </div>
    </header>
  );
}

/** Vocabulary + tip cards shown at the bottom of every lesson. */
export function VocabAndTip({ vocab, tipTitle, tip }: { vocab: { word: string; meaning: string }[]; tipTitle: string; tip: string }) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {vocab.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">📖 Key vocabulary</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {vocab.map((v) => (
              <div key={v.word} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/5">
                <dt className="font-bold text-fuchsia-200">{v.word}</dt>
                <dd className="mt-1 text-sm text-white/60">{v.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {tip && (
        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 to-transparent p-6">
          <h2 className="text-lg font-black">💡 {tipTitle}</h2>
          <p className="mt-3 leading-relaxed text-white/80">{tip}</p>
        </section>
      )}
    </div>
  );
}
