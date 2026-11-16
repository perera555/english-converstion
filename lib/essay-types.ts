import type { Level, Vocab } from "./types";

export interface Essay {
  id: number;
  level: Level;
  topic: string;
  emoji: string;
  title: string;
  author: string;
  /** paragraphs → sentences */
  paragraphs: string[][];
  vocab: Vocab[];
  tip: string;
  words: number;
}

export interface EssaySummary {
  id: number;
  level: Level;
  topic: string;
  emoji: string;
  title: string;
  author: string;
  words: number;
  minutes: number;
  preview: string;
}

/** Placeholders work like conversation templates; {A} is the author's name. */
export interface EssayTemplate {
  key: string;
  topic: string;
  emoji: string;
  title: string;
  slots: Record<string, string[]>;
  paragraphs: (string | string[])[][];
  vocab: [string, string][];
  tip: string;
}
