"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { listen, micErrorMessage, recognitionSupported, stopSpeech } from "@/lib/speech";
import { finishVoiceCheck, markVoiceCheckPassed } from "@/lib/voice-check";
import { ENGINES, getEngine, isBuiltin, loadWhisper, setEngine, setMicDevice, type Engine } from "@/lib/whisper";

// Bluetooth, USB and wired headsets / earbuds, plus common brands.
const HEADSET =
  /headset|headphone|earbud|earphone|airpods|buds|bluetooth|hands-?free|usb|wired|external|line in|jack|logitech|hyperx|razer|steelseries|corsair|jabra|plantronics|poly|sennheiser|jbl|bose|sony|beats|anker|soundcore|boat|skullcandy|audio-technica|edifier|oneplus|redmi|realme|oppo|samsung|galaxy|pixel/i;
const clean = (label: string) => label.replace(/^(Default|Communications) - /, "");
const TEST_PHRASE = "Hello, how are you?";

function StatusRow({ label, state, text }: { label: string; state: "ok" | "bad" | "wait" | "none"; text: string }) {
  const icon = { ok: "✅", bad: "❌", wait: "⏳", none: "⚪" }[state];
  const color = { ok: "text-emerald-300", bad: "text-rose-300", wait: "text-amber-200", none: "text-white/50" }[state];
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 shrink-0 text-white/70">{label}</span>
      <span className={`font-bold ${color}`}>
        {icon} {text}
      </span>
    </div>
  );
}

/**
 * 🎧 button in the header + device check dialog.
 * Opens from the button, or automatically before the first voice practice of a session ("gate" mode).
 */
export default function MicCheck() {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState(false);
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("default");
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [heardSound, setHeardSound] = useState<null | boolean>(null);
  const [micHeard, setMicHeard] = useState<null | boolean>(null);
  const [recording, setRecording] = useState<"idle" | "recording" | "playing">("idle");
  const [recog, setRecog] = useState<{ state: "idle" | "listening" | "ok" | "fail"; text: string; msg?: string }>({ state: "idle", text: "" });
  const [toast, setToast] = useState("");
  const [engine, setEngineState] = useState<Engine>("browser");
  const [modelPct, setModelPct] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEngineState(getEngine());
  }, []);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const known = useRef<Set<string>>(new Set());

  const refresh = useCallback(async (announce = false) => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const ins = list.filter((d) => d.kind === "audioinput");
      const outs = list.filter((d) => d.kind === "audiooutput");
      setInputs(ins);
      setOutputs(outs);
      // Announce newly connected headsets.
      const heads = [...ins, ...outs].filter((d) => d.label && HEADSET.test(d.label));
      if (announce) {
        const fresh = heads.find((d) => !known.current.has(d.label));
        const gone = [...known.current].find((l) => !heads.some((d) => d.label === l));
        if (fresh) setToast(`🎧 Connected: ${fresh.label.replace(/^(Default|Communications) - /, "")}`);
        else if (gone) setToast(`🎧 Disconnected: ${gone.replace(/^Default - /, "")}`);
      }
      known.current = new Set(heads.map((d) => d.label));
    } catch {}
  }, []);

  // Auto-detect devices on load and whenever something is plugged in or out.
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(false);
    const onChange = () => refresh(true);
    navigator.mediaDevices.addEventListener?.("devicechange", onChange);
    const onOpen = () => {
      setGate(true);
      setOpen(true);
    };
    window.addEventListener("open-voice-check", onOpen);
    const onOpenPlain = () => {
      setGate(false);
      setOpen(true);
    };
    window.addEventListener("open-mic-check", onOpenPlain);
    const onRelease = () => stopTestRef.current();
    window.addEventListener("release-mic", onRelease);
    return () => {
      window.removeEventListener("release-mic", onRelease);
      window.removeEventListener("open-mic-check", onOpenPlain);
      navigator.mediaDevices.removeEventListener?.("devicechange", onChange);
      window.removeEventListener("open-voice-check", onOpen);
    };
  }, [refresh]);

  // Opening the dialog grabs the mic automatically (this also reveals device names).
  useEffect(() => {
    if (open) startTest();
    else stopTest(); // always release the mic when the dialog is closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Automatically pick a connected headset / Bluetooth earbuds mic.
  useEffect(() => {
    const h = inputs.find((d) => d.deviceId && d.deviceId !== "default" && HEADSET.test(d.label));
    if (h && deviceId === "default") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeviceId(h.deviceId);
      setMicDevice(h.deviceId);
      if (testing) startTest(h.deviceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const session = useRef(0); // bumps on every stop, so a late-starting stream can't keep running
  const audioCtx = useRef<AudioContext | null>(null);

  const stopTest = () => {
    session.current++;
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    setTesting(false);
    setLevel(0);
  };

  const stopTestRef = useRef(stopTest);
  stopTestRef.current = stopTest;

  const startTest = async (id = deviceId) => {
    stopTest();
    const mine = session.current;
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: id === "default" ? true : { deviceId: { exact: id } } });
      // The dialog was closed (or the test restarted) while the mic was starting: release it.
      if (mine !== session.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      setTesting(true);
      await refresh(false); // device names appear after permission is granted
      if (mine !== session.current) return;
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let p = 0;
        for (const v of data) p = Math.max(p, Math.abs(v - 128));
        const l = Math.min(1, p / 50);
        setLevel(l);
        setPeak((x) => Math.max(x, l));
        if (mine === session.current) raf.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setError("Microphone access was blocked or the device is unavailable. Allow the mic in your browser's address bar and try again.");
    }
  };

  // Record a few seconds from the selected mic and play it back, so learners hear themselves.
  const recordPlayback = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: deviceId === "default" ? true : { deviceId: { exact: deviceId } } });
      const rec = new MediaRecorder(s);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        const audio = new Audio(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        setRecording("playing");
        audio.onended = () => setRecording("idle");
        audio.play().catch(() => setRecording("idle"));
      };
      setRecording("recording");
      rec.start();
      setTimeout(() => rec.state === "recording" && rec.stop(), 3000);
    } catch {
      setRecording("idle");
      setError("Couldn't record from this microphone. Allow mic access or pick another microphone.");
    }
  };

  const speakerTest = () => {
    const u = new SpeechSynthesisUtterance("Hello! If you can hear me clearly, press yes.");
    u.lang = "en-US";
    stopSpeech();
    setTimeout(() => speechSynthesis.speak(u), 150);
  };

  const recognitionTest = async () => {
    stopTest(); // free the mic for speech recognition
    if (!recognitionSupported()) {
      setRecog({ state: "fail", text: "", msg: "This browser can't check your voice. Please use Chrome, Edge or Safari." });
      return;
    }
    setRecog({ state: "listening", text: "" });

    // Only ONE recording at a time: a second "monitor" stream can silence USB/Bluetooth headsets.
    const l = listen({ onInterim: (t) => setRecog({ state: "listening", text: t }), timeoutMs: 8000, target: TEST_PHRASE });
    const r = await l.done;

    let msg = micErrorMessage(r.error, r.transcript);
    if (!r.transcript && (!r.error || r.error === "no-speech" || r.error === "network")) {
      const quiet = peak < 0.15;
      msg = quiet
        ? "🔇 Your microphone is very quiet (the level bar in step 2 barely moved). Check the mic plug is in the MIC jack (usually pink) of your USB adapter, and set Input volume to 100 in Windows Settings → System → Sound → Input. Then test again."
        : engine === "browser"
          ? "🔧 Your mic works, but the browser's own recognizer heard no words. This is common with some USB and Bluetooth headsets. Switch on the 🧠 Built-in recognizer below and test again."
          : "🤔 No words recognized. Speak a little louder and closer to the mic, then test again.";
    }
    setRecog(msg ? { state: "fail", text: r.transcript, msg } : { state: "ok", text: r.transcript });
  };

  const switchEngine = async (e: Engine) => {
    setEngine(e);
    setEngineState(e);
    setRecog({ state: "idle", text: "" });
    if (isBuiltin(e)) {
      setModelPct(0);
      try {
        await loadWhisper((p) => setModelPct(p), e);
        setModelPct(100);
      } catch {
        setModelPct(-1);
      }
    }
  };

  const close = (ok: boolean) => {
    stopTest();
    setOpen(false);
    if (gate) finishVoiceCheck(ok);
    else if (recog.state === "ok") markVoiceCheckPassed();
    setGate(false);
    setRecog({ state: "idle", text: "" });
    setHeardSound(null);
    setMicHeard(null);
    setPeak(0);
  };

  const headsetIn = inputs.find((d) => HEADSET.test(d.label));
  const headsetOut = outputs.find((d) => HEADSET.test(d.label));
  const defaultIn = inputs.find((d) => d.deviceId === "default") ?? inputs[0];
  const headsetName = (headsetOut ?? headsetIn)?.label.replace(/^(Default|Communications) - /, "");
  const allGood = recog.state === "ok";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
          headsetName ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40" : "bg-white/5 ring-white/10 hover:bg-white/10"
        }`}
        title={headsetName ? `Headphones detected: ${headsetName}` : "Mic & headphones check"}
      >
        🎧<span className="ml-1 hidden sm:inline">{headsetName ? "Headset ✓" : "Mic check"}</span>
        {headsetName && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07070f]" />}
      </button>

      {toast &&
        createPortal(
          <div className="animate-pop fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-2xl">{toast}</div>,
          document.body,
        )}

      {/* Rendered into <body>: inside the blurred header, "fixed" would be trapped in the header box. */}
      {open &&
        createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center" onClick={() => close(false)}>
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#12121f] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{gate ? "🎤 Before you start: device check" : "🎧 Mic & headphones check"}</h3>
              <button onClick={() => close(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <p className="mt-1 text-sm text-white/60">Three quick steps to make sure the app can hear you. Headphones and earbuds give the best results.</p>

            {/* Status summary */}
            <div className="mt-3 grid gap-1.5 rounded-2xl bg-black/40 p-3 text-sm ring-1 ring-white/10">
              <StatusRow
                label="🎙️ Microphone"
                state={error || micHeard === false ? "bad" : micHeard || peak > 0.15 ? "ok" : testing ? "wait" : "none"}
                text={
                  error
                    ? "Not working: blocked or not found"
                    : micHeard === false
                      ? "Not heard on playback"
                      : micHeard || peak > 0.15
                        ? "Working"
                        : testing
                          ? "Listening… say something"
                          : "Not tested"
                }
              />
              <StatusRow
                label="🎧 Hearing (sound)"
                state={heardSound === true ? "ok" : heardSound === false ? "bad" : "none"}
                text={heardSound === true ? "Working" : heardSound === false ? "Not heard: check volume / output device" : "Not tested: press Play test sound"}
              />
              <StatusRow
                label="🗣️ Voice recognizer"
                state={recog.state === "ok" ? "ok" : recog.state === "fail" ? "bad" : recog.state === "listening" ? "wait" : "none"}
                text={
                  recog.state === "ok"
                    ? "Working"
                    : recog.state === "fail"
                      ? "Problem: see step 3"
                      : recog.state === "listening"
                        ? "Listening…"
                        : "Not tested: press Test my voice"
                }
              />
              <div className="flex gap-2 text-xs">
                <span className="w-32 shrink-0 text-white/50">📝 Recognized</span>
                <span className="italic text-white/85">{recog.text ? `“${recog.text}”` : "–"}</span>
              </div>
            </div>

            {/* Everything the device reports */}
            <section className="mt-4 rounded-2xl bg-white/5 p-4 text-xs ring-1 ring-white/10">
              <div className="mb-2 flex items-center justify-between">
                <b className="text-sm">🔌 Connected audio devices</b>
                <button onClick={() => (testing ? refresh(false) : startTest())} className="rounded-lg bg-white/10 px-2 py-1 font-semibold hover:bg-white/15">
                  ↻ Refresh
                </button>
              </div>
              {inputs.length === 0 && outputs.length === 0 ? (
                <p className="text-white/55">No devices found yet. Allow microphone access when the browser asks.</p>
              ) : (
                <ul className="space-y-1">
                  {[...inputs.map((d) => ({ d, kind: "🎙️ Mic" })), ...outputs.map((d) => ({ d, kind: "🔊 Sound" }))]
                    .filter(({ d }) => d.deviceId !== "communications")
                    .map(({ d, kind }, i) => (
                      <li key={kind + d.deviceId + i} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-white/45">{kind}</span>
                        <span className={HEADSET.test(d.label) ? "font-bold text-emerald-300" : "text-white/80"}>
                          {HEADSET.test(d.label) ? "🎧 " : ""}
                          {d.label ? clean(d.label) : "(name hidden until mic access is allowed)"}
                        </span>
                        {d.deviceId === "default" && <span className="rounded bg-white/10 px-1.5 text-[10px] font-bold">DEFAULT</span>}
                      </li>
                    ))}
                </ul>
              )}
              {outputs.length === 0 && inputs.length > 0 && (
                <p className="mt-2 text-white/45">This browser doesn&apos;t list speakers/headphones (Safari and Firefox hide them). Use the test sound below.</p>
              )}
            </section>

            {/* Step 1: headphones */}
            <section className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <b>1 · 🎧 Headphones / speaker</b>
                <span className={`text-xs font-bold ${heardSound ? "text-emerald-300" : heardSound === false ? "text-rose-300" : "text-white/40"}`}>
                  {heardSound ? "✓ Working" : heardSound === false ? "✗ Not heard" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/60">
                {headsetName ? (
                  <>Detected: <b className="text-emerald-300">{headsetName}</b></>
                ) : (
                  "No headset detected (or the browser hides device names until you test the mic). Speakers work too."
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={speakerTest} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/15">🔊 Play test sound</button>
                <button onClick={() => setHeardSound(true)} className="rounded-xl bg-emerald-500/80 px-3 py-1.5 text-sm font-bold text-black">I heard it</button>
                <button onClick={() => setHeardSound(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold">I didn&apos;t</button>
              </div>
              {heardSound === false && (
                <p className="mt-2 text-xs text-amber-200">Turn up the volume, check the headphones are connected (Bluetooth on), and select them as the sound output in your device settings.</p>
              )}
            </section>

            {/* Step 2: mic level */}
            <section className="mt-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <b>2 · 🎙️ Microphone</b>
                <span className={`text-xs font-bold ${peak > 0.15 ? "text-emerald-300" : "text-white/40"}`}>{peak > 0.15 ? "✓ Hearing sound" : ""}</span>
              </div>
              {headsetIn && <p className="mt-1 text-xs text-white/60">Headset mic found: <b className="text-emerald-300">{headsetIn.label.replace(/^(Default|Communications) - /, "")}</b></p>}
              <select
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setMicDevice(e.target.value);
                  if (testing) startTest(e.target.value);
                }}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
              >
                <option value="default">System default</option>
                {inputs
                  .filter((d) => d.deviceId && d.deviceId !== "default")
                  .map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {HEADSET.test(d.label) ? "🎧 " : ""}
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
              </select>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500 transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => (testing ? stopTest() : startTest())} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${testing ? "bg-rose-500" : "bg-white/10 hover:bg-white/15"}`}>
                  {testing ? "■ Stop" : "🎙️ Test mic"}
                </button>
                <span className="text-xs text-white/50">{testing ? (level > 0.15 ? "We can hear you!" : "Say something…") : "Press and talk"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={recordPlayback}
                  disabled={recording !== "idle"}
                  className="rounded-xl bg-rose-500/80 px-3 py-1.5 text-sm font-bold disabled:opacity-60"
                >
                  {recording === "recording" ? "🔴 Recording… talk now" : recording === "playing" ? "▶ Playing your voice…" : "🔴 Record 3 sec & play back"}
                </button>
                <button onClick={() => setMicHeard(true)} className="rounded-xl bg-emerald-500/80 px-3 py-1.5 text-sm font-bold text-black">
                  I heard myself
                </button>
                <button onClick={() => setMicHeard(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold">
                  I didn&apos;t
                </button>
              </div>
              {micHeard === false && (
                <p className="mt-2 text-xs text-amber-200">
                  Pick another microphone above, move closer, check the mic isn&apos;t muted (headset mute switch), and make sure the browser is allowed to use it.
                </p>
              )}
              {error && <p className="mt-2 rounded-xl bg-rose-500/15 p-2 text-xs text-rose-200">{error}</p>}
            </section>

            {/* Step 3: recognition */}
            <section className={`mt-3 rounded-2xl p-4 ring-1 ${allGood ? "bg-emerald-500/15 ring-emerald-400/40" : "bg-white/5 ring-white/10"}`}>
              <div className="flex items-center justify-between">
                <b>3 · 🗣️ Voice recognition</b>
                <span className={`text-xs font-bold ${allGood ? "text-emerald-300" : recog.state === "fail" ? "text-rose-300" : "text-white/40"}`}>
                  {allGood ? "✓ Working" : recog.state === "fail" ? "✗ Problem" : ""}
                </span>
              </div>
              <p className="mt-1 text-sm">
                Press the button and say: <b className="text-amber-200">“{TEST_PHRASE}”</b>
              </p>
              <button
                onClick={recognitionTest}
                disabled={recog.state === "listening"}
                className="mt-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold disabled:opacity-60"
              >
                {recog.state === "listening" ? "🎙️ Listening…" : recog.state === "idle" ? "🎤 Test my voice" : "🎤 Test again"}
              </button>
              {recog.text && <p className="mt-2 text-sm">We heard: <i className="text-white/80">“{recog.text}”</i></p>}
              {recog.msg && <p className="mt-2 rounded-xl bg-rose-500/15 p-2 text-xs text-rose-200">{recog.msg}</p>}

              <div className="mt-3 rounded-xl bg-black/30 p-3 text-xs">
                <div className="font-bold text-white">Recognizer</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ENGINES.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => switchEngine(e.id)}
                      className={`rounded-lg px-2 py-2 font-bold ${engine === e.id ? "bg-emerald-400 text-black" : "bg-white/10"}`}
                    >
                      {e.label}
                      <span className="block text-[10px] font-normal opacity-70">{e.note}</span>
                    </button>
                  ))}
                </div>
                {isBuiltin(engine) && modelPct !== null && modelPct < 100 && modelPct >= 0 && (
                  <div className="mt-2">
                    <div className="text-white/60">
                      Downloading recognizer (one time, about {engine === "builtin-plus" ? "75" : "40"} MB)… {modelPct}%
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: `${modelPct}%` }} />
                    </div>
                  </div>
                )}
                {isBuiltin(engine) && modelPct === 100 && <div className="mt-2 text-emerald-300">✓ Built-in recognizer ready. Press Test my voice.</div>}
                {modelPct === -1 && <div className="mt-2 text-rose-300">Couldn&apos;t download the recognizer. Check your internet and try again.</div>}
              </div>
            </section>

            <details className="mt-4 rounded-2xl bg-black/30 p-3 text-xs leading-relaxed text-white/60">
              <summary className="cursor-pointer font-bold text-white">📶 Connect Bluetooth earbuds / headphones</summary>
              <p className="mt-2">Pair them once in your device settings. After that, the app finds them automatically every time they connect.</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li><b>Windows:</b> Settings → Bluetooth &amp; devices → Add device → Bluetooth. Then Settings → System → Sound: choose them for <b>Output</b> and <b>Input</b>.</li>
                <li><b>Mac:</b> System Settings → Bluetooth → Connect. Then Sound → Output and Input.</li>
                <li><b>iPhone / iPad:</b> Settings → Bluetooth → tap your earbuds.</li>
                <li><b>Android:</b> Settings → Connected devices → Pair new device.</li>
              </ul>
              <p className="mt-1">Tip: put the earbuds in pairing mode first (usually hold the case button).</p>
            </details>

            <div className="mt-3 rounded-2xl bg-black/30 p-3 text-xs leading-relaxed text-white/60">
              Voice recognition uses your device&apos;s <b>default</b> microphone
              {defaultIn?.label ? <> (now: <b>{defaultIn.label.replace(/^(Default|Communications) - /, "")}</b>)</> : null}. To use your earbuds:{" "}
              <b>Windows</b> Settings → Sound → Input · <b>Mac</b> System Settings → Sound → Input · <b>Phones</b> connect them, and they become the default automatically.
            </div>

            <div className="mt-4 grid gap-2">
              {gate ? (
                <>
                  <button onClick={() => close(true)} className={`btn-3d rounded-2xl py-3 font-black ${allGood ? "bg-gradient-to-r from-emerald-500 to-cyan-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-600"}`}>
                    {allGood ? "✅ All good: start practice" : "Start practice anyway"}
                  </button>
                  <button onClick={() => close(false)} className="rounded-2xl bg-white/10 py-2.5 text-sm font-bold">Cancel</button>
                </>
              ) : (
                <button onClick={() => close(false)} className="rounded-2xl bg-white/10 py-2.5 text-sm font-bold">Done</button>
              )}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
