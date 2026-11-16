"use client";

/**
 * Built-in voice recognizer: Whisper (tiny, English) running inside the browser with transformers.js.
 * It records with getUserMedia, the same path the mic test uses, so it works with USB / Bluetooth
 * headsets that the browser's own speech recognizer sometimes can't hear. The model (~40 MB)
 * downloads once and is cached by the browser.
 */

import { publishMicLevel } from "./mic-level";

const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1/dist/transformers.min.js";
const MODEL = "Xenova/whisper-tiny.en";
const ENGINE_KEY = "ec-recognizer";
const DEVICE_KEY = "ec-mic-device";

export type Engine = "browser" | "builtin";

export function getEngine(): Engine {
  try {
    return localStorage.getItem(ENGINE_KEY) === "builtin" ? "builtin" : "browser";
  } catch {
    return "browser";
  }
}
export function setEngine(e: Engine) {
  try {
    localStorage.setItem(ENGINE_KEY, e);
  } catch {}
}
export function getMicDevice(): string {
  try {
    return localStorage.getItem(DEVICE_KEY) || "default";
  } catch {
    return "default";
  }
}
export function setMicDevice(id: string) {
  try {
    localStorage.setItem(DEVICE_KEY, id);
  } catch {}
}

type Transcriber = (audio: Float32Array) => Promise<{ text: string } | { text: string }[]>;
let loading: Promise<Transcriber> | null = null;

/** Loads the model once. `onProgress` receives 0–100 while downloading. */
export function loadWhisper(onProgress?: (pct: number) => void): Promise<Transcriber> {
  if (loading) return loading;
  loading = (async () => {
    // Imported at runtime from the CDN so it never enters the app bundle.
    const importer = new Function("u", "return import(u)") as (u: string) => Promise<Record<string, unknown>>;
    const tf = (await importer(LIB)) as {
      pipeline: (task: string, model: string, opts: Record<string, unknown>) => Promise<Transcriber>;
    };
    const files: Record<string, { loaded: number; total: number }> = {};
    const progress_callback = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (p.status === "progress" && p.file) {
        files[p.file] = { loaded: p.loaded ?? 0, total: p.total ?? 1 };
        const all = Object.values(files);
        const pct = (all.reduce((a, f) => a + f.loaded, 0) / Math.max(1, all.reduce((a, f) => a + f.total, 0))) * 100;
        onProgress?.(Math.round(pct));
      }
    };
    const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;
    try {
      return await tf.pipeline("automatic-speech-recognition", MODEL, { device: webgpu ? "webgpu" : "wasm", progress_callback });
    } catch {
      return await tf.pipeline("automatic-speech-recognition", MODEL, { device: "wasm", progress_callback });
    }
  })();
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

/** Linear resampling of mono PCM to 16 kHz for Whisper. */
function resampleTo16k(input: Float32Array, rate: number): Float32Array {
  if (rate === 16000) return input;
  const ratio = rate / 16000;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const i1 = Math.min(input.length - 1, i0 + 1);
    out[i] = input[i0] + (input[i1] - input[i0]) * (x - i0);
  }
  return out;
}

/** Boosts quiet recordings so the model hears them clearly. */
function normalize(pcm: Float32Array) {
  let max = 0;
  for (let i = 0; i < pcm.length; i++) max = Math.max(max, Math.abs(pcm[i]));
  if (max > 0 && max < 0.5) {
    const g = Math.min(20, 0.9 / max);
    for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
  }
  return pcm;
}

const cleanText = (raw: string) => raw.replace(/\[[^\]]*\]|\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

/**
 * Records raw audio until the learner stops talking (or `timeoutMs`), showing live partial
 * results about every 1.5 s, then returns the final transcript.
 * Same result shape as the browser recognizer in speech.ts.
 */
export function listenBuiltin(opts: {
  onInterim: (text: string) => void;
  timeoutMs: number;
  onLevel?: (level: number) => void;
}): { done: Promise<{ transcript: string; error?: string }>; cancel: () => void } {
  let cancelled = false;
  let stopNow: () => void = () => {};
  const done = (async () => {
    let stream: MediaStream;
    const dev = getMicDevice();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: dev === "default" ? true : { deviceId: { ideal: dev } } });
    } catch (e) {
      return { transcript: "", error: (e as Error).name === "NotAllowedError" ? "not-allowed" : "audio-capture" };
    }
    const modelP = loadWhisper(); // loads in parallel with recording (instant after the first time)
    const ctx = new AudioContext();
    await ctx.resume().catch(() => {});
    const source = ctx.createMediaStreamSource(stream);
    // Raw sample capture (no compression/decoding step, which some headsets broke).
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const parts: Float32Array[] = [];
    let spoke = false;
    let lastLoud = Date.now();
    proc.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0);
      parts.push(new Float32Array(ch));
      let p = 0;
      for (let i = 0; i < ch.length; i += 4) p = Math.max(p, Math.abs(ch[i]));
      const level = Math.min(1, p * 2.5);
      opts.onLevel?.(level);
      publishMicLevel(level);
      if (level > 0.06) {
        spoke = true;
        lastLoud = Date.now();
      }
    };
    source.connect(proc);
    // ScriptProcessor only runs when connected to the output; a muted gain keeps it silent.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    proc.connect(mute).connect(ctx.destination);

    const snapshot = () => {
      const len = parts.reduce((a, b) => a + b.length, 0);
      const all = new Float32Array(len);
      let o = 0;
      for (const p of parts) {
        all.set(p, o);
        o += p.length;
      }
      return normalize(resampleTo16k(all, ctx.sampleRate));
    };

    // Live partial results so words can turn green while the learner is still talking.
    let busy = false;
    const live = setInterval(async () => {
      if (busy || !spoke || cancelled) return;
      busy = true;
      try {
        const run = await modelP;
        const out = await run(snapshot());
        const t = cleanText((Array.isArray(out) ? out[0]?.text : out.text) ?? "");
        if (t && !cancelled) opts.onInterim(t);
      } catch {}
      busy = false;
    }, 1500);

    const started = Date.now();
    await new Promise<void>((resolve) => {
      stopNow = resolve;
      const t = setInterval(() => {
        const now = Date.now();
        if (cancelled || (spoke && now - lastLoud > 1400) || now - started > opts.timeoutMs) {
          clearInterval(t);
          resolve();
        }
      }, 100);
    });
    clearInterval(live);
    proc.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    publishMicLevel(0);
    const pcm = snapshot();
    ctx.close().catch(() => {});
    if (cancelled) return { transcript: "", error: "aborted" };

    opts.onInterim("… recognizing …");
    try {
      const run = await modelP;
      const out = await run(pcm);
      const text = cleanText((Array.isArray(out) ? out[0]?.text : out.text) ?? "");
      opts.onInterim(text);
      return text ? { transcript: text } : { transcript: "", error: spoke ? undefined : "no-speech" };
    } catch {
      return { transcript: "", error: "builtin-failed" };
    }
  })();
  return {
    done,
    cancel: () => {
      cancelled = true;
      stopNow();
    },
  };
}
