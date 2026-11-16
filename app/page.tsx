import Link from "next/link";
import HeroCube from "@/components/HeroCube";
import { DailyGoalCard } from "@/components/PracticeTimer";
import OfflineSaver from "@/components/OfflineSaver";
import { getSummaries, TOTAL } from "@/lib/conversations";
import { ESSAY_TOTAL } from "@/lib/essays";
import { examEssays } from "@/lib/exams";
import { LEVELS } from "@/lib/levels";
import { twisters } from "@/lib/twisters";

const SECTIONS = [
  {
    href: "/conversations",
    icon: "💬",
    title: "Conversations",
    count: TOTAL,
    text: "Real-life dialogues with real videos, animated scenes, karaoke, shadowing and role-play.",
    cta: "Start talking",
    bg: "from-fuchsia-600/35 via-violet-600/25 to-transparent",
  },
  {
    href: "/essays",
    icon: "📝",
    title: "Essays",
    count: ESSAY_TOTAL,
    text: "Read-aloud essays from Beginner to Native with a video reading mode and sentence scores.",
    cta: "Read essays",
    bg: "from-cyan-500/35 via-sky-600/20 to-transparent",
  },
  {
    href: "/twisters",
    icon: "👅",
    title: "Tongue Twisters",
    count: twisters.length,
    text: "Challenge mode: say it into your mic, pass to unlock the next one, beat the boss twisters.",
    cta: "Take the challenge",
    bg: "from-rose-500/35 via-orange-500/20 to-transparent",
  },
  {
    href: "/exams",
    icon: "🎓",
    title: "IELTS & PTE",
    count: examEssays.length,
    text: "Model exam essays for every question type, a real exam timer and word counter.",
    cta: "Prepare for exams",
    bg: "from-emerald-500/35 via-teal-600/20 to-transparent",
  },
];

const FEATURES = [
  { icon: "🎥", title: "Real videos", text: "Native speakers on every topic, playable right inside the app." },
  { icon: "🎤", title: "Karaoke", text: "Every word lights up as it's spoken, so you can copy the rhythm." },
  { icon: "🗣️", title: "Voice scoring", text: "Speak into your mic and see exactly which words you got right." },
  { icon: "⏱️", title: "15 min a day", text: "A daily goal, streaks, and bonus time when you want more." },
];

export default function Home() {
  const items = getSummaries();
  return (
    <>
      {/* 1. hero */}
      <section className="relative pb-10 pt-12 sm:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 text-center lg:grid-cols-[1.4fr_1fr] lg:text-left">
          <div>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80 lg:mx-0">
              <span className="flex h-4 items-end gap-0.5" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="animate-wave w-0.5 rounded bg-fuchsia-400" style={{ height: "100%", animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
              100% free · Beginner → Native
            </div>
            <h1 className="text-3d text-4xl font-black leading-[1.05] tracking-tight sm:text-7xl">
              Speak English
              <br />
              <span className="text-shimmer [text-shadow:none]">like you mean it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/65 sm:text-lg lg:mx-0">
              Watch real videos, follow along karaoke-style, and talk back. Just 15 minutes a day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link href="/c/1" className="btn-3d rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-7 py-4 text-base font-bold">
                ▶ Start lesson 1
              </Link>
              <Link href="/twisters" className="btn-3d-ghost rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-bold transition hover:bg-white/10">
                👅 Twister challenge
              </Link>
            </div>
          </div>
          <HeroCube />
        </div>
      </section>

      {/* 2. daily goal + offline practice */}
      <section className="mb-12 grid gap-4 lg:grid-cols-2">
        <DailyGoalCard />
        <OfflineSaver />
      </section>

      {/* 3. sections */}
      <section className="mb-14">
        <h2 className="mb-5 text-2xl font-black sm:text-3xl">What do you want to practice?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              data-tilt="10"
              className={`group relative flex min-h-56 flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${s.bg} p-6 shadow-xl shadow-black/40`}
            >
              <span className="pop-3d text-5xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{s.icon}</span>
              <div className="pop-3d-sm mt-4 text-2xl font-black">{s.title}</div>
              <div className="text-sm font-bold text-white/70">{s.count.toLocaleString()} lessons</div>
              <p className="mt-2 flex-1 text-sm text-white/60">{s.text}</p>
              <div className="mt-4 text-sm font-bold">
                {s.cta} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. levels */}
      <section id="levels" className="scroll-mt-20 pb-14">
        <h2 className="mb-5 text-2xl font-black sm:text-3xl">Conversations by level</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map((l, i) => {
            const first = items.find((c) => c.level === l.id)!;
            const count = items.filter((c) => c.level === l.id).length;
            return (
              <Link
                key={l.id}
                href={`/c/${first.id}`}
                data-tilt="12"
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/40"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.gradient}`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${l.text}`}>Level {i + 1}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs">{l.cefr}</span>
                </div>
                <div className="mt-2 text-xl font-black">{l.label}</div>
                <p className="mt-1 text-sm text-white/55">{l.blurb}</p>
                <div className="mt-4 text-sm font-semibold">
                  {count} conversations <span className="inline-block transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. features */}
      <section className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <div className="font-bold">{f.title}</div>
              <p className="text-sm text-white/55">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="text-center">
        <Link href="/conversations" className="btn-3d inline-block rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-8 py-4 font-black">
          💬 Browse all {TOTAL.toLocaleString()} conversations →
        </Link>
      </div>
    </>
  );
}
