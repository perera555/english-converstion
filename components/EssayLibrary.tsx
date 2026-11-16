"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { EssaySummary } from "@/lib/essay-types";
import type { Level } from "@/lib/types";
import { LEVELS, levelMeta } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

const PAGE = 36;
const OFFSET = 100000;

export default function EssayLibrary({ items }: { items: EssaySummary[] }) {
  const [level, setLevel] = useState<Level | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());
  const { progress } = useProgress();
  const done = useMemo(() => new Set(progress.done), [progress.done]);

  const filtered = useMemo(
    () =>
      items.filter(
        (e) =>
          (level === "all" || e.level === level) &&
          (!q || `${e.title} ${e.topic} ${e.author} #${e.id}`.toLowerCase().includes(q)),
      ),
    [items, level, q],
  );
  const read = items.filter((e) => done.has(OFFSET + e.id)).length;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setLevel("all"); setLimit(PAGE); }}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${level === "all" ? "bg-white text-black" : "bg-white/5 ring-1 ring-white/10"}`}
        >
          All levels
        </button>
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLevel(l.id); setLimit(PAGE); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${level === l.id ? `bg-gradient-to-r ${l.gradient} text-black` : "bg-white/5 ring-1 ring-white/10"}`}
          >
            {l.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-white/50">
          📚 {read}/{items.length} read
        </span>
      </div>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
        placeholder="Search essays… (family, travel, AI, coffee)"
        className="mb-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/60"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, limit).map((e) => {
          const lm = levelMeta(e.level);
          return (
            <Link
              key={e.id}
              href={`/essays/${e.id}`}
              data-tilt="10"
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-xl shadow-black/30"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{e.emoji}</span>
                <span className="font-mono text-xs text-white/35">#{e.id}</span>
              </div>
              <h3 className="mt-3 line-clamp-2 font-bold leading-snug">{e.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-white/50">{e.preview}…</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${lm.chip}`}>{lm.label}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60 ring-1 ring-white/10">
                  {e.words} words · ⏱ {e.minutes} min
                </span>
                {done.has(OFFSET + e.id) && <span className="ml-auto rounded-full bg-emerald-400 px-2 py-0.5 font-bold text-black">✓ Read</span>}
              </div>
            </Link>
          );
        })}
      </div>
      {limit < filtered.length && (
        <div className="mt-8 text-center">
          <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10">
            Load more ({filtered.length - limit} left)
          </button>
        </div>
      )}
    </section>
  );
}
