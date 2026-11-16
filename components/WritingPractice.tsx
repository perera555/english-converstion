"use client";

import { useEffect, useRef, useState } from "react";
import { pingActivity } from "@/lib/practice";

/** Timed exam writing box with live word count and a saved draft. */
export default function WritingPractice({ id, minutes, min, max, question }: { id: number; minutes: number; min: number; max: number; question: string }) {
  const key = `ec-draft-${id}`;
  const [text, setText] = useState("");
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(localStorage.getItem(key) || "");
    } catch {}
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, text);
    } catch {}
  }, [key, text]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      pingActivity();
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ok = words >= min && words <= max;
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-black">✍️ Write your own answer</h2>
        <span className={`rounded-xl px-3 py-1.5 font-mono text-lg font-black ${left < 300 ? "bg-rose-500/20 text-rose-200" : "bg-white/10"}`}>⏱ {mm}</span>
        <button onClick={() => setRunning((r) => !r)} className="btn-3d rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold">
          {running ? "⏸ Pause" : left === minutes * 60 ? "▶ Start exam timer" : "▶ Resume"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setLeft(minutes * 60);
          }}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold"
        >
          ↺
        </button>
      </div>
      <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-white/75">{question}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          pingActivity();
          if (!running && left > 0) setRunning(true);
        }}
        placeholder="Start typing your essay here. The timer starts automatically."
        className="mt-3 h-72 w-full resize-y rounded-2xl border border-white/10 bg-black/40 p-4 leading-relaxed outline-none focus:border-fuchsia-400/60"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className={`rounded-full px-3 py-1 font-bold ${ok ? "bg-emerald-400 text-black" : words > max ? "bg-rose-500" : "bg-white/10"}`}>
          {words} words
        </span>
        <span className="text-white/50">
          Target: {min}
          {max < 400 ? `–${max}` : "+"} words · your draft saves automatically on this device
        </span>
        {left === 0 && <span className="font-bold text-rose-300">⏰ Time is up! Compare with the model answer above.</span>}
      </div>
    </section>
  );
}
