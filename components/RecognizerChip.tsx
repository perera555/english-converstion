"use client";

import { useEffect, useState } from "react";
import { ENGINES, getEngine, setEngine, type Engine } from "@/lib/whisper";

/**
 * Status line shown where the learner speaks: active recognizer (switchable between all
 * three), and whether words are coming through.
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
      <label className="flex items-center gap-1 rounded-full bg-white/10 py-0.5 pl-2 pr-1 font-semibold">
        Recognizer:
        <select
          value={engine}
          disabled={listening}
          onChange={(e) => {
            const next = e.target.value as Engine;
            setEngine(next);
            setEngineState(next);
          }}
          className="rounded-full bg-black/40 px-1.5 py-0.5 text-[11px] font-bold text-white"
          title="Takes effect on your next try"
        >
          {ENGINES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label} ({x.note})
            </option>
          ))}
        </select>
      </label>
      {status === "ok" && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">✓ Words coming through</span>}
      {status === "wait" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">⏳ Waiting for your voice…</span>}
      {status === "warn" && (
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-200">
          ⚠ No words yet{engine === "browser" ? ": try a built-in recognizer" : ""}
        </span>
      )}
    </div>
  );
}
