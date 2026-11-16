"use client";

import { useEffect, useState } from "react";

/*
 * Live mic level published by whichever recognizer is recording. The UI subscribes
 * instead of opening a second microphone stream, because some USB/Bluetooth headsets
 * give silence to BOTH streams when two recordings run at the same time.
 */
const subs = new Set<(l: number) => void>();
export function publishMicLevel(level: number) {
  subs.forEach((s) => s(level));
}

export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    subs.add(setLevel);
    return () => {
      subs.delete(setLevel);
      setLevel(0);
    };
  }, [active]);
  return level;
}

export function MicLevelBar({ level }: { level: number }) {
  return (
    <div className="mx-auto mt-2 flex w-48 items-center gap-2" title="Microphone level">
      <span className="text-sm">🎙️</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
      </div>
    </div>
  );
}
