"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "macSafari" | "desktop";

const LABEL: Record<Platform, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  macSafari: "Mac (Safari)",
  desktop: "Windows / Mac / Chromebook (Chrome or Edge)",
};

const STEPS: Record<Platform, string[]> = {
  ios: ["Open this site in <b>Safari</b>", "Tap the <b>Share</b> button (square with arrow)", "Tap <b>Add to Home Screen</b>, then <b>Add</b>"],
  android: ["Open this site in <b>Chrome</b>", "Tap the menu <b>⋮</b>", "Tap <b>Install app</b> (or <b>Add to Home screen</b>)"],
  macSafari: ["Open the <b>File</b> menu in Safari", "Choose <b>Add to Dock…</b>", "Click <b>Add</b>"],
  desktop: ["Open this site in <b>Chrome</b> or <b>Edge</b>", "Click the <b>install icon</b> at the right of the address bar (or menu ⋮ → <b>Install SpeakUp</b>)", "Click <b>Install</b>. It opens like a normal app"],
};

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // updateViaCache "none" makes sure everyone gets the fixed worker right away.
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
    }
    const ua = navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const p: Platform = iOS
      ? "ios"
      : /android/i.test(ua)
        ? "android"
        : /macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|edg/i.test(ua)
          ? "macSafari"
          : "desktop";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(p);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
        ✓ App installed
      </span>
    );
  }

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      setHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105"
      >
        <span className="absolute inset-0 -translate-x-full bg-white/25 transition duration-700 group-hover:translate-x-full" />
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" />
        </svg>
        Install app
      </button>

      {help && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setHelp(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#12121f] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Install SpeakUp (free)</h3>
            <p className="mt-1 text-xs text-white/50">Works on Windows, Mac, iPhone, iPad, Android and Chromebook.</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-white/80">
              {STEPS[platform].map((s, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ol>
            <details className="mt-4 text-xs text-white/60">
              <summary className="cursor-pointer">Other devices</summary>
              <div className="mt-2 space-y-2">
                {(Object.keys(STEPS) as Platform[])
                  .filter((p) => p !== platform)
                  .map((p) => (
                    <div key={p}>
                      <b>{LABEL[p]}:</b> <span dangerouslySetInnerHTML={{ __html: STEPS[p].join(" → ") }} />
                    </div>
                  ))}
              </div>
            </details>
            <button onClick={() => setHelp(false)} className="mt-5 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold hover:bg-white/15">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
