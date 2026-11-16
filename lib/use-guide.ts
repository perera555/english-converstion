"use client";

import { useEffect, useState } from "react";

/**
 * Karaoke read-along guide for the learner's turn: returns the index of the word to say now,
 * advancing at a natural pace (same timing as the app's voice). Independent of recognition,
 * so the highlight works even when the recognizer hears nothing.
 */
export function useReadAlong(active: boolean, words: string[], rate = 0.85) {
  const [idx, setIdx] = useState(-1);
  const key = words.join(" ");
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdx(-1);
      return;
    }
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      setIdx(i);
      if (i >= words.length) return;
      const ms = (words[i].replace(/[^\w]/g, "").length * 62 + 170) / rate;
      i++;
      t = setTimeout(step, ms);
    };
    t = setTimeout(step, 450); // short lead-in after pressing the button
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key, rate]);
  return idx;
}
