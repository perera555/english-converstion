"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "ec-progress-v1";

export interface Progress {
  done: number[];
  best: Record<string, number>;
  /** how many times each item was completed from start to finish */
  count: Record<string, number>;
}

const EMPTY: Progress = { done: [], best: {}, count: {} };
let cache: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, count: {}, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(p: Progress) {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  /** Records one full completion; repeat reads are counted, not ignored. */
  const markDone = useCallback((id: number) => {
    const p = read();
    write({
      ...p,
      done: p.done.includes(id) ? p.done : [...p.done, id],
      count: { ...p.count, [id]: (p.count?.[id] ?? 0) + 1 },
    });
  }, []);

  const saveScore = useCallback((id: number, score: number) => {
    const p = read();
    if ((p.best[id] ?? -1) >= score) return;
    write({ ...p, best: { ...p.best, [id]: score } });
  }, []);

  const reset = useCallback(() => write(EMPTY), []);

  return { progress, markDone, saveScore, reset };
}
