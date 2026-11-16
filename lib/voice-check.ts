"use client";

/**
 * Pre-flight check before voice practice. Call `requestVoiceCheck()` before listening:
 * the first time in a session it opens the check dialog (headphones → mic → recognition test)
 * and resolves true when the learner presses Start, or false if they close it.
 */
const KEY = "ec-voice-ok";

export function voiceCheckPassed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markVoiceCheckPassed() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function requestVoiceCheck(): Promise<boolean> {
  if (typeof window === "undefined" || voiceCheckPassed()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onDone = (e: Event) => {
      window.removeEventListener("voice-check-done", onDone);
      resolve((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener("voice-check-done", onDone);
    window.dispatchEvent(new CustomEvent("open-voice-check"));
  });
}

export function finishVoiceCheck(ok: boolean) {
  if (ok) markVoiceCheckPassed();
  window.dispatchEvent(new CustomEvent("voice-check-done", { detail: ok }));
}
