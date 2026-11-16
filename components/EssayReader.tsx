"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Essay } from "@/lib/essay-types";
import type { RealVideo } from "@/lib/videos";
import { listen, micErrorMessage, recognitionSupported, speak, stopSpeech, useVoices } from "@/lib/speech";
import { scoreSpeech, tokenize } from "@/lib/score";
import { useProgress } from "@/lib/progress";
import CompletionBar from "./CompletionBar";
import KaraokeScreen from "./KaraokeScreen";
import { requestVoiceCheck } from "@/lib/voice-check";
import RealVideos from "./RealVideos";
import { SCENES } from "./VideoStage";

type Mode = "real" | "read" | "video" | "shadow";
const MODES: { id: Mode; label: string; icon: string; desc: string }[] = [
  { id: "real", label: "1 · Real video", icon: "🎥", desc: "Native speakers on this topic" },
  { id: "read", label: "2 · Read aloud", icon: "📖", desc: "Karaoke reading of the essay" },
  { id: "video", label: "3 · Video", icon: "🎬", desc: "Full-screen lyric-style video" },
  { id: "shadow", label: "4 · Voice practice", icon: "🎤", desc: "Repeat each sentence for a score" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ESSAY_ID_OFFSET = 100000; // keeps essay progress separate from conversations

export default function EssayReader({ essay, videos, search }: { essay: Essay; videos: RealVideo[]; search: string }) {
  const voices = useVoices();
  const { markDone, saveScore } = useProgress();
  const sentences = useMemo(
    () => essay.paragraphs.flatMap((p, pi) => p.map((text) => ({ text, pi }))),
    [essay],
  );

  const [mode, setMode] = useState<Mode>("real");
  const [voice, setVoice] = useState("");
  const [rate, setRate] = useState(0.9);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [word, setWord] = useState(-1);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [results, setResults] = useState<Record<number, { score: number; hits: boolean[]; spoken: string }>>({});
  const [final, setFinal] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [justFinished, setJustFinished] = useState(false);
  const [rounds, setRounds] = useState(1);
  const [round, setRound] = useState(1);
  const roundRef = useRef(1);

  const runRef = useRef(0);
  const cancelRef = useRef<(() => void) | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [untilCorrect, setUntilCorrect] = useState(true);
  const settings = useRef({ voice, rate, voices, mode, rounds, untilCorrect });
  settings.current = { voice, rate, voices, mode, rounds, untilCorrect };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (voices.length && !voice) setVoice(voices[0].name);
  }, [voices, voice]);

  const stop = useCallback(() => {
    runRef.current++;
    cancelRef.current?.();
    stopSpeech();
    setPlaying(false);
    setListening(false);
    setWord(-1);
  }, []);
  useEffect(() => stop, [stop]);

  const run = async (start: number, end = sentences.length, nextRound = false) => {
    stop();
    if (!nextRound) {
      roundRef.current = 1;
      setRound(1);
    }
    const token = ++runRef.current;
    const m = settings.current.mode;
    if (m === "shadow" && !nextRound && !(await requestVoiceCheck())) return;
    if (runRef.current !== token) return;
    setPlaying(true);
    setNotice("");
    setJustFinished(false);
    if (start === 0 && end === sentences.length) {
      setResults({});
      setFinal(null);
    }
    const scores: number[] = [];
    for (let i = start; i < end; i++) {
      if (runRef.current !== token) return;
      setCurrent(i);
      if (m !== "video") document.getElementById(`s-${i}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      const s = settings.current;
      setWord(0);
      const h = speak(sentences[i].text, {
        voice: s.voices.find((v) => v.name === s.voice),
        rate: s.rate,
        onWord: (k) => runRef.current === token && setWord(k),
      });
      cancelRef.current = h.cancel;
      await h.done;
      if (runRef.current !== token) return;
      if (m === "shadow") {
        if (!recognitionSupported()) {
          setNotice("Speech recognition needs Chrome or Edge. Read the sentence aloud anyway!");
          await wait(1500 + tokenize(sentences[i].text).length * 400);
        } else {
          // Listen; if the sentence isn't correct yet, show mistakes, read it again, and listen again.
          let lastScore: number | null = null;
          for (let tries = 1; tries <= 5; tries++) {
            if (tries > 1) {
              setNotice(`🔁 ${lastScore}%: not quite yet. Red words were missed. Listen, then read the sentence again (try ${tries} of 5).`);
              await wait(900);
              if (runRef.current !== token) return;
              const again = speak(sentences[i].text, {
                voice: settings.current.voices.find((v) => v.name === settings.current.voice),
                rate: settings.current.rate,
                onWord: (k) => runRef.current === token && setWord(k),
              });
              cancelRef.current = again.cancel;
              await again.done;
              if (runRef.current !== token) return;
            }
            setListening(true);
            setHeard("");
            setWord(-1);
            const l = listen({ onInterim: setHeard, timeoutMs: 6000 + tokenize(sentences[i].text).length * 750, target: sentences[i].text });
            cancelRef.current = l.cancel;
            const r = await l.done;
            setListening(false);
            if (runRef.current !== token) return;
            if (r.error === "self") break; // self-check: the recording was played back, nothing to score
            const problem = micErrorMessage(r.error, r.transcript);
            if (problem) {
              setNotice(problem);
              if (r.error && r.error !== "no-speech") {
                stop();
                return;
              }
              break;
            }
            const sc = scoreSpeech(sentences[i].text, r.transcript);
            lastScore = sc.score;
            setResults((p) => ({ ...p, [i]: { ...sc, spoken: r.transcript } }));
            if (sc.score >= 70 || !settings.current.untilCorrect) {
              setNotice(tries > 1 && sc.score >= 70 ? `✅ ${sc.score}%: corrected! Well done.` : "");
              break;
            }
          }
          if (lastScore !== null) scores.push(lastScore);
        }
      }
      await wait(m === "video" ? 450 : 200);
    }
    if (runRef.current !== token) return;
    setPlaying(false);
    setWord(-1);
    if (start === 0 && end === sentences.length) {
      markDone(ESSAY_ID_OFFSET + essay.id);
      if (roundRef.current < settings.current.rounds) {
        await wait(1500);
        if (runRef.current !== token) return;
        roundRef.current++;
        setRound(roundRef.current);
        run(0, sentences.length, true);
        return;
      }
      setJustFinished(true);
      if (scores.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setFinal(avg);
        saveScore(ESSAY_ID_OFFSET + essay.id, avg);
      }
    }
  };

  // Resuming mid-way continues; otherwise (fresh or finished) it starts a new full read that counts.
  const toggle = () => (playing ? stop() : run(current > 0 && current < sentences.length - 1 && !justFinished ? current : 0));
  const scene = SCENES[essay.topic] ?? SCENES["Daily Life"];
  const cur = sentences[current];

  const renderWords = (i: number, text: string, big = false) => {
    const ws = tokenize(text);
    const res = results[i];
    const active = i === current && playing;
    return ws.map((w, k) => {
      let cls = "";
      if (res) cls = res.hits[k] ? "text-emerald-300" : "text-rose-400 underline decoration-wavy";
      else if (active && !listening) {
        cls =
          k < word
            ? "text-white"
            : k === word
              ? `karaoke-word rounded-md bg-gradient-to-r from-amber-300 to-pink-400 px-1 text-black`
              : big
                ? "text-white/40"
                : "text-white/50";
      } else if (active && listening) cls = "text-amber-100";
      return (
        <span key={k} className={`transition-colors duration-150 ${cls}`}>
          {w}{" "}
        </span>
      );
    });
  };

  const startVoice = () => {
    stop();
    setMode("shadow");
    setResults({});
    setFinal(null);
    settings.current.mode = "shadow";
    run(0);
  };

  return (
    <div className="space-y-6">
      {mode !== "shadow" && (
        <button
          onClick={startVoice}
          className="flex w-full items-center gap-4 rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 p-4 text-left transition hover:from-emerald-500/30"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl">🎤</span>
          <span>
            <span className="block font-black">Start voice practice</span>
            <span className="block text-sm text-white/60">Hear each sentence, then read it aloud into your mic and get a score.</span>
          </span>
          <span className="ml-auto text-xl">→</span>
        </button>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              stop();
              setMode(m.id);
              setResults({});
              setFinal(null);
              setCurrent(-1);
            }}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              mode === m.id
                ? "border-transparent bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/20 ring-1 ring-cyan-300/50"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
            }`}
          >
            <div className="font-bold">
              {m.icon} {m.label}
            </div>
            <div className="mt-0.5 hidden text-xs text-white/55 sm:block">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode === "real" && <RealVideos videos={videos} search={search} compact />}

      {mode === "video" && (
        <div
          ref={stageRef}
          className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${scene.bg} p-6 shadow-2xl ring-1 ring-white/10 [&:fullscreen]:rounded-none`}
        >
          <div className="stage-floor absolute -inset-x-1/4 bottom-0 h-1/2 bg-black/20" />
          <div className="absolute inset-0 bg-black/45" />
          {scene.props.map((p, i) => (
            <span key={i} className="animate-float absolute text-4xl opacity-60 sm:text-6xl" style={{ left: `${6 + i * 25}%`, top: `${10 + (i % 2) * 60}%`, animationDelay: `${i * 0.8}s` }}>
              {p}
            </span>
          ))}
          <div className="relative max-w-4xl text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {essay.emoji} {essay.title}
            </div>
            <p className="text-xl font-black leading-snug drop-shadow-xl sm:text-4xl">
              {cur ? renderWords(current, cur.text, true) : <span className="text-white/80">Press play to start the video</span>}
            </p>
          </div>
          {!playing && (
            <button onClick={toggle} className="absolute inset-0 flex items-center justify-center" aria-label="Play">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl text-black shadow-2xl transition hover:scale-110">▶</span>
            </button>
          )}
          <button
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : stageRef.current?.requestFullscreen?.().catch(() => {}))}
            className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur"
          >
            ⛶ Full screen
          </button>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
            <div className="h-full bg-gradient-to-r from-cyan-300 to-fuchsia-500 transition-all" style={{ width: `${((current + 1) / sentences.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d1a]/85 p-3 backdrop-blur-xl">
        <button onClick={toggle} className={`btn-3d h-12 rounded-xl px-5 font-bold ${playing ? "bg-rose-500" : "bg-gradient-to-r from-cyan-500 to-violet-600"}`}>
          {playing ? "■ Stop" : mode === "shadow" ? "🎤 Start shadowing" : "▶ Read aloud"}
        </button>
        <label className="flex items-center gap-2 text-sm text-white/70">
          Speed
          <input type="range" min={0.5} max={1.3} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-24 accent-cyan-400" />
          <span className="w-10 tabular-nums text-white">{rate.toFixed(2)}×</span>
        </label>
        {mode === "shadow" && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
            <input type="checkbox" checked={untilCorrect} onChange={(e) => setUntilCorrect(e.target.checked)} className="accent-emerald-400" />
            🔁 Repeat each sentence until correct
          </label>
        )}
        <select value={voice} onChange={(e) => setVoice(e.target.value)} className="ml-auto max-w-[14rem] rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs">
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name.replace(/Microsoft |Google /, "")} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      <CompletionBar
        id={ESSAY_ID_OFFSET + essay.id}
        step={Math.max(0, current)}
        total={sentences.length}
        playing={playing}
        justFinished={justFinished}
        onAgain={() => run(0)}
        noun={mode === "shadow" ? "practice" : "read"}
        round={round}
        rounds={rounds}
        onRounds={setRounds}
      />

      {notice && <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{notice}</div>}
      {listening && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          🎙️ Your turn. Repeat the highlighted sentence… {heard && <i>“{heard}”</i>}
        </div>
      )}
      {final !== null && (
        <div className="animate-pop rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 p-5 text-center">
          <div className="text-sm uppercase tracking-widest text-emerald-200">Reading score</div>
          <div className="text-5xl font-black text-emerald-300">{final}%</div>
        </div>
      )}

      <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
        <h2 className="text-2xl font-black sm:text-3xl">{essay.title}</h2>
        <p className="mt-1 text-sm text-white/50">by {essay.author} · {essay.words} words</p>
        <div className="mt-6 space-y-5 text-lg leading-relaxed sm:text-xl">
          {essay.paragraphs.map((p, pi) => (
            <p key={pi}>
              {sentences.map((s, i) =>
                s.pi !== pi ? null : (
                  <span
                    key={i}
                    id={`s-${i}`}
                    onClick={() => run(i, i + 1)}
                    title="Click to hear this sentence"
                    className={`cursor-pointer rounded-lg px-0.5 transition ${i === current && playing ? "bg-cyan-400/10 ring-1 ring-cyan-300/40" : "hover:bg-white/5"}`}
                  >
                    {renderWords(i, s.text)}
                    {results[i] && (
                      <span className={`mr-1 rounded-full px-1.5 text-xs font-bold ${results[i].score >= 80 ? "bg-emerald-400 text-black" : "bg-rose-500"}`}>
                        {results[i].score}%
                      </span>
                    )}
                  </span>
                ),
              )}
            </p>
          ))}
        </div>
      </article>

      {(playing || listening) && mode !== "video" && cur && (
        <KaraokeScreen
          label={`Sentence ${current + 1}/${sentences.length}`}
          text={cur.text}
          wordIndex={word}
          listening={listening}
          heard={heard}
          nextText={sentences[current + 1]?.text}
        />
      )}
    </div>
  );
}
