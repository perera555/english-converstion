"use client";

import { scoreSpeech, tokenize } from "@/lib/score";
import { MicLevelBar, useMicLevel } from "@/lib/mic-level";
import RecognizerChip from "./RecognizerChip";

/**
 * Large karaoke display that stays on screen while audio plays.
 * Speaking: words light up one by one. Listening: words turn green as the learner says them.
 */
export default function KaraokeScreen({
  label,
  text,
  wordIndex,
  listening,
  heard,
  nextText,
}: {
  label: string;
  text: string;
  wordIndex: number;
  listening: boolean;
  heard: string;
  nextText?: string;
}) {
  const micLevel = useMicLevel(listening);
  const words = tokenize(text);
  const live = listening && heard ? scoreSpeech(text, heard).hits : null;

  return (
    <div className="sticky bottom-20 z-20 lg:bottom-4">
      <div className="animate-pop rounded-3xl border border-fuchsia-400/40 bg-[#0b0b18]/95 p-4 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-xl sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          {listening ? (
            <span className="flex items-center gap-2 text-emerald-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Your turn: read it aloud
            </span>
          ) : (
            <span className="text-fuchsia-300">🎤 {label}</span>
          )}
        </div>
        <p className="text-2xl font-black leading-snug sm:text-4xl">
          {words.map((w, k) => {
            let cls = "text-white/35";
            if (live) cls = live[k] ? "text-emerald-300" : "text-white/40";
            else if (listening) cls = "text-white/90";
            else if (k < wordIndex) cls = "text-white";
            else if (k === wordIndex) cls = "karaoke-word rounded-lg bg-gradient-to-r from-amber-300 to-pink-400 px-1.5 text-black";
            return (
              <span key={k} className={`transition-colors duration-150 ${cls}`}>
                {w}{" "}
              </span>
            );
          })}
        </p>
        {listening && heard && <p className="mt-2 text-sm italic text-white/55">“{heard}”</p>}
        {listening && <MicLevelBar level={micLevel} />}
        {listening && <RecognizerChip heard={heard} listening={listening} />}
        {nextText && !listening && <p className="mt-3 line-clamp-1 text-sm text-white/35">Next: {nextText}</p>}
      </div>
    </div>
  );
}
