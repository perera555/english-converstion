import type { Conversation, Level, Template } from "./types";

export const VARIANTS_PER_TEMPLATE = 25;

const NAMES = [
  "Maya", "Leo", "Aisha", "Ken", "Sofia", "Daniel", "Priya", "Omar", "Emma",
  "Lucas", "Yuki", "Carlos", "Nina", "Ravi", "Grace", "Tom", "Amara", "Hiro",
  "Elena", "Sam", "Zara", "Ben", "Lina", "Mateo", "Chloe", "Arjun", "Ivy",
  "Noah", "Fatima", "Jack",
];

function pickIndex(len: number, variant: number, slotIndex: number) {
  return (variant + Math.floor(variant / len) * (slotIndex + 1)) % len;
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function namesFor(templateIndex: number, variant: number): [string, string] {
  const nameA = NAMES[(variant + templateIndex * 3) % NAMES.length];
  let nameB = NAMES[(variant * 7 + templateIndex * 5 + 11) % NAMES.length];
  if (nameB === nameA) nameB = NAMES[(NAMES.indexOf(nameA) + 1) % NAMES.length];
  return [nameA, nameB];
}

/** Returns a function that fills {placeholders} for one variation of a template. */
export function makeFill(slots: Record<string, string[]>, variant: number, nameA: string, nameB: string) {
  const chosen: Record<string, { first: string[]; second: string[] }> = {};
  Object.keys(slots).forEach((key, k) => {
    const pool = slots[key];
    const idx = pickIndex(pool.length, variant, k);
    const idx2 = pool.length > 1 ? (idx + Math.max(1, Math.floor(pool.length / 2))) % pool.length : idx;
    chosen[key] = { first: pool[idx].split("|"), second: pool[idx2].split("|") };
  });
  // Run twice so slot values may themselves contain placeholders.
  const fill = (text: string): string => fillOnce(fillOnce(text));
  const fillOnce = (text: string) =>
    text.replace(/\{(\w+)(#2)?(?::(\d))?\}/g, (match, key: string, alt?: string, part?: string) => {
      if (key === "A") return nameA;
      if (key === "B") return nameB;
      const c = chosen[key];
      if (!c) return match;
      const parts = alt ? c.second : c.first;
      return parts[part ? Number(part) : 0] ?? parts[0];
    });
  const pick = (raw: string | string[]) => fill(Array.isArray(raw) ? raw[variant % raw.length] : raw);
  return { fill, pick };
}

export { capitalizeFirst };

function buildVariant(
  t: Template,
  templateIndex: number,
  variant: number,
): Omit<Conversation, "id" | "level"> {
  const [nameA, nameB] = namesFor(templateIndex, variant);
  const { fill, pick } = makeFill(t.slots, variant, nameA, nameB);

  const lines = t.lines.map(([speaker, raw]) => ({ speaker, text: capitalizeFirst(pick(raw)) }));

  return {
    topic: t.topic,
    emoji: t.emoji,
    title: capitalizeFirst(fill(t.title)),
    speakers: {
      A: { name: nameA, role: t.roles[0] },
      B: { name: nameB, role: t.roles[1] },
    },
    lines,
    vocab: t.vocab.map(([word, meaning]) => ({ word, meaning })),
    tip: t.tip,
  };
}

export function buildLevel(level: Level, templates: Template[], startId: number): Conversation[] {
  const out: Conversation[] = [];
  let id = startId;
  for (let v = 0; v < VARIANTS_PER_TEMPLATE; v++) {
    templates.forEach((t, ti) => {
      out.push({ id: id++, level, ...buildVariant(t, ti, v) });
    });
  }
  return out;
}
