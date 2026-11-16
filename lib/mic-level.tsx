"use client";

import { useEffect, useState } from "react";

/**
 * Live microphone level (0–1) while `active` is true. Used as a visual check that the mic
 * is picking up sound. Skipped on Android, where a second mic stream can block speech recognition.
 */
export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || /android|iphone|ipad|ipod/i.test(navigator.userAgent) || !navigator.mediaDevices) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let stopped = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        ctx = new AudioContext();
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
          setLevel(Math.min(1, peak / 50));
          raf = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => {});
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
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
