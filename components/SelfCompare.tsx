"use client";

import { useEffect, useState } from "react";

/**
 * Self-check comparison for one recording: waveform (shows at a glance whether the mic captured
 * sound), your length vs. the natural length, and "computer first, then me" playback.
 */
export default function SelfCompare({
  url,
  text,
  playCorrect,
}: {
  url: string;
  text: string;
  /** speaks the correct sentence; resolves when finished */
  playCorrect: () => Promise<void>;
}) {
  const [bars, setBars] = useState<number[] | null>(null);
  const [mine, setMine] = useState(0);
  const [busy, setBusy] = useState(false);

  // Natural length at the app voice's pace.
  const natural = text.split(/\s+/).reduce((ms, w) => ms + (w.replace(/[^\w]/g, "").length * 62 + 170) / 0.95, 0) / 1000;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        const ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf);
        ctx.close().catch(() => {});
        const data = audio.getChannelData(0);
        const n = 48;
        const size = Math.floor(data.length / n) || 1;
        const out: number[] = [];
        for (let i = 0; i < n; i++) {
          let p = 0;
          for (let j = i * size; j < (i + 1) * size && j < data.length; j++) p = Math.max(p, Math.abs(data[j]));
          out.push(p);
        }
        // Trim silence at the edges for the speaking time.
        const loud = out.map((v) => v > 0.04);
        const first = loud.indexOf(true);
        const last = loud.lastIndexOf(true);
        if (!cancelled) {
          setBars(out);
          setMine(first < 0 ? 0 : ((last - first + 1) / n) * audio.duration);
        }
      } catch {
        if (!cancelled) setBars([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const max = bars && bars.length ? Math.max(...bars, 0.01) : 1;
  const silent = bars !== null && bars.length > 0 && max < 0.03;
  const diff = natural ? mine / natural : 0;
  const speedNote = !mine ? "" : diff < 0.75 ? "a bit fast" : diff > 1.5 ? "a bit slow: try faster" : "good speed ✓";

  const compare = async () => {
    setBusy(true);
    await playCorrect();
    await new Promise<void>((r) => {
      const a = new Audio(url);
      a.onended = () => r();
      a.onerror = () => r();
      a.play().catch(() => r());
    });
    setBusy(false);
  };

  return (
    <div className="mt-3">
      <div className="mx-auto flex h-14 max-w-md items-center gap-[2px] rounded-xl bg-black/30 px-2" title="Your recording">
        {bars === null ? (
          <span className="w-full text-center text-xs text-white/40">Analyzing your recording…</span>
        ) : (
          bars.map((v, i) => (
            <span key={i} className={`flex-1 rounded-full ${silent ? "bg-rose-400/60" : "bg-gradient-to-t from-emerald-400 to-cyan-300"}`} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
          ))
        )}
      </div>
      {silent ? (
        <p className="mt-2 text-xs font-bold text-rose-300">
          🔇 Your recording is silent. The microphone isn&apos;t sending sound (check the mic plug, mute switch and Windows input volume).
        </p>
      ) : (
        mine > 0 && (
          <p className="mt-2 text-xs text-white/70">
            ⏱ You: <b>{mine.toFixed(1)} s</b> · Natural: <b>{natural.toFixed(1)} s</b> · {speedNote}
          </p>
        )
      )}
      <button onClick={compare} disabled={busy} className="mt-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold disabled:opacity-60">
        {busy ? "▶ Playing…" : "▶▶ Compare: computer, then me"}
      </button>
    </div>
  );
}
