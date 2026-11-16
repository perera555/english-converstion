import { buildLevel, VARIANTS_PER_TEMPLATE } from "./engine";
import { beginner } from "./templates/beginner";
import { elementary } from "./templates/elementary";
import { intermediate } from "./templates/intermediate";
import { advanced } from "./templates/advanced";
import { native } from "./templates/native";
import { estimateMinutes } from "./levels";
import type { Conversation, ConversationSummary, Level, Template } from "./types";

const ORDER: [Level, Template[]][] = [
  ["beginner", beginner],
  ["elementary", elementary],
  ["intermediate", intermediate],
  ["advanced", advanced],
  ["native", native],
];

function buildAll(): Conversation[] {
  const all: Conversation[] = [];
  for (const [level, templates] of ORDER) {
    all.push(...buildLevel(level, templates, all.length + 1));
  }
  return all;
}

export const conversations: Conversation[] = buildAll();
export const TOTAL = conversations.length;
export const PER_TEMPLATE = VARIANTS_PER_TEMPLATE;

export function getConversation(id: number): Conversation | undefined {
  return conversations[id - 1];
}

export function getSummaries(): ConversationSummary[] {
  return conversations.map((c) => ({
    id: c.id,
    level: c.level,
    topic: c.topic,
    emoji: c.emoji,
    title: c.title,
    a: c.speakers.A.name,
    b: c.speakers.B.name,
    lines: c.lines.length,
    minutes: estimateMinutes(c.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0)),
  }));
}
