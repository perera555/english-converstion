"use client";

import { useEffect, useState } from "react";
import { getMicDevice } from "@/lib/whisper";

const HEADSET =
  /headset|headphone|earbud|earphone|airpods|buds|bluetooth|hands-?free|usb|wired|external|jack|logitech|hyperx|razer|steelseries|corsair|jabra|plantronics|poly|sennheiser|jbl|bose|sony|beats|anker|soundcore|boat|skullcandy|edifier/i;
const clean = (l: string) => l.replace(/^(Default|Communications) - /, "");

/** Shows the microphone and headphones the app will use, updating when devices change. */
export default function DeviceBar() {
  const [mic, setMic] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const load = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const chosen = getMicDevice();
        const ins = list.filter((d) => d.kind === "audioinput");
        const outs = list.filter((d) => d.kind === "audiooutput");
        const m = ins.find((d) => d.deviceId === chosen) ?? ins.find((d) => d.deviceId === "default") ?? ins[0];
        const o = outs.find((d) => d.deviceId === "default") ?? outs[0];
        setMic(m ? clean(m.label) || "Microphone (name hidden until mic access is allowed)" : "No microphone found");
        setOut(o ? clean(o.label) || "Speakers" : null);
      } catch {}
    };
    load();
    navigator.mediaDevices.addEventListener?.("devicechange", load);
    const t = setInterval(load, 5000); // picks up a new mic choice from Mic check
    return () => {
      navigator.mediaDevices.removeEventListener?.("devicechange", load);
      clearInterval(t);
    };
  }, []);

  if (mic === null) return null;
  return (
    <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${HEADSET.test(mic) ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" : "bg-white/5 text-white/75 ring-white/10"}`}>
        🎙️ Mic: {mic}
      </span>
      {out && (
        <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${HEADSET.test(out) ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" : "bg-white/5 text-white/75 ring-white/10"}`}>
          {HEADSET.test(out) ? "🎧" : "🔊"} Sound: {out}
        </span>
      )}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-mic-check"))}
        className="rounded-full bg-white/10 px-2.5 py-1 font-bold hover:bg-white/20"
      >
        Change / test
      </button>
    </div>
  );
}
