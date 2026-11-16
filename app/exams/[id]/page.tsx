import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EssayReader from "@/components/EssayReader";
import { PracticeTimer } from "@/components/PracticeTimer";
import WritingPractice from "@/components/WritingPractice";
import { EXAM_INFO, EXAM_TIPS, examEssays, toReaderEssay, TYPE_LABEL } from "@/lib/exams";
import { EXAM_VIDEOS } from "@/lib/videos";

export function generateStaticParams() {
  return examEssays.map((e) => ({ id: String(e.id) }));
}

const load = (id: string) => {
  const n = Number(id);
  return Number.isInteger(n) ? examEssays[n - 1] : undefined;
};

export async function generateMetadata({ params }: PageProps<"/exams/[id]">): Promise<Metadata> {
  const e = load((await params).id);
  return e ? { title: `${e.exam} model essay: ${e.theme} (${TYPE_LABEL[e.type]})` } : { title: "Not found" };
}

export default async function ExamPage({ params }: PageProps<"/exams/[id]">) {
  const e = load((await params).id);
  if (!e) notFound();
  const info = EXAM_INFO[e.exam];

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-6 flex flex-wrap gap-2 text-sm text-white/50">
        <Link href="/" className="hover:text-white">Home</Link>/
        <Link href={`/exams#${e.exam.toLowerCase()}`} className="hover:text-white">{e.exam}</Link>/<span className="text-white/80">{e.theme}</span>
      </div>

      <header className={`mb-6 rounded-3xl bg-gradient-to-r ${info.color} p-6 shadow-2xl`}>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-black/25 px-3 py-1">{e.exam}</span>
          <span className="rounded-full bg-black/25 px-3 py-1">{TYPE_LABEL[e.type]}</span>
          <span className="rounded-full bg-black/25 px-3 py-1">⏱ {info.minutes} min · {info.target}</span>
        </div>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">
          {e.emoji} {e.theme}
        </h1>
        <p className="mt-3 rounded-2xl bg-black/25 p-4 text-base font-medium leading-relaxed sm:text-lg">
          <span className="mr-2 text-xs font-bold uppercase tracking-widest text-white/70">Question</span>
          {e.question}
        </p>
      </header>

      <div className="mb-6">
        <PracticeTimer estimate={info.minutes} />
      </div>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black">🏅 Model answer · {e.words} words</h2>
          <span className="text-xs text-white/50">Structure highlighted for learning</span>
        </div>
        <div className="mt-4 space-y-4">
          {e.sections.map((s) => (
            <div key={s.label} className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/5">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-fuchsia-300">{s.label}</div>
              <p className="leading-relaxed text-white/85">{s.sentences.join(" ")}</p>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mb-3 text-lg font-black">🎧 Listen, watch & shadow the model answer</h2>
      <EssayReader key={e.id} essay={toReaderEssay(e)} videos={EXAM_VIDEOS[e.exam]} search={`${e.exam} writing ${TYPE_LABEL[e.type]} essay`} />

      <div className="mt-10">
        <WritingPractice id={e.id} minutes={info.minutes} min={info.min} max={info.max} question={e.question} />
      </div>

      <section className="mt-8 rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 to-transparent p-6">
        <h2 className="text-lg font-black">💡 {e.exam} tips</h2>
        <ul className="mt-3 space-y-2 text-white/80">
          {EXAM_TIPS[e.exam].map((t) => (
            <li key={t}>✓ {t}</li>
          ))}
        </ul>
      </section>

      <nav className="mt-10 grid grid-cols-2 gap-4">
        {e.id > 1 ? (
          <Link href={`/exams/${e.id - 1}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.07]">← Previous essay</Link>
        ) : (
          <span />
        )}
        {e.id < examEssays.length && (
          <Link href={`/exams/${e.id + 1}`} className="rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 p-4 text-right font-semibold">Next essay →</Link>
        )}
      </nav>
    </div>
  );
}
