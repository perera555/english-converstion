import type { Level } from "./types";

export const LEVELS: {
  id: Level;
  label: string;
  cefr: string;
  blurb: string;
  gradient: string;
  text: string;
  ring: string;
  chip: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    cefr: "A1",
    blurb: "Greetings, cafés, family, and short everyday sentences.",
    gradient: "from-emerald-400 to-teal-500",
    text: "text-emerald-300",
    ring: "ring-emerald-400/40",
    chip: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30",
  },
  {
    id: "elementary",
    label: "Elementary",
    cefr: "A2",
    blurb: "Hotels, doctors, trains, past tense, and making plans.",
    gradient: "from-sky-400 to-indigo-500",
    text: "text-sky-300",
    ring: "ring-sky-400/40",
    chip: "bg-sky-400/15 text-sky-200 ring-sky-400/30",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    cefr: "B1–B2",
    blurb: "Interviews, complaints, travel stories, and work life.",
    gradient: "from-amber-400 to-orange-500",
    text: "text-amber-300",
    ring: "ring-amber-400/40",
    chip: "bg-amber-400/15 text-amber-200 ring-amber-400/30",
  },
  {
    id: "advanced",
    label: "Advanced",
    cefr: "C1",
    blurb: "Negotiation, debate, leadership, and nuanced opinions.",
    gradient: "from-fuchsia-500 to-rose-500",
    text: "text-rose-300",
    ring: "ring-rose-400/40",
    chip: "bg-rose-400/15 text-rose-200 ring-rose-400/30",
  },
  {
    id: "native",
    label: "Native",
    cefr: "C2",
    blurb: "Real-life native English: slang, idioms, fast casual speech.",
    gradient: "from-yellow-300 via-amber-400 to-red-500",
    text: "text-yellow-300",
    ring: "ring-yellow-400/40",
    chip: "bg-yellow-400/15 text-yellow-200 ring-yellow-400/30",
  },
];

/** Rough practice time: listening + repeating at ~130 wpm, x2.2 for practice. */
export function estimateMinutes(words: number) {
  return Math.max(2, Math.round((words / 130) * 2.2));
}

export const levelMeta = (id: Level) => LEVELS.find((l) => l.id === id)!;
