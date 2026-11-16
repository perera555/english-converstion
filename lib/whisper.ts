"use client";

/**
 * Built-in voice recognizer: Whisper (tiny, English) running inside the browser with transformers.js.
 * It records with getUserMedia, the same path the mic test uses, so it works with USB / Bluetooth
 * headsets that the browser's own speech recognizer sometimes can't hear. The model (~40 MB)
 * downloads once and is cached by the browser.
 */

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

/** Converts recorded audio into 16 kHz mono samples for Whisper. */
async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf);
  ctx.close().catch(() => {});
  const length = Math.ceil(decoded.duration * 16000);
  const off = new OfflineAudioContext(1, Math.max(1, length), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return out.getChannelData(0);
}

/**
 * Records until the learner stops talking (or `timeoutMs`), then transcribes.
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
    const model = loadWhisper(); // start loading in parallel with recording
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.start();

    let spoke = false;
    let lastLoud = Date.now();
    const started = Date.now();
    await new Promise<void>((resolve) => {
      stopNow = resolve;
      const tick = () => {
        if (cancelled) return resolve();
        an.getByteTimeDomainData(data);
        let p = 0;
        for (const v of data) p = Math.max(p, Math.abs(v - 128));
        const level = Math.min(1, p / 50);
        opts.onLevel?.(level);
        if (level > 0.12) {
          spoke = true;
          lastLoud = Date.now();
        }
        const now = Date.now();
        if ((spoke && now - lastLoud > 1300) || now - started > opts.timeoutMs) return resolve();
        requestAnimationFrame(tick);
      };
      tick();
    });
    rec.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
    if (cancelled) return { transcript: "", error: "aborted" };
    if (!spoke) return { transcript: "", error: "no-speech" };

    opts.onInterim("… recognizing …");
    try {
      const pcm = await toPcm16k(new Blob(chunks, { type: rec.mimeType }));
      const run = await model;
      const out = await run(pcm);
      const text = (Array.isArray(out) ? out[0]?.text : out.text)?.trim() ?? "";
      opts.onInterim(text);
      return { transcript: text.replace(/^\[.*\]$/, "") };
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
