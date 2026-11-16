import { capitalizeFirst, makeFill, namesFor, VARIANTS_PER_TEMPLATE } from "./engine";
import type { Essay, EssaySummary, EssayTemplate } from "./essay-types";
import { estimateMinutes } from "./levels";
import type { Level } from "./types";
import { beginnerEssays } from "./essays/beginner";
import { elementaryEssays } from "./essays/elementary";
import { intermediateEssays } from "./essays/intermediate";
import { advancedEssays } from "./essays/advanced";
import { nativeEssays } from "./essays/native";

const ORDER: [Level, EssayTemplate[]][] = [
  ["beginner", beginnerEssays],
  ["elementary", elementaryEssays],
  ["intermediate", intermediateEssays],
  ["advanced", advancedEssays],
  ["native", nativeEssays],
];

// 5 openers × 5 closers = 25 combinations, one per variation, so every essay is unique.
const FRAMES: Record<Level, { open: string[]; close: string[] }> = {
  beginner: {
    open: ["Hello everyone!", "Hi! Today I want to write about this.", "This is my short essay.", "Let me tell you something about my life.", "I like writing about this topic."],
    close: ["Thank you for reading!", "That is all for today.", "I hope you liked my essay.", "Goodbye for now!", "Thanks for reading my story."],
  },
  elementary: {
    open: ["I want to share something with you.", "Here is something important to me.", "Let me tell you about something special.", "This topic means a lot to me.", "I often think about this."],
    close: ["Thank you for reading.", "I hope you enjoyed it.", "What about you?", "Maybe you have a similar story.", "I hope you have something like this too."],
  },
  intermediate: {
    open: ["This is a topic that many people have strong opinions about.", "It's a question I have been thinking about recently.", "This issue affects almost everyone in some way.", "Let me explain my point of view.", "There is a lot to say about this subject."],
    close: ["What do you think?", "I'd love to hear other opinions on this.", "It's worth thinking about.", "Everyone should decide for themselves.", "This is just my opinion, of course."],
  },
  advanced: {
    open: ["The debate surrounding this issue is far from settled.", "This question deserves more careful attention than it usually receives.", "It is a subject on which reasonable people disagree.", "Few issues reveal our priorities as clearly as this one.", "This essay examines both sides of the argument."],
    close: ["The stakes could hardly be higher.", "How we answer will shape the decades to come.", "It is a conversation worth continuing.", "The choice, ultimately, is ours.", "Only time will tell which view prevails."],
  },
  native: {
    open: ["Alright, let's talk about this.", "Real talk for a second.", "Buckle up, this one's a ride.", "Story time!", "Okay, hear me out."],
    close: ["Anyway, that's my two cents.", "Anyway, rant over.", "Let me know if you can relate.", "Just saying.", "Catch you in the next one!"],
  },
};

function buildAll(): Essay[] {
  const out: Essay[] = [];
  for (const [level, templates] of ORDER) {
    for (let v = 0; v < VARIANTS_PER_TEMPLATE; v++) {
      templates.forEach((t, ti) => {
        const [author] = namesFor(ti + 7, v);
        const { fill, pick } = makeFill(t.slots, v, author, author);
        const paragraphs = t.paragraphs.map((p) => p.map((s) => capitalizeFirst(pick(s))));
        const f = FRAMES[level];
        paragraphs[0].unshift(f.open[(v + ti) % 5]);
        paragraphs[paragraphs.length - 1].push(f.close[(Math.floor(v / 5) + ti) % 5]);
        const words = paragraphs.flat().join(" ").split(/\s+/).length;
        out.push({
          id: out.length + 1,
          level,
          topic: t.topic,
          emoji: t.emoji,
          title: capitalizeFirst(fill(t.title)),
          author,
          paragraphs,
          vocab: t.vocab.map(([word, meaning]) => ({ word, meaning })),
          tip: t.tip,
          words,
        });
      });
    }
  }
  return out;
}

export const essays: Essay[] = buildAll();
export const ESSAY_TOTAL = essays.length;

export const getEssay = (id: number) => essays[id - 1];

export function getEssaySummaries(): EssaySummary[] {
  return essays.map((e) => ({
    id: e.id,
    level: e.level,
    topic: e.topic,
    emoji: e.emoji,
    title: e.title,
    author: e.author,
    words: e.words,
    minutes: estimateMinutes(e.words),
    preview: e.paragraphs[0].join(" ").slice(0, 120),
  }));
}
