export type Level = "beginner" | "elementary" | "intermediate" | "advanced" | "native";
export type Speaker = "A" | "B";

export interface Line {
  speaker: Speaker;
  text: string;
}

export interface Vocab {
  word: string;
  meaning: string;
}

export interface Conversation {
  id: number;
  level: Level;
  topic: string;
  emoji: string;
  title: string;
  speakers: Record<Speaker, { name: string; role: string }>;
  lines: Line[];
  vocab: Vocab[];
  tip: string;
}

/** Lightweight info used by the library grid (keeps the client bundle small). */
export interface ConversationSummary {
  id: number;
  level: Level;
  topic: string;
  emoji: string;
  title: string;
  a: string;
  b: string;
  lines: number;
  minutes: number;
}

/**
 * A scenario template. Text may contain placeholders:
 *   {A} / {B}          speaker names
 *   {slot}             first part of the chosen slot value
 *   {slot:1}           second part (values are split on "|")
 *   {slot#2}           a *different* value from the same pool
 *   {slot#2:1}         second part of that different value
 * A line given as an array picks one alternative per variation (aligned
 * across lines, so alternatives at the same position belong together).
 */
export interface Template {
  key: string;
  topic: string;
  emoji: string;
  title: string;
  roles: [string, string];
  slots: Record<string, string[]>;
  lines: [Speaker, string | string[]][];
  vocab: [string, string][];
  tip: string;
}
