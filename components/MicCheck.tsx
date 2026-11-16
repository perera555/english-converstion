"use client";

import { useEffect, useRef, useState } from "react";

const HEADSET = /headset|headphone|earbud|earphone|airpods|buds|bluetooth|hands-free|handsfree|jabra|bose|sony wh|sony wf|beats|galaxy buds|pixel buds/i;

/** Mic & headphones check: lists devices, live mic level meter, speaker test. */
export default function MicCheck() {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("default");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);

  const stopTest = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setTesting(false);
    setLevel(0);
  };

  const refresh = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setInputs(list.filter((d) => d.kind === "audioinput"));
      setOutputs(list.filter((d) => d.kind === "audiooutput"));
    } catch {}
  };

  const startTest = async (id = deviceId) => {
    stopTest();
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: id === "default" ? true : { deviceId: { exact: id } } });
      stream.current = s;
      setTesting(true);
      await refresh(); // labels appear after permission is granted
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setError("Microphone access was blocked or the device is unavailable. Allow the mic in your browser's address bar and try again.");
    }
  };

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const onChange = () => refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", onChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", onChange);
      stopTest();
    };
  }, [open]);

  const speakerTest = () => {
    const u = new SpeechSynthesisUtterance("Hello! If you can hear me in your headphones or earbuds, you're all set.");
    u.lang = "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const headsetIn = inputs.find((d) => HEADSET.test(d.label));
  const headsetOut = outputs.find((d) => HEADSET.test(d.label));
  const defaultIn = inputs.find((d) => d.deviceId === "default") ?? inputs[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
        title="Mic & headphones check"
      >
        🎧<span className="ml-1 hidden sm:inline">Mic check</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#12121f] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">🎧 Mic & headphones check</h3>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <p className="mt-1 text-sm text-white/60">
              Headphones, earbuds, AirPods and Bluetooth headsets all work. Connect them first, then test here.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className={`rounded-2xl p-3 ring-1 ${headsetIn ? "bg-emerald-500/15 ring-emerald-400/40" : "bg-white/5 ring-white/10"}`}>
                <div className="font-bold">🎙️ Headset mic</div>
                <div className="mt-1 text-white/60">{headsetIn ? headsetIn.label : testing ? "Not detected" : "Press Test mic"}</div>
              </div>
              <div className={`rounded-2xl p-3 ring-1 ${headsetOut ? "bg-emerald-500/15 ring-emerald-400/40" : "bg-white/5 ring-white/10"}`}>
                <div className="font-bold">🎧 Headphones</div>
                <div className="mt-1 text-white/60">{headsetOut ? headsetOut.label : testing ? "Not detected (or hidden by browser)" : "Press Test mic"}</div>
              </div>
            </div>

            <label className="mt-4 block text-xs text-white/60">
              Microphone to test
              <select
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  if (testing) startTest(e.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
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
            </label>

            <div className="mt-3">
              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500 transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
              </div>
              <div className="mt-1 text-xs text-white/50">{testing ? (level > 0.15 ? "✅ We can hear you!" : "Say something…") : "Mic level"}</div>
            </div>

            {error && <p className="mt-3 rounded-xl bg-rose-500/15 p-3 text-xs text-rose-200">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => (testing ? stopTest() : startTest())} className={`rounded-xl py-2.5 text-sm font-bold ${testing ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-600"}`}>
                {testing ? "■ Stop test" : "🎙️ Test mic"}
              </button>
              <button onClick={speakerTest} className="rounded-xl bg-white/10 py-2.5 text-sm font-bold hover:bg-white/15">
                🔊 Test sound
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-black/30 p-3 text-xs leading-relaxed text-white/65">
              <b className="text-white">Important:</b> voice scoring always uses your device&apos;s <b>default</b> microphone
              {defaultIn?.label ? (
                <>
                  {" "}(now: <b>{defaultIn.label.replace(/^Default - /, "")}</b>)
                </>
              ) : null}
              . To use your earbuds mic:
              <ul className="mt-1 list-disc pl-4">
                <li><b>Windows:</b> Settings → System → Sound → Input → choose your headset.</li>
                <li><b>Mac:</b> System Settings → Sound → Input → choose your headset.</li>
                <li><b>iPhone / Android:</b> connect the earbuds. They become the default automatically.</li>
              </ul>
              Tip: headphones stop the app&apos;s voice leaking into the mic, so your scores are more accurate.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
