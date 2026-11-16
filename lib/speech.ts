"use client";

import { useEffect, useState } from "react";
import { scoreSpeech, tokenize } from "./score";
import { pingActivity } from "./practice";
import { getEngine, isBuiltin, listenBuiltin, listenSelf, setEngine } from "./whisper";

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
let lastCancel = 0;

/** Stops all speech. Always use this instead of speechSynthesis.cancel(). */
export function stopSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  lastCancel = Date.now();
}

export function speak(
  text: string,
  opts: { voice?: SpeechSynthesisVoice; rate: number; pitch?: number; onWord: (i: number) => void },
): { done: Promise<void>; cancel: () => void } {
  const synth = window.speechSynthesis;
  const words = tokenize(text);
  const offsets = wordOffsets(text);

  let timer: ReturnType<typeof setTimeout> | undefined;
  pingActivity();
  const pinger = setInterval(pingActivity, 1000);
  let gotBoundary = false;
  let finished = false;
  let started = false;
  let current: SpeechSynthesisUtterance | null = null;
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
    clearTimeout(retry);
    if (current) alive.delete(current);
    opts.onWord(words.length);
    resolveFn();
  };

  const done = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });

  const make = (voice?: SpeechSynthesisVoice) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = "en-US";
    u.rate = opts.rate;
    u.pitch = opts.pitch ?? 1;
    u.onstart = () => {
      started = true;
      runFallback(0);
    };
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
    u.onend = () => u === current && finish();
    u.onerror = (e) => {
      // "interrupted"/"canceled" come from our own cancel; anything else: try the default voice once.
      if (u !== current) return;
      if (!started && voice && e.error !== "interrupted" && e.error !== "canceled") return say();
      finish();
    };
    alive.add(u);
    current = u;
    return u;
  };

  const say = (voice?: SpeechSynthesisVoice) => {
    if (finished) return;
    const u = make(voice);
    // Chrome/Edge pause bug: make sure the queue isn't stuck.
    synth.resume();
    synth.speak(u);
  };

  // If the chosen (often online) voice never starts, retry once with the browser's default voice.
  const retry = setTimeout(() => {
    if (!started && !finished && opts.voice) {
      stopSpeech();
      setTimeout(() => say(), 150);
    }
  }, 2500);

  // A watchdog in case the browser never fires "end".
  const watchdog = setTimeout(finish, 6500 + (text.length * 120) / opts.rate);
  done.then(() => clearTimeout(watchdog));

  // Speaking immediately after cancel() can silently drop the utterance, so wait a moment
  // when something is still queued. Otherwise speak right away (keeps the click's user gesture).
  if (synth.speaking || synth.pending) {
    stopSpeech();
    setTimeout(() => say(opts.voice), 150);
  } else if (Date.now() - lastCancel < 150) {
    setTimeout(() => say(opts.voice), 150 - (Date.now() - lastCancel));
  } else say(opts.voice);
  return {
    done,
    cancel: () => {
      stopSpeech();
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

/** A clear, actionable message for a speech-recognition error (or an empty result). */
export function micErrorMessage(error: string | undefined, transcript: string): string | null {
  if (error === "self") return null; // self-check: nothing to recognize
  if (error === "self-silent")
    return "🔇 Your recording was silent: the microphone isn't sending sound. Check the mic plug, mute switch and Windows Input volume, then open 🎧 Mic check.";
  if (error === "not-allowed" || error === "service-not-allowed")
    return "🚫 Microphone is blocked. Click the 🔒 / mic icon in the address bar, choose Allow, then try again.";
  if (error === "audio-capture") return "🎙️ No microphone found. Plug in your headset or earbuds, then open 🎧 Mic check at the top to test it.";
  if (error === "network")
    return "🌐 Slow or no connection to the online speech service, so the app switched to the 🧠 Built-in recognizer, which runs on your device and works offline. Press Say it again.";
  if (error === "language-not-supported") return "This browser can't recognize English speech. Please use Chrome, Edge or Safari.";
  if (error === "builtin-failed")
    return "⚙️ The built-in recognizer couldn't start. The first time, it needs internet to download (about 40 MB). Check your connection and try again.";
  if (error === "unsupported")
    return "This browser has no voice recognizer. Open 🎧 Mic check at the top and switch on the built-in recognizer.";
  if (!transcript)
    return isBuiltin(getEngine())
      ? "🤔 We didn't hear anything. Speak a bit louder and closer to the mic, right after pressing the button."
      : "🤔 We didn't hear anything. If your mic works but this keeps happening, open 🎧 Mic check at the top and switch on the built-in recognizer.";
  return null;
}

export function recognitionSupported() {
  return getEngine() !== "browser" || !!getRecognitionCtor();
}

export function listen(opts: {
  onInterim: (text: string) => void;
  timeoutMs: number;
  /** the sentence the learner should say; used to pick the best of several recognition guesses */
  target?: string;
}): { done: Promise<{ transcript: string; error?: string }>; cancel: () => void } {
  // Make sure no other mic recording (e.g. the Mic check meter) is running: some USB/Bluetooth
  // headsets give silence to every stream when two recordings run at once.
  window.dispatchEvent(new CustomEvent("release-mic"));
  // Self-check: record and play back, no recognition.
  if (getEngine() === "self") {
    pingActivity();
    const p = setInterval(pingActivity, 1000);
    const h = listenSelf({ timeoutMs: opts.timeoutMs });
    h.done.finally(() => clearInterval(p));
    return h;
  }
  // Built-in recognizer (Whisper in the browser) when the learner chose it in Mic check.
  if (isBuiltin(getEngine())) {
    pingActivity();
    const p = setInterval(pingActivity, 1000);
    const h = listenBuiltin({ onInterim: opts.onInterim, timeoutMs: opts.timeoutMs });
    h.done.finally(() => clearInterval(p));
    return h;
  }
  const Ctor = getRecognitionCtor();
  if (!Ctor) return { done: Promise.resolve({ transcript: "", error: "unsupported" }), cancel: () => {} };
  const rec = new Ctor();
  const android = /android/i.test(navigator.userAgent);
  rec.lang = "en-US";
  rec.interimResults = true;
  // Continuous mode tolerates short pauses; Android duplicates words in that mode, so keep it off there.
  rec.continuous = !android;
  rec.maxAlternatives = 3;
  let silence: ReturnType<typeof setTimeout> | undefined;

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
    clearTimeout(silence);
    clearInterval(pinger);
    resolveFn({ transcript, error });
  };

  const done = new Promise<{ transcript: string; error?: string }>((resolve) => {
    resolveFn = resolve;
  });

  rec.onresult = (e) => {
    let text = "";
    let allFinal = true;
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      allFinal &&= r.isFinal;
      // Pick the guess that best matches the target sentence (helps with accents and twisters).
      let best = r[0].transcript;
      if (opts.target && r.length > 1) {
        let bestScore = -1;
        for (let a = 0; a < r.length; a++) {
          const s = scoreSpeech(opts.target, r[a].transcript).score;
          if (s > bestScore) {
            bestScore = s;
            best = r[a].transcript;
          }
        }
      }
      text += " " + best;
    }
    transcript = text.replace(/\s+/g, " ").trim();
    opts.onInterim(transcript);
    // In continuous mode, stop once the learner has been quiet for a moment after speaking.
    clearTimeout(silence);
    if (rec.continuous && transcript) {
      silence = setTimeout(() => {
        try {
          rec.stop();
        } catch {}
      }, allFinal ? 1200 : 2200);
    }
  };
  rec.onerror = (e) => {
    error = e.error;
    // Slow / no connection to the online service: use the on-device recognizer from now on.
    if (e.error === "network") setEngine("builtin");
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
