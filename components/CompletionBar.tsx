"use client";

import { useProgress } from "@/lib/progress";

/**
 * Shows reading progress for the current run, and a clear "completed ×N"
 * status with a button to go again. Repeats are counted every time.
 */
export default function CompletionBar({
  id,
  step,
  total,
  playing,
  justFinished,
  onAgain,
  noun = "read",
  round = 1,
  rounds = 1,
  onRounds,
}: {
  id: number;
  step: number;
  total: number;
  playing: boolean;
  justFinished: boolean;
  onAgain: () => void;
  noun?: string;
  round?: number;
  rounds?: number;
  onRounds?: (n: number) => void;
}) {
  const { progress } = useProgress();
  const times = progress.count?.[id] ?? (progress.done.includes(id) ? 1 : 0);
  const pct = playing ? Math.round(((step + 1) / total) * 100) : justFinished ? 100 : 0;

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        justFinished ? "animate-pop border-emerald-400/50 bg-emerald-500/15" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {justFinished ? (
          <span className="font-black text-emerald-300">
            ✅ Completed{rounds > 1 ? ` all ${rounds} rounds` : ""}! That&apos;s {times} time{times === 1 ? "" : "s"} in total. Great job!
          </span>
        ) : times > 0 ? (
          <span className="font-bold text-emerald-300">
            ✅ Completed ×{times}
          </span>
        ) : (
          <span className="text-white/60">Not completed yet. Finish it from start to end to complete it.</span>
        )}
        {playing && (
          <span className="text-white/60">
            {rounds > 1 && <b className="mr-2 text-amber-200">Round {round} / {rounds}</b>}
            Part {step + 1} / {total}
          </span>
        )}
        {onRounds && (
          <label className="flex items-center gap-1.5 text-xs text-white/60">
            🔁 Repeat
            <select
              value={rounds}
              onChange={(e) => onRounds(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs font-bold text-white"
            >
              {[1, 3, 5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
        )}
        {!playing && (justFinished || times > 0) && (
          <button onClick={onAgain} className="ml-auto rounded-xl bg-emerald-500 px-4 py-1.5 text-sm font-black text-black hover:bg-emerald-400">
            🔁 {noun === "read" ? "Read" : "Practice"} again
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
