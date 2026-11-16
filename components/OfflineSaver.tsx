"use client";

import { useState } from "react";
import { LEVELS } from "@/lib/levels";
import { getEngine, isBuiltin, loadWhisper, setEngine } from "@/lib/whisper";

const CONV_PER_LEVEL = 250;
const ESSAYS_PER_LEVEL = 200;
const EXAM_ESSAYS = 160;

const range = (from: number, count: number, prefix: string) => Array.from({ length: count }, (_, i) => `${prefix}${from + i}`);

/** Downloads chosen lessons + the on-device voice recognizer for offline practice. */
export default function OfflineSaver() {
  const [level, setLevel] = useState(0);
  const [conv, setConv] = useState(true);
  const [essays, setEssays] = useState(false);
  const [exams, setExams] = useState(false);
  const [status, setStatus] = useState("");
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!("serviceWorker" in navigator)) {
      setStatus("This browser can't save pages for offline use. Try Chrome or Edge.");
      return;
    }
    setBusy(true);
    setPct(0);
    const urls = ["/", "/conversations", "/essays", "/twisters", "/exams"];
    if (conv) urls.push(...range(level * CONV_PER_LEVEL + 1, CONV_PER_LEVEL, "/c/"));
    if (essays) urls.push(...range(level * ESSAYS_PER_LEVEL + 1, ESSAYS_PER_LEVEL, "/essays/"));
    if (exams) urls.push(...range(1, EXAM_ESSAYS, "/exams/"));

    // 1) Voice recognizer (runs on this device, so voice checking works offline).
    let engine = getEngine();
    if (!isBuiltin(engine)) {
      engine = "builtin";
      setEngine(engine);
    }
    setStatus("Downloading the voice recognizer…");
    try {
      await loadWhisper((p) => setPct(Math.round(p * 0.3)), engine);
    } catch {
      setStatus("Couldn't download the voice recognizer. Check your internet and try again.");
      setBusy(false);
      return;
    }

    // 2) Lessons, through the service worker.
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active;
    if (!sw) {
      setStatus("Offline support is still starting. Reload the page and try again.");
      setBusy(false);
      return;
    }
    await new Promise<void>((resolve) => {
      const ch = new MessageChannel();
      ch.port1.onmessage = (e) => {
        const d = e.data as { phase: string; done?: number; total?: number; failed?: number };
        if (d.phase === "pages") {
          setStatus(`Saving lessons… ${d.done} / ${d.total}`);
          setPct(30 + Math.round(((d.done ?? 0) / (d.total ?? 1)) * 60));
        } else if (d.phase === "files") {
          setStatus(`Saving app files… ${d.done} / ${d.total}`);
          setPct(90 + Math.round(((d.done ?? 0) / Math.max(1, d.total ?? 1)) * 10));
        } else if (d.phase === "finished") {
          setPct(100);
          setStatus(
            d.failed
              ? `✅ Saved, but ${d.failed} page(s) failed. Press the button again to retry them.`
              : "✅ Ready for offline practice! Lessons, twisters and the voice recognizer are saved on this device.",
          );
          resolve();
        }
      };
      sw.postMessage({ type: "precache", urls }, [ch.port2]);
    });
    setBusy(false);
  };

  const count = 5 + (conv ? CONV_PER_LEVEL : 0) + (essays ? ESSAYS_PER_LEVEL : 0) + (exams ? EXAM_ESSAYS : 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-white/[0.03] to-emerald-500/10 p-5">
      <div className="text-xs uppercase tracking-widest text-sky-200">No internet? No problem</div>
      <div className="mt-1 text-2xl font-black">📥 Offline practice</div>
      <p className="mt-1 text-sm text-white/60">
        Save lessons and the voice recognizer on this device. Then practice anywhere: listening, karaoke and voice checking all work offline
        (only YouTube videos need internet).
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
          {LEVELS.map((l, i) => (
            <option key={l.id} value={i}>
              {l.label} level
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={conv} onChange={(e) => setConv(e.target.checked)} className="accent-sky-400" /> 250 conversations
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={essays} onChange={(e) => setEssays(e.target.checked)} className="accent-sky-400" /> 200 essays
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={exams} onChange={(e) => setExams(e.target.checked)} className="accent-sky-400" /> IELTS/PTE
        </label>
      </div>
      <p className="mt-2 text-xs text-white/45">Twisters (all 1,000) are always included.</p>
      <button onClick={save} disabled={busy} className="btn-3d mt-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 font-black disabled:opacity-60">
        {busy ? "Saving…" : `📥 Save ${count} pages for offline`}
      </button>
      {(busy || status) && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-white/70">{status}</p>
        </div>
      )}
    </div>
  );
}
