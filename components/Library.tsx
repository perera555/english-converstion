"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { ConversationSummary, Level } from "@/lib/types";
import { LEVELS, levelMeta } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

const PAGE = 48;

export default function Library({ items }: { items: ConversationSummary[] }) {
  const [level, setLevel] = useState<Level | "all">("all");
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "todo" | "done">("all");
  const [limit, setLimit] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());
  const { progress, reset } = useProgress();
  const done = useMemo(() => new Set(progress.done), [progress.done]);

  const topics = useMemo(() => {
    const src = level === "all" ? items : items.filter((i) => i.level === level);
    return Array.from(new Set(src.map((i) => i.topic))).sort();
  }, [items, level]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (level === "all" || i.level === level) &&
          (topic === "all" || i.topic === topic) &&
          (status === "all" || (status === "done" ? done.has(i.id) : !done.has(i.id))) &&
          (!q || `${i.title} ${i.topic} ${i.a} ${i.b} #${i.id}`.toLowerCase().includes(q)),
      ),
    [items, level, topic, status, q, done],
  );

  const pct = Math.round((progress.done.length / items.length) * 100);
  const nextUp = items.find((i) => !done.has(i.id));

  return (
    <section id="library" className="scroll-mt-20">
      {/* progress */}
      <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Your progress</div>
              <div className="mt-1 text-2xl font-black">
                {progress.done.length} <span className="text-base font-medium text-white/50">/ {items.length} conversations</span>
              </div>
            </div>
            <div className="text-3xl font-black text-fuchsia-300">{pct}%</div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {LEVELS.map((l) => {
              const total = items.filter((i) => i.level === l.id).length;
              const d = items.filter((i) => i.level === l.id && done.has(i.id)).length;
              return (
                <div key={l.id} className="text-xs text-white/60">
                  <span className={l.text}>{l.label}</span> · {d}/{total}
                </div>
              );
            })}
          </div>
        </div>
        {nextUp && (
          <Link
            href={`/c/${nextUp.id}`}
            className="group flex flex-col justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-700 p-5 shadow-xl shadow-fuchsia-500/20 transition hover:scale-[1.02] md:w-72"
          >
            <div className="text-xs uppercase tracking-widest text-white/70">Continue learning</div>
            <div className="mt-1 line-clamp-2 text-lg font-bold">
              {nextUp.emoji} {nextUp.title}
            </div>
            <div className="mt-2 text-sm font-semibold">Start now →</div>
          </Link>
        )}
      </div>

      {/* filters */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 space-y-3 border-y border-white/5 bg-[#07070f]/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap gap-2">
          <Chip active={level === "all"} onClick={() => { setLevel("all"); setTopic("all"); setLimit(PAGE); }}>
            All levels
          </Chip>
          {LEVELS.map((l) => (
            <Chip key={l.id} active={level === l.id} onClick={() => { setLevel(l.id); setTopic("all"); setLimit(PAGE); }} gradient={l.gradient}>
              {l.label} <span className="opacity-60">{l.cefr}</span>
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder={`Search ${items.length.toLocaleString()} conversations… (café, slang, interview, #512)`}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-fuchsia-400/60"
          />
          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setLimit(PAGE); }}
            className="rounded-xl border border-white/10 bg-[#11111d] px-3 py-2.5 text-sm"
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as typeof status); setLimit(PAGE); }}
            className="rounded-xl border border-white/10 bg-[#11111d] px-3 py-2.5 text-sm"
          >
            <option value="all">All</option>
            <option value="todo">Not done</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-white/50">
        <span>{filtered.length} conversations</span>
        {progress.done.length > 0 && (
          <button onClick={() => confirm("Reset all progress?") && reset()} className="hover:text-white">
            Reset progress
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, limit).map((c) => {
          const lm = levelMeta(c.level);
          const isDone = done.has(c.id);
          const best = progress.best[c.id];
          return (
            <Link
              key={c.id}
              href={`/c/${c.id}`}
              data-tilt="12"
              className="card-glow group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${lm.gradient} opacity-20 blur-2xl transition group-hover:opacity-40`} />
              <div className="relative flex items-start justify-between">
                <span className="text-4xl transition duration-300 group-hover:scale-110 group-hover:-rotate-6">{c.emoji}</span>
                <span className="text-xs font-mono text-white/35">#{c.id}</span>
              </div>
              <h3 className="relative mt-3 line-clamp-2 min-h-[3rem] font-bold leading-snug">{c.title}</h3>
              <p className="relative mt-1 text-xs text-white/50">
                {c.a} & {c.b} · {c.lines} lines · ⏱ {c.minutes} min
              </p>
              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${lm.chip}`}>{lm.label}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/10">{c.topic}</span>
                {isDone && (
                  <span className="ml-auto rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-black">
                    ✓ {best !== undefined ? `${best}%` : "Done"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/50">No conversations match. Try a different search.</div>
      )}

      {limit < filtered.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Load more ({filtered.length - limit} left)
          </button>
        </div>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  gradient = "from-white to-white",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active ? `bg-gradient-to-r ${gradient} text-black shadow-lg` : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
