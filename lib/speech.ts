"use client";

import { useEffect, useState } from "react";
import { tokenize } from "./score";
import { pingActivity } from "./practice";

/* ---------------------------------------------------------------- voices */

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
      // Prefer the higher quality "natural/online" voices first.
      all.sort((a, b) => score(b) - score(a));
      setVoices(all);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (n.includes("natural") || n.includes("neural")) s += 4;
  if (n.includes("google")) s += 3;
  if (n.includes("samantha") || n.includes("daniel") || n.includes("karen")) s += 2;
  if (v.lang === "en-US" || v.lang === "en-GB") s += 1;
  return s;
}

export function pickDefaultPair(voices: SpeechSynthesisVoice[]): [string, string] {
  if (!voices.length) return ["", ""];
  const a = voices[0];
  const b =
    voices.find((v) => v.name !== a.name && v.lang !== a.lang) ??
    voices.find((v) => v.name !== a.name) ??
    a;
  return [a.name, b.name];
}

/* ---------------------------------------------------------------- speak */

/** Character offset where each word of `text` begins. */
export function wordOffsets(text: string) {
  const offsets: number[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) offsets.push(m.index);
  return offsets;
}

// Chrome garbage-collects utterances that aren't referenced, which drops "end" events.
const alive = new Set<SpeechSynthesisUtterance>();

export function speak(
  text: string,
  opts: { voice?: SpeechSynthesisVoice; rate: number; pitch?: number; onWord: (i: number) => void },
): { done: Promise<void>; cancel: () => void } {
  const synth = window.speechSynthesis;
  const words = tokenize(text);
  const offsets = wordOffsets(text);
  const u = new SpeechSynthesisUtterance(text);
  if (opts.voice) {
    u.voice = opts.voice;
    u.lang = opts.voice.lang;
  } else u.lang = "en-US";
  u.rate = opts.rate;
  u.pitch = opts.pitch ?? 1;
  alive.add(u);

  let timer: ReturnType<typeof setTimeout> | undefined;
  pingActivity();
  const pinger = setInterval(pingActivity, 1000);
  let gotBoundary = false;
  let finished = false;
  let resolveFn: () => void = () => {};

  // Fallback karaoke timing for voices that never fire boundary events.
  const runFallback = (i: number) => {
    if (gotBoundary || finished || i >= words.length) return;
    opts.onWord(i);
    const ms = (words[i].replace(/[^\w]/g, "").length * 62 + 150) / opts.rate;
    timer = setTimeout(() => runFallback(i + 1), ms);
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clearInterval(pinger);
    alive.delete(u);
    opts.onWord(words.length);
    resolveFn();
  };

  const done = new Promise<void>((resolve) => {
    resolveFn = resolve;
    u.onstart = () => runFallback(0);
    u.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      if (!gotBoundary) {
        gotBoundary = true;
        clearTimeout(timer);
      }
      let idx = 0;
      for (let k = 0; k < offsets.length; k++) if (offsets[k] <= e.charIndex) idx = k;
      opts.onWord(idx);
    };
    u.onend = finish;
    u.onerror = finish;
  });

  // A watchdog in case the browser never fires "end".
  const watchdog = setTimeout(finish, 4000 + (text.length * 120) / opts.rate);
  done.then(() => clearTimeout(watchdog));

  synth.speak(u);
  return {
    done,
    cancel: () => {
      synth.cancel();
      finish();
    },
  };
}

/* ---------------------------------------------------------------- listen */

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
  stop: () => void;
}

function getRecognitionCtor(): (new () => RecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => RecognitionLike) | undefined;
}

export function recognitionSupported() {
  return !!getRecognitionCtor();
}

export function listen(opts: {
  onInterim: (text: string) => void;
  timeoutMs: number;
}): { done: Promise<{ transcript: string; error?: string }>; cancel: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return { done: Promise.resolve({ transcript: "", error: "unsupported" }), cancel: () => {} };
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let transcript = "";
  pingActivity();
  const pinger = setInterval(pingActivity, 1000);
  let error: string | undefined;
  let resolveFn: (v: { transcript: string; error?: string }) => void = () => {};
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    clearInterval(pinger);
    resolveFn({ transcript, error });
  };

  const done = new Promise<{ transcript: string; error?: string }>((resolve) => {
    resolveFn = resolve;
  });

  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    transcript = text.trim();
    opts.onInterim(transcript);
  };
  rec.onerror = (e) => {
    error = e.error;
  };
  rec.onend = settle;

  const timer = setTimeout(() => {
    try {
      rec.stop();
    } catch {}
    setTimeout(settle, 800);
  }, opts.timeoutMs);

  try {
    rec.start();
  } catch {
    error = "start-failed";
    settle();
  }

  return {
    done,
    cancel: () => {
      try {
        rec.abort();
      } catch {}
      settle();
    },
  };
}
