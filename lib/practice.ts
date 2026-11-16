"use client";

import { useSyncExternalStore } from "react";

export const DAILY_GOAL_SECONDS = 15 * 60;
const KEY = "ec-practice-v1";

type Days = Record<string, number>;
let cache: Days | null = null;
const listeners = new Set<() => void>();
const EMPTY: Days = {};

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function read(): Days {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

export function addPracticeSeconds(sec: number) {
  const d = { ...read() };
  const k = todayKey();
  d[k] = (d[k] ?? 0) + sec;
  cache = d;
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const noop = () => () => {};
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export function usePractice() {
  const days = useSyncExternalStore(subscribe, read, () => EMPTY);
  const mounted = useMounted();
  if (!mounted) return { today: 0, streak: 0, week: [] as { key: string; label: string; sec: number }[], goalMet: false };
  const today = days[todayKey()] ?? 0;
  // Streak: consecutive days reaching the goal, ending today (or yesterday if today isn't done yet).
  let streak = 0;
  const d = new Date();
  if ((days[todayKey(d)] ?? 0) < DAILY_GOAL_SECONDS) d.setDate(d.getDate() - 1);
  while ((days[todayKey(d)] ?? 0) >= DAILY_GOAL_SECONDS) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const x = new Date();
    x.setDate(x.getDate() - (6 - i));
    return { key: todayKey(x), label: x.toLocaleDateString("en", { weekday: "narrow" }), sec: days[todayKey(x)] ?? 0 };
  });
  return { today, streak, week, goalMet: today >= DAILY_GOAL_SECONDS };
}

/* Activity signal: the timer only counts while something is playing, listening or being typed. */
let lastActive = 0;
export function pingActivity() {
  lastActive = Date.now();
}
export const isActive = () => Date.now() - lastActive < 3500;

/* Per-day flags: goal popup already shown, or the learner chose "done for today". */
const FLAG_KEY = "ec-practice-flags-v1";
type Flags = { seen?: string; done?: string };
function readFlags(): Flags {
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) || "{}");
  } catch {
    return {};
  }
}
export function getFlag(name: keyof Flags) {
  return readFlags()[name] === todayKey();
}
export function setFlag(name: keyof Flags, on = true) {
  const f = readFlags();
  if (on) f[name] = todayKey();
  else delete f[name];
  try {
    localStorage.setItem(FLAG_KEY, JSON.stringify(f));
  } catch {}
}

/** Milliseconds until local midnight, when a new 15-minute session starts. */
export function msUntilTomorrow() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
