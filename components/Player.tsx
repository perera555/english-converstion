"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Speaker } from "@/lib/types";
import { listen, micErrorMessage, pickDefaultPair, recognitionSupported, speak, stopSpeech, useVoices } from "@/lib/speech";
import { scoreSpeech, tokenize } from "@/lib/score";
import { useProgress } from "@/lib/progress";
import type { RealVideo } from "@/lib/videos";
import CompletionBar from "./CompletionBar";
import KaraokeScreen from "./KaraokeScreen";
import { requestVoiceCheck } from "@/lib/voice-check";
import RealVideos from "./RealVideos";
import VideoStage from "./VideoStage";

type Mode = "real" | "video" | "listen" | "shadow" | "roleplay";

const MODES: { id: Mode; label: string; icon: string; desc: string }[] = [
  { id: "real", label: "1 · Real video", icon: "🎥", desc: "Real people speaking native English about this topic." },
  { id: "video", label: "2 · Animated", icon: "🎬", desc: "This exact dialogue as a 3D scene with karaoke subtitles." },
  { id: "listen", label: "3 · Listen", icon: "🎧", desc: "Hear the full conversation. Words light up as they're spoken." },
  { id: "shadow", label: "4 · Voice practice", icon: "🎤", desc: "Hear each line, repeat it into your mic, and get a score." },
  { id: "roleplay", label: "5 · Role-play", icon: "🎭", desc: "Speak one character's part. The app speaks the other." },
];

interface Result {
  spoken: string;
  score: number;
  hits: boolean[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Player({ conv, videos, search }: { conv: Conversation; videos: RealVideo[]; search: string }) {
  const voices = useVoices();
  const { markDone, saveScore } = useProgress();

  const [voiceA, setVoiceA] = useState("");
  const [voiceB, setVoiceB] = useState("");
  const [rate, setRate] = useState(0.9);
  const [mode, setMode] = useState<Mode>("real");
  const [role, setRole] = useState<Speaker>("A");
  const [showText, setShowText] = useState(true);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [results, setResults] = useState<Record<number, Result>>({});
  const [notice, setNotice] = useState("");
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [justFinished, setJustFinished] = useState(false);
  const [rounds, setRounds] = useState(1);
  const [round, setRound] = useState(1);
  const roundRef = useRef(1);

  const runRef = useRef(0);
  const cancelRef = useRef<(() => void) | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const settings = useRef({ voiceA, voiceB, rate, mode, role, voices, rounds });
  settings.current = { voiceA, voiceB, rate, mode, role, voices, rounds };

  useEffect(() => {
    if (voices.length && !voiceA) {
      const [a, b] = pickDefaultPair(voices);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceA(a);
      setVoiceB(b);
    }
  }, [voices, voiceA]);

  const stop = useCallback(() => {
    runRef.current++;
    cancelRef.current?.();
    cancelRef.current = null;
    stopSpeech();
    setPlaying(false);
    setListening(false);
    setWordIndex(-1);
  }, []);

  useEffect(() => stop, [stop]);

  const speakLine = async (i: number, token: number) => {
    const s = settings.current;
    const line = conv.lines[i];
    const name = line.speaker === "A" ? s.voiceA : s.voiceB;
    const voice = s.voices.find((v) => v.name === name);
    const sameVoice = s.voiceA === s.voiceB;
    setWordIndex(0);
    const h = speak(line.text, {
      voice,
      rate: s.rate,
      pitch: sameVoice && line.speaker === "B" ? 1.25 : 1,
      onWord: (k) => {
        if (runRef.current === token) setWordIndex(k);
      },
    });
    cancelRef.current = h.cancel;
    await h.done;
  };

  const listenLine = async (i: number, token: number): Promise<number | null> => {
    const line = conv.lines[i];
    const n = tokenize(line.text).length;
    if (!recognitionSupported()) {
      setNotice("Your browser doesn't support speech recognition. Try Chrome or Edge to get scores. For now, read the line aloud.");
      setListening(true);
      await wait(1200 + n * 450);
      setListening(false);
      return null;
    }
    setHeard("");
    setListening(true);
    setWordIndex(-1);
    const h = listen({ onInterim: (t) => setHeard(t), timeoutMs: 6000 + n * 750, target: line.text });
    cancelRef.current = h.cancel;
    const r = await h.done;
    setListening(false);
    if (runRef.current !== token) return null;
    if (r.error === "self") return null; // self-check: the recording was played back, nothing to score
    const problem = micErrorMessage(r.error, r.transcript);
    if (problem) {
      setNotice(problem);
      // A blocked or missing mic stops practice; "didn't hear you" just moves on to the next line.
      if (r.transcript === "" && r.error && r.error !== "no-speech") stop();
      return null;
    }
    setNotice("");
    const { hits, score } = scoreSpeech(line.text, r.transcript);
    setResults((prev) => ({ ...prev, [i]: { spoken: r.transcript, score, hits } }));
    return score;
  };

  const run = async (start: number, end = conv.lines.length, nextRound = false) => {
    stop();
    if (!nextRound) {
      roundRef.current = 1;
      setRound(1);
    }
    const token = ++runRef.current;
    const m = settings.current.mode;
    if ((m === "shadow" || m === "roleplay") && !nextRound && !(await requestVoiceCheck())) return;
    if (runRef.current !== token) return;
    setPlaying(true);
    setNotice("");
    setJustFinished(false);
    if (start === 0 && end === conv.lines.length) {
      setResults({});
      setFinalScore(null);
    }
    const scores: number[] = [];
    for (let i = start; i < end; i++) {
      if (runRef.current !== token) return;
      setCurrent(i);
      if (m !== "video") lineRefs.current[i]?.scrollIntoView({ block: "center", behavior: "smooth" });
      const line = conv.lines[i];
      const userTurn = m === "roleplay" && line.speaker === settings.current.role;
      if (!userTurn) {
        await speakLine(i, token);
        if (runRef.current !== token) return;
      }
      if (m === "shadow" || userTurn) {
        await wait(150);
        const sc = await listenLine(i, token);
        if (runRef.current !== token) return;
        if (sc !== null) scores.push(sc);
      }
      await wait(m === "video" ? 500 : 280);
    }
    if (runRef.current !== token) return;
    setPlaying(false);
    setWordIndex(-1);
    if (end === conv.lines.length && start === 0) {
      markDone(conv.id);
      // Repeat mode: start the next round automatically.
      if (roundRef.current < settings.current.rounds) {
        await wait(1500);
        if (runRef.current !== token) return;
        roundRef.current++;
        setRound(roundRef.current);
        run(0, conv.lines.length, true);
        return;
      }
      setJustFinished(true);
      if (scores.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setFinalScore(avg);
        saveScore(conv.id, avg);
      }
    }
  };

  const togglePlay = () => (playing ? stop() : run(current >= conv.lines.length - 1 || justFinished ? 0 : current));

  const changeMode = (m: Mode) => {
    stop();
    setMode(m);
    setCurrent(0);
    setResults({});
    setFinalScore(null);
    setNotice("");
  };

  const voiceOptions = voices.map((v) => (
    <option key={v.name} value={v.name}>
      {v.name.replace(/Microsoft |Google /, "")} ({v.lang})
    </option>
  ));

  const startVoice = () => {
    changeMode("shadow");
    settings.current.mode = "shadow";
    run(0);
  };

  return (
    <div className="space-y-6">
      {mode !== "shadow" && mode !== "roleplay" && (
        <button
          onClick={startVoice}
          className="flex w-full items-center gap-4 rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 p-4 text-left transition hover:from-emerald-500/30"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl">🎤</span>
          <span>
            <span className="block font-black">Start voice practice</span>
            <span className="block text-sm text-white/60">Repeat every line into your mic and get a score. Headphones help!</span>
          </span>
          <span className="ml-auto text-xl">→</span>
        </button>
      )}
      {/* mode tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => changeMode(m.id)}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              mode === m.id
                ? "border-transparent bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 shadow-lg shadow-fuchsia-500/10 ring-1 ring-fuchsia-400/50"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
            }`}
          >
            <div className="text-base font-bold">
              <span className="mr-1.5">{m.icon}</span>
              {m.label}
            </div>
            <div className="mt-0.5 hidden text-xs text-white/55 sm:block">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode === "roleplay" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
          <span className="text-white/70">You play:</span>
          {(["A", "B"] as Speaker[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                stop();
                setRole(s);
                setResults({});
              }}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                role === s ? "bg-white text-black" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              {conv.speakers[s].name} <span className="font-normal opacity-60">({conv.speakers[s].role})</span>
            </button>
          ))}
        </div>
      )}

      {mode === "real" && (
        <div>
          <RealVideos videos={videos} search={search} compact />
          <p className="mt-3 text-sm text-white/55">
            👇 Below is the script for <b>this</b> conversation. Press <b>Play</b> to hear it with karaoke, or switch to Shadow or Role-play to speak it yourself.
          </p>
        </div>
      )}

      {mode === "video" && (
        <VideoStage
          conv={conv}
          current={current}
          wordIndex={wordIndex}
          playing={playing}
          listening={listening}
          heard={heard}
          onTogglePlay={togglePlay}
        />
      )}

      {/* control bar */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d1a]/85 p-3 backdrop-blur-xl">
        <button
          onClick={togglePlay}
          className={`btn-3d flex h-12 items-center gap-2 rounded-xl px-5 font-bold text-white ${
            playing ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-600"
          }`}
        >
          {playing ? "■ Stop" : current > 0 ? "▶ Resume" : "▶ Play"}
        </button>
        <button
          onClick={() => {
            stop();
            setCurrent(0);
            setResults({});
            setFinalScore(null);
          }}
          className="h-12 rounded-xl bg-white/10 px-4 text-sm font-semibold hover:bg-white/15"
          title="Restart"
        >
          ↺ Restart
        </button>
        <label className="flex items-center gap-2 text-sm text-white/70">
          Speed
          <input
            type="range"
            min={0.5}
            max={1.3}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-24 accent-fuchsia-500"
          />
          <span className="w-10 tabular-nums text-white">{rate.toFixed(2)}×</span>
        </label>
        <button
          onClick={() => setShowText((s) => !s)}
          className={`h-9 rounded-lg px-3 text-xs font-semibold ${showText ? "bg-white/10" : "bg-amber-400 text-black"}`}
        >
          {showText ? "👁 Text on" : "🙈 Text hidden"}
        </button>
        <details className="ml-auto text-sm">
          <summary className="cursor-pointer list-none rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15">
            🔊 Voices
          </summary>
          <div className="absolute right-3 mt-2 w-[min(22rem,calc(100vw-3rem))] space-y-3 rounded-2xl border border-white/10 bg-[#141426] p-4 shadow-2xl">
            {!voices.length && <p className="text-xs text-white/60">Loading voices… (your browser must support text-to-speech)</p>}
            {(["A", "B"] as Speaker[]).map((s) => (
              <label key={s} className="block text-xs text-white/60">
                {conv.speakers[s].name}&apos;s voice
                <select
                  value={s === "A" ? voiceA : voiceB}
                  onChange={(e) => (s === "A" ? setVoiceA(e.target.value) : setVoiceB(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                >
                  {voiceOptions}
                </select>
              </label>
            ))}
          </div>
        </details>
      </div>

      <CompletionBar
        id={conv.id}
        step={current}
        total={conv.lines.length}
        playing={playing}
        justFinished={justFinished}
        onAgain={() => run(0)}
        noun={mode === "shadow" || mode === "roleplay" ? "practice" : "read"}
        round={round}
        rounds={rounds}
        onRounds={setRounds}
      />

      {notice && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{notice}</div>
      )}

      {finalScore !== null && (
        <div className="animate-pop rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 p-5 text-center">
          <div className="text-sm uppercase tracking-widest text-emerald-200">Speaking score</div>
          <div className="mt-1 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-5xl font-black text-transparent">
            {finalScore}%
          </div>
          <div className="mt-1 text-sm text-white/70">
            {finalScore >= 90 ? "Amazing! You sound like a native. 🔥" : finalScore >= 70 ? "Great job! Keep practicing. 💪" : "Good start! Try it again a little slower. 🌱"}
          </div>
        </div>
      )}

      {/* transcript */}
      <div className="space-y-3">
        {conv.lines.map((line, i) => {
          const isA = line.speaker === "A";
          const active = i === current && (playing || listening);
          const words = tokenize(line.text);
          const res = results[i];
          const yours = mode === "roleplay" && line.speaker === role;
          const hidden = !showText && !active && !res;
          return (
            <div
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={`flex ${isA ? "justify-start" : "justify-end"}`}
            >
              <div
                onClick={() => run(i, i + 1)}
                className={`group relative max-w-[88%] cursor-pointer rounded-3xl border px-4 py-3 transition-all duration-300 sm:max-w-[75%] sm:px-5 ${
                  isA ? "rounded-tl-md" : "rounded-tr-md"
                } ${
                  active
                    ? "scale-[1.02] border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/25 to-violet-500/15 shadow-xl shadow-fuchsia-500/20"
                    : isA
                      ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      : "border-cyan-300/15 bg-cyan-400/[0.06] hover:bg-cyan-400/[0.1]"
                }`}
                title="Click to hear this line"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className={`font-bold ${isA ? "text-fuchsia-300" : "text-cyan-300"}`}>{conv.speakers[line.speaker].name}</span>
                  <span className="text-white/40">{conv.speakers[line.speaker].role}</span>
                  {yours && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">YOU</span>}
                  <span className="ml-auto opacity-0 transition group-hover:opacity-60">🔊</span>
                </div>
                <p className={`text-base leading-relaxed sm:text-lg ${hidden ? "select-none blur-[6px]" : ""}`}>
                  {words.map((w, k) => {
                    let cls = "";
                    if (res) cls = res.hits[k] ? "text-emerald-300" : "text-rose-400 underline decoration-wavy decoration-rose-400/60";
                    else if (active && !listening) {
                      cls =
                        k < wordIndex
                          ? "text-white"
                          : k === wordIndex
                            ? "karaoke-word rounded-md bg-gradient-to-r from-amber-300 to-pink-400 px-1 text-black"
                            : "text-white/45";
                    } else if (active && listening) cls = "text-amber-100";
                    return (
                      <span key={k} className={`transition-colors duration-150 ${cls}`}>
                        {w}{" "}
                      </span>
                    );
                  })}
                </p>
                {active && listening && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                    {heard ? <span className="italic">“{heard}”</span> : "Listening… say the line"}
                  </div>
                )}
                {res && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-bold ${
                        res.score >= 85 ? "bg-emerald-400 text-black" : res.score >= 60 ? "bg-amber-400 text-black" : "bg-rose-500 text-white"
                      }`}
                    >
                      {res.score}%
                    </span>
                    <span className="text-white/50">You said: “{res.spoken || "…"}”</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(playing || listening) && mode !== "video" && conv.lines[current] && (
        <KaraokeScreen
          label={`${conv.speakers[conv.lines[current].speaker].name} · line ${current + 1}/${conv.lines.length}`}
          text={conv.lines[current].text}
          wordIndex={wordIndex}
          listening={listening}
          heard={heard}
          nextText={conv.lines[current + 1]?.text}
        />
      )}
    </div>
  );
}
