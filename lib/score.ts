const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWord(n: number) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : "");
  return String(n);
}

export const normalize = (w: string) => {
  const s = w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, "");
  return /^\d{1,2}$/.test(s) ? numberWord(Number(s)) : s;
};

/** Edit distance, used to forgive small spelling differences from speech recognition. */
function distance(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function similar(a: string, b: string) {
  if (a === b) return true;
  const strip = (x: string) => x.replace(/'/g, "");
  if (strip(a) === strip(b)) return true;
  if (a.length >= 7) return distance(a, b) <= 2;
  if (a.length >= 4) return distance(a, b) <= 1;
  return false;
}

export function tokenize(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Compares what the learner said with the target sentence using a
 * longest-common-subsequence match. Returns one hit flag per word of
 * tokenize(target) and a 0–100 score.
 */
export function scoreSpeech(target: string, spoken: string, opts: { fuzzy?: "all" | "names" } = {}) {
  const raw = tokenize(target);
  const words = raw.map(normalize);
  const idx = words.map((w, i) => (w ? i : -1)).filter((i) => i >= 0);
  const t = idx.map((i) => words[i]);
  // In "names" mode only capitalized words (names) get fuzzy matching, so sound drills stay strict.
  const fuzzyAt = idx.map((i) => opts.fuzzy !== "names" || /^[A-Z]/.test(raw[i]));
  const same = (a: string, b: string, k: number) => (fuzzyAt[k] ? similar(a, b) : a === b || a.replace(/'/g, "") === b.replace(/'/g, ""));
  const s = tokenize(spoken).map(normalize).filter(Boolean);
  const dp: number[][] = Array.from({ length: t.length + 1 }, () => Array(s.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) {
    for (let j = s.length - 1; j >= 0; j--) {
      dp[i][j] = same(t[i], s[j], i) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const hits: boolean[] = words.map((w) => !w);
  let i = 0;
  let j = 0;
  let matched = 0;
  while (i < t.length && j < s.length) {
    if (same(t[i], s[j], i)) {
      hits[idx[i]] = true;
      matched++;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { hits, score: t.length ? Math.round((matched / t.length) * 100) : 0 };
}
