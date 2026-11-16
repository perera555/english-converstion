"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Chapter, Twister } from "@/lib/twisters";
import { LEVELS, levelMeta } from "@/lib/levels";
import { listen, micErrorMessage, recognitionSupported, speak, stopSpeech, useVoices } from "@/lib/speech";
import { scoreSpeech, tokenize } from "@/lib/score";
import { MicLevelBar, useMicLevel } from "@/lib/mic-level";
import { requestVoiceCheck } from "@/lib/voice-check";
import RecognizerChip from "./RecognizerChip";
import DeviceBar from "./DeviceBar";
import { getEngine, getMicDevice } from "@/lib/whisper";

/* ------------------------------------------------------------ progress store */

const KEY = "ec-twisters-v1";
interface TP {
  passed: number[];
  best: Record<string, number>;
  tries: Record<string, number>;
}
const EMPTY: TP = { passed: [], best: {}, tries: {} };
let cache: TP | null = null;
const subs = new Set<() => void>();
const read = (): TP => {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = EMPTY;
  }
  return cache!;
};
const write = (p: TP) => {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
  subs.forEach((s) => s());
};
const subscribe = (s: () => void) => {
  subs.add(s);
  return () => subs.delete(s);
};

function stars(score: number, threshold: number) {
  if (score < threshold) return 0;
  if (score >= 100) return 3;
  return score >= threshold + (100 - threshold) / 2 ? 2 : 1;
}

/* ------------------------------------------------------------ component */

export default function TwisterGame({ chapters, twisters }: { chapters: Chapter[]; twisters: Twister[] }) {
  const prog = useSyncExternalStore(subscribe, read, () => EMPTY);
  const passed = useMemo(() => new Set(prog.passed), [prog.passed]);
  const unlocked = useCallback((id: number) => id === 1 || passed.has(id - 1) || passed.has(id), [passed]);
  const frontier = useMemo(() => twisters.find((t) => !passed.has(t.id) && unlocked(t.id))?.id ?? twisters.length, [twisters, passed, unlocked]);

  const [chapterN, setChapterN] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const chapter = chapters.find((c) => c.n === (chapterN ?? twisters[frontier - 1].chapter))!;
  const tw = twisters[(activeId ?? (twisters[frontier - 1].chapter === chapter.n ? frontier : chapter.first)) - 1];
  const lm = levelMeta(chapter.level);

  const voices = useVoices();
  const [voice, setVoice] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (voices.length && !voice) setVoice(voices[0].name);
  }, [voices, voice]);

  const [phase, setPhase] = useState<"idle" | "speaking" | "listening" | "recording" | "review" | "pass" | "fail">("idle");
  const [selfMode, setSelfModeState] = useState(false);
  const [selfUrl, setSelfUrl] = useState("");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelfModeState(localStorage.getItem("ec-selfcheck") === "1");
    } catch {}
  }, []);
  const setSelfMode = (on: boolean) => {
    setSelfModeState(on);
    try {
      localStorage.setItem("ec-selfcheck", on ? "1" : "0");
    } catch {}
  };
  const [word, setWord] = useState(-1);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<{ score: number; hits: boolean[] } | null>(null);
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState<"" | "pass" | "chapter" | "level">("");
  const [drill, setDrill] = useState(1); // say each twister this many times
  const [reps, setReps] = useState(0); // passes of the current twister in this session
  const cancelRef = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    cancelRef.current?.();
    stopSpeech();
    setPhase("idle");
    setWord(-1);
    setHeard("");
    setResult(null);
    setCelebrate("");
  }, []);
  useEffect(() => reset, [reset]);

  const micLevel = useMicLevel(phase === "listening");
  const [diag, setDiag] = useState("");
  const peakRef = useRef(0);
  peakRef.current = Math.max(peakRef.current, micLevel);
  const words = tokenize(tw.text);
  const liveHits = phase === "listening" && heard ? scoreSpeech(tw.text, heard, { fuzzy: "names" }).hits : null;

  const hear = async (rate: number) => {
    reset();
    setPhase("speaking");
    const h = speak(tw.text, { voice: voices.find((v) => v.name === voice), rate, onWord: setWord });
    cancelRef.current = h.cancel;
    await h.done;
    setWord(-1);
    setPhase("idle");
  };

  const tryIt = async () => {
    reset();
    if (!recognitionSupported()) {
      setNotice("Voice checking needs Chrome, Edge, Safari (iPhone/Mac) or Samsung Internet. Please open the app in one of these browsers.");
      return;
    }
    setNotice("");
    if (!(await requestVoiceCheck())) return;
    setPhase("listening");
    setDiag("");
    peakRef.current = 0;
    const l = listen({ onInterim: setHeard, timeoutMs: 7000 + words.length * 800, target: tw.text });
    cancelRef.current = l.cancel;
    const r = await l.done;
    if (r.error === "aborted") return; // stopped by the learner
    const engine = getEngine();
    setDiag(
      `Recognizer: ${engine === "builtin" ? "built-in" : "browser"} · mic loudness: ${
        engine === "builtin" ? Math.round(peakRef.current * 100) + "%" : "n/a"
      } · result: ${r.transcript ? `"${r.transcript}"` : "no words"}${r.error ? ` · code: ${r.error}` : ""}`,
    );
    const problem = micErrorMessage(r.error, r.transcript);
    if (problem) {
      // Nothing usable was heard: explain why, and don't count it as a failed attempt.
      setPhase("idle");
      setNotice(problem);
      return;
    }
    const sc = scoreSpeech(tw.text, r.transcript, { fuzzy: "names" });
    setResult(sc);
    setHeard(r.transcript);
    applyScore(sc.score);
  };

  // Records progress for one attempt (voice-checked or self-checked).
  const applyScore = (score: number) => {
    const sc = { score };
    const p = read();
    const tries = { ...p.tries, [tw.id]: (p.tries[tw.id] ?? 0) + 1 };
    const best = { ...p.best, [tw.id]: Math.max(p.best[tw.id] ?? 0, sc.score) };
    if (sc.score >= chapter.threshold) {
      const already = p.passed.includes(tw.id);
      write({ passed: already ? p.passed : [...p.passed, tw.id], best, tries });
      setReps((r) => r + 1);
      setPhase("pass");
      const next = twisters[tw.id];
      setCelebrate(tw.boss ? (next && levelMeta(chapters[next.chapter - 1].level).id !== chapter.level ? "level" : "chapter") : "pass");
    } else {
      write({ ...p, best, tries });
      setPhase("fail");
    }
  };

  /* ---- Self-check mode: record, compare with the correct voice, then rate yourself ---- */
  const recordSelf = async () => {
    reset();
    setNotice("");
    let s: MediaStream;
    try {
      const dev = getMicDevice();
      s = await navigator.mediaDevices.getUserMedia({ audio: dev === "default" ? true : { deviceId: { ideal: dev } } });
    } catch {
      setNotice("🚫 Couldn't use the microphone. Allow mic access in the address bar, then try again.");
      return;
    }
    const rec = new MediaRecorder(s);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      s.getTracks().forEach((t) => t.stop());
      if (selfUrl) URL.revokeObjectURL(selfUrl);
      const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
      setSelfUrl(url);
      setPhase("review");
      new Audio(url).play().catch(() => {});
    };
    setPhase("recording");
    rec.start();
    const timer = setTimeout(() => rec.state === "recording" && rec.stop(), 3000 + words.length * 600);
    cancelRef.current = () => {
      clearTimeout(timer);
      if (rec.state === "recording") rec.stop();
    };
  };

  const goNext = () => {
    const next = twisters[tw.id];
    reset();
    setReps(0);
    if (!next) return;
    setChapterN(next.chapter);
    setActiveId(next.id);
  };

  const levelDone = (lvl: string) => {
    const ids = twisters.filter((t) => chapters[t.chapter - 1].level === lvl);
    return ids.filter((t) => passed.has(t.id)).length;
  };

  return (
    <div className="space-y-8">
      {/* levels */}
      <div className="grid gap-3 sm:grid-cols-5">
        {LEVELS.map((l) => {
          const firstChapter = chapters.find((c) => c.level === l.id)!;
          const open = unlocked(firstChapter.first);
          const done = levelDone(l.id);
          return (
            <button
              key={l.id}
              disabled={!open}
              onClick={() => {
                reset();
                setChapterN(firstChapter.n);
                setActiveId(null);
              }}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                chapter.level === l.id ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[0.03]"
              } ${open ? "hover:bg-white/10" : "cursor-not-allowed opacity-45"}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.gradient}`} />
              <div className="flex items-center justify-between text-xs">
                <span className={l.text}>{l.cefr}</span>
                <span>{open ? "🔓" : "🔒"}</span>
              </div>
              <div className="mt-1 font-black">{l.label}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full bg-gradient-to-r ${l.gradient}`} style={{ width: `${(done / 200) * 100}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-white/50">{done}/200 · pass ≥{firstChapter.threshold}%</div>
            </button>
          );
        })}
      </div>

      {/* chapters of this level */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {chapters
          .filter((c) => c.level === chapter.level)
          .map((c) => {
            const open = unlocked(c.first);
            const done = twisters.filter((t) => t.chapter === c.n && passed.has(t.id)).length;
            return (
              <button
                key={c.n}
                disabled={!open}
                data-tilt={open ? "10" : undefined}
                onClick={() => {
                  reset();
                  setChapterN(c.n);
                  setActiveId(null);
                }}
                className={`relative rounded-3xl border p-4 text-left shadow-xl shadow-black/30 ${
                  c.n === chapter.n ? "border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/25 to-violet-600/20" : "border-white/10 bg-white/[0.04]"
                } ${open ? "" : "cursor-not-allowed opacity-40"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{open ? c.icon : "🔒"}</span>
                  <span className="text-xs font-mono text-white/40">Ch. {c.n}</span>
                </div>
                <div className="mt-2 font-black">{c.title}</div>
                <div className="text-xs text-white/55">Sound: {c.sound}</div>
                <div className="mt-2 text-xs font-semibold">{done === c.count ? "✅ Complete" : `${done}/${c.count} passed`}</div>
              </button>
            );
          })}
      </div>

      {/* challenge */}
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1033] via-[#120d24] to-[#0b1a2a] p-6 shadow-2xl sm:p-10">
          <div className="stage-floor absolute -inset-x-1/4 bottom-0 h-1/3 opacity-40" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-3 py-1 font-semibold ring-1 ${lm.chip}`}>{lm.label}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                {chapter.icon} Ch. {chapter.n} · {chapter.title}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                Twister {tw.index + 1}/{chapter.count}
              </span>
              {tw.boss && <span className="rounded-full bg-amber-400 px-3 py-1 font-bold text-black">👑 BOSS: famous classic</span>}
              <span className="ml-auto text-white/50">Pass mark: {chapter.threshold}%</span>
            </div>

            <p className="mt-8 text-center text-2xl font-black leading-snug sm:text-4xl">
              {words.map((w, k) => {
                let cls = "text-white/90";
                if (phase === "speaking") cls = k < word ? "text-white" : k === word ? "karaoke-word rounded-lg bg-gradient-to-r from-amber-300 to-pink-400 px-1.5 text-black" : "text-white/35";
                else if (liveHits) cls = liveHits[k] ? "text-emerald-300" : "text-white/35";
                else if (result) cls = result.hits[k] ? "text-emerald-300" : "text-rose-400 underline decoration-wavy";
                return (
                  <span key={k} className={`transition-colors duration-150 ${cls}`}>
                    {w}{" "}
                  </span>
                );
              })}
            </p>

            {phase === "listening" && (
              <div className="mt-6 flex flex-col items-center gap-2 text-emerald-300">
                <span className="relative flex h-6 w-6">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-6 w-6 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm">{heard ? `“${heard}”` : "Listening… say it now!"}</span>
                <MicLevelBar level={micLevel} />
                <RecognizerChip heard={heard} listening />
              </div>
            )}
            {phase === "recording" && (
              <div className="mt-6 flex flex-col items-center gap-2 text-rose-300">
                <span className="relative flex h-6 w-6">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-6 w-6 rounded-full bg-rose-500" />
                </span>
                <span className="text-sm font-bold">🔴 Recording… say the twister now</span>
              </div>
            )}
            {phase === "review" && (
              <div className="animate-pop mt-6 rounded-3xl bg-white/5 p-5 text-center ring-1 ring-white/10">
                <div className="font-black">🎧 Compare: did you say it right?</div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button onClick={() => selfUrl && new Audio(selfUrl).play()} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">
                    ▶ Hear my voice
                  </button>
                  <button onClick={() => hear(0.95)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">
                    🔊 Hear correct
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      setResult({ score: 100, hits: words.map(() => true) });
                      applyScore(100);
                    }}
                    className="btn-3d rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 font-black"
                  >
                    ✅ I said it right
                  </button>
                  <button onClick={recordSelf} className="rounded-2xl bg-white/10 px-5 py-2.5 font-bold">
                    🔁 Try again
                  </button>
                </div>
              </div>
            )}
            {phase !== "listening" && phase !== "recording" && phase !== "review" && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <DeviceBar />
                {!selfMode && <RecognizerChip heard="" listening={false} />}
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={selfMode} onChange={(e) => setSelfMode(e.target.checked)} className="accent-emerald-400" />
                  Self-check mode: record myself and compare (use if voice recognition doesn&apos;t work)
                </label>
              </div>
            )}

            {result && (phase === "pass" || phase === "fail") && (
              <div className={`animate-pop mt-8 rounded-3xl p-5 text-center ${phase === "pass" ? "bg-emerald-500/15 ring-1 ring-emerald-400/40" : "bg-rose-500/15 ring-1 ring-rose-400/40"}`}>
                <div className="text-5xl font-black">{result.score}%</div>
                {phase === "pass" ? (
                  <>
                    <div className="mt-1 text-2xl">{"⭐".repeat(stars(result.score, chapter.threshold))}</div>
                    <div className="mt-1 font-bold text-emerald-200">
                      {celebrate === "level" ? "🏆 LEVEL UP! New level unlocked!" : celebrate === "chapter" ? "🎉 Chapter complete! Next chapter unlocked!" : "✅ Passed! Next twister unlocked."}
                    </div>
                    {drill > 1 && (
                      <div className="mt-1 text-sm text-amber-200">
                        🔁 Drill: {Math.min(reps, drill)} / {drill} {reps < drill ? "· say it again!" : "· drill complete! 💪"}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1 font-bold text-rose-200">
                    Not yet. You need {chapter.threshold}%. Listen again, then repeat until you pass. 💪
                    <div className="mt-1 text-xs font-normal text-white/60">Attempts: {prog.tries[tw.id] ?? 1} · Red words were missed</div>
                  </div>
                )}
                {heard && <div className="mt-2 text-xs text-white/50">We heard: “{heard}”</div>}
              </div>
            )}

            {notice && (
              <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                {notice}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-mic-check"))}
                    className="rounded-lg bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white/25"
                  >
                    🎧 Check my mic here
                  </button>
                  {!selfMode && (
                    <button onClick={() => setSelfMode(true)} className="rounded-lg bg-emerald-500/80 px-3 py-1 text-xs font-bold text-black">
                      Use self-check mode instead
                    </button>
                  )}
                </div>
              </div>
            )}
            {diag && <div className="mt-2 text-center font-mono text-[11px] text-white/40">{diag}</div>}
            {!notice && phase === "idle" && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-mic-check"))}
                  className="text-xs font-semibold text-white/50 underline hover:text-white"
                >
                  🎧 Check my mic here
                </button>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => hear(0.95)} disabled={phase === "listening"} className="btn-3d-ghost rounded-2xl bg-white/10 px-5 py-3 font-bold">
                🔊 Listen
              </button>
              <button onClick={() => hear(0.6)} disabled={phase === "listening"} className="btn-3d-ghost rounded-2xl bg-white/10 px-5 py-3 font-bold">
                🐢 Slow
              </button>
              {phase === "pass" && (
                <button onClick={selfMode ? recordSelf : tryIt} className="btn-3d-ghost rounded-2xl bg-white/10 px-5 py-3 font-bold">
                  🔁 Say it again
                </button>
              )}
              {phase === "pass" && twisters[tw.id] ? (
                <button onClick={goNext} className="btn-3d rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3 font-black">
                  Next twister →
                </button>
              ) : (
                phase !== "review" && (
                  <button
                    onClick={phase === "listening" ? reset : phase === "recording" ? () => cancelRef.current?.() : selfMode ? recordSelf : tryIt}
                    className={`btn-3d rounded-2xl px-7 py-3 font-black ${phase === "listening" || phase === "recording" ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-600"}`}
                  >
                    {phase === "listening" || phase === "recording"
                      ? "■ Stop"
                      : phase === "fail"
                        ? "🎤 Try again"
                        : passed.has(tw.id)
                          ? "🎤 Practice again"
                          : selfMode
                            ? "🔴 Record & check"
                            : "🎤 Say it!"}
                  </button>
                )
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
              <label className="flex items-center gap-1.5">
                🔁 Repeat each twister
                <select value={drill} onChange={(e) => setDrill(Number(e.target.value))} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 font-bold text-white">
                  {[1, 3, 5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}×
                    </option>
                  ))}
                </select>
              </label>
              <span>Attempts on this one: {prog.tries[tw.id] ?? 0}</span>
            </div>
            {voices.length > 0 && (
              <div className="mt-3 text-center">
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className="max-w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs">
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace(/Microsoft |Google /, "")} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {celebrate && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: celebrate === "pass" ? 18 : 40 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti absolute text-2xl"
                  style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.08}s` }}
                >
                  {["🎉", "⭐", "✨", "🎊", "💥"][i % 5]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* path */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-bold">
            {chapter.icon} {chapter.title} path
          </div>
          <div className="grid grid-cols-7 gap-1.5 lg:grid-cols-5">
            {twisters
              .filter((t) => t.chapter === chapter.n)
              .map((t) => {
                const open = unlocked(t.id);
                const ok = passed.has(t.id);
                return (
                  <button
                    key={t.id}
                    disabled={!open}
                    onClick={() => {
                      reset();
                      setReps(0);
                      setActiveId(t.id);
                    }}
                    title={open ? t.text : "Locked: pass the previous twister first"}
                    className={`flex aspect-square items-center justify-center rounded-xl text-xs font-bold transition ${
                      t.id === tw.id
                        ? "scale-110 bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/40"
                        : ok
                          ? "bg-emerald-500/80 text-black"
                          : open
                            ? "bg-white/15 hover:bg-white/25"
                            : "bg-white/5 text-white/25"
                    }`}
                  >
                    {t.boss ? "👑" : ok ? "✓" : open ? t.index + 1 : "🔒"}
                  </button>
                );
              })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/50">
            Pass each twister to unlock the next. Beat the 👑 boss to unlock the next chapter. The pass mark gets higher at every level.
          </p>
        </div>
      </div>
    </div>
  );
}
