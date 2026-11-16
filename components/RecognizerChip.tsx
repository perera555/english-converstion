"use client";

import { useEffect, useState } from "react";
import { getEngine, setEngine, type Engine } from "@/lib/whisper";

/**
 * Small status line shown while the learner speaks: which recognizer is active,
 * whether words are coming through, and a one-tap switch.
 */
export default function RecognizerChip({ heard, listening }: { heard: string; listening: boolean }) {
  const [engine, setEngineState] = useState<Engine>("browser");
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEngineState(getEngine());
  }, [listening]);

  useEffect(() => {
    if (!listening) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWaited(false);
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, [listening]);

  const words = heard && !heard.startsWith("…");
  const status = !listening ? null : words ? "ok" : waited ? "warn" : "wait";

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold">
        {engine === "builtin" ? "🧠 Built-in recognizer" : "🌐 Browser recognizer"}
      </span>
      {status === "ok" && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">✓ Words coming through</span>}
      {status === "wait" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">⏳ Waiting for your voice…</span>}
      {status === "warn" && (
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-200">
          ⚠ No words yet{engine === "browser" ? ": try the built-in recognizer" : ""}
        </span>
      )}
      <button
        onClick={() => {
          const next: Engine = engine === "builtin" ? "browser" : "builtin";
          setEngine(next);
          setEngineState(next);
        }}
        className="rounded-full bg-white/5 px-2 py-0.5 font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10"
        title="Takes effect on your next try"
      >
        ⇄ Switch to {engine === "builtin" ? "browser" : "built-in"}
      </button>
    </div>
  );
}
