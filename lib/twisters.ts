import type { Level } from "./types";

export interface Twister {
  id: number;
  chapter: number;
  index: number;
  text: string;
  boss: boolean;
}

export interface Chapter {
  n: number;
  title: string;
  sound: string;
  icon: string;
  level: Level;
  threshold: number;
  first: number; // id of first twister
  count: number;
}

interface Pool {
  names: string[];
  adj: string[];
  nouns: string[];
  verbs: string[]; // "base|third-person"
  places: string[];
  nums?: string[];
}

const P: Record<string, Pool> = {
  S: {
    names: ["Sally", "Sam", "Simon", "Susie", "Sid", "Sarah"],
    adj: ["silly", "sunny", "sweet", "sleepy", "salty", "slippery", "speedy", "sour"],
    nouns: ["seals", "socks", "snakes", "sandwiches", "sausages", "snails", "sailors", "spoons"],
    verbs: ["sell|sells", "slice|slices", "sort|sorts", "sew|sews", "spot|spots", "sip|sips"],
    places: ["by the seaside", "in the sunny square", "at the station", "on the slippery stairs"],
    nums: ["six", "seven", "sixteen", "seventy"],
  },
  SH: {
    names: ["Shelly", "Sharon", "Shane", "Sheila", "Shawn"],
    adj: ["shiny", "shabby", "shy", "short", "sharp", "shaky"],
    nouns: ["sheep", "shells", "shoes", "shirts", "sharks", "ships", "shelves"],
    verbs: ["shake|shakes", "share|shares", "shine|shines", "shove|shoves", "ship|ships", "shop for|shops for"],
    places: ["in the shop", "on the shore", "in the shed", "under the shower"],
  },
  P: {
    names: ["Peter", "Polly", "Paula", "Paul", "Penny"],
    adj: ["purple", "pink", "plump", "polite", "perfect", "pickled", "prickly"],
    nouns: ["peppers", "pickles", "puppies", "parrots", "pancakes", "pears", "penguins", "pirates"],
    verbs: ["pick|picks", "pack|packs", "paint|paints", "pass|passes", "pinch|pinches", "prepare|prepares"],
    places: ["in the park", "at the party", "on the patio", "by the pond"],
  },
  B: {
    names: ["Betty", "Bob", "Bella", "Billy", "Bonnie"],
    adj: ["big", "brown", "bouncy", "brave", "bright", "bubbly", "busy"],
    nouns: ["bears", "bees", "bananas", "buttons", "bubbles", "bugs", "boats", "biscuits"],
    verbs: ["buy|buys", "bake|bakes", "bring|brings", "bounce|bounces", "borrow|borrows", "brush|brushes"],
    places: ["by the beach", "in the barn", "on the bus", "behind the bakery"],
  },
  F: {
    names: ["Fred", "Fiona", "Felix", "Fay", "Frank"],
    adj: ["funny", "fluffy", "fancy", "fresh", "fast", "fine", "friendly"],
    nouns: ["frogs", "fish", "fries", "feathers", "flowers", "foxes", "flags"],
    verbs: ["find|finds", "fix|fixes", "feed|feeds", "fold|folds", "fry|fries", "flip|flips"],
    places: ["in the forest", "on the farm", "at the fair", "by the fountain"],
    nums: ["four", "five", "fourteen", "fifty"],
  },
  V: {
    names: ["Vincent", "Victor", "Vera", "Violet", "Valerie"],
    adj: ["violet", "velvet", "vast", "vivid", "valuable", "vintage", "very vain"],
    nouns: ["vans", "vases", "violins", "vegetables", "vests", "vines", "vultures"],
    verbs: ["view|views", "value|values", "visit|visits", "varnish|varnishes", "deliver|delivers", "save|saves"],
    places: ["in the valley", "at the village", "in the vineyard", "by the volcano"],
    nums: ["five", "seven", "eleven", "seventy"],
  },
  W: {
    names: ["William", "Wendy", "Walter", "Willow", "Wes"],
    adj: ["wet", "wild", "wise", "woolly", "wobbly", "wonderful", "wiggly"],
    nouns: ["whales", "wolves", "worms", "wagons", "windows", "walnuts", "watches"],
    verbs: ["wash|washes", "weigh|weighs", "wear|wears", "want|wants", "wrap|wraps", "watch|watches"],
    places: ["in the woods", "by the water", "at the window", "on the wall"],
  },
  R: {
    names: ["Rita", "Rob", "Ruby", "Ray", "Rosie"],
    adj: ["red", "round", "rusty", "rich", "rare", "rapid", "royal"],
    nouns: ["rabbits", "rings", "roses", "rockets", "robots", "raccoons", "rafts"],
    verbs: ["race|races", "rescue|rescues", "repair|repairs", "roll|rolls", "rub|rubs", "rent|rents"],
    places: ["on the river", "in the rain", "around the rocks", "on the roof"],
  },
  L: {
    names: ["Lily", "Larry", "Lucy", "Leo", "Lola"],
    adj: ["lazy", "little", "lovely", "lucky", "lonely", "loud", "lemon"],
    nouns: ["lions", "lambs", "lemons", "ladders", "lamps", "leaves", "lizards"],
    verbs: ["lick|licks", "lift|lifts", "like|likes", "lend|lends", "load|loads", "lose|loses"],
    places: ["by the lake", "on the lawn", "at the library", "along the lane"],
  },
  TH: {
    names: ["Theo", "Thelma", "Theodore", "Thor", "Thea"],
    adj: ["thick", "thin", "thirsty", "thoughtful", "thrifty", "thorny"],
    nouns: ["thimbles", "thistles", "thermoses", "thrones", "thumbtacks", "thinkers", "threads"],
    verbs: ["thank|thanks", "throw|throws", "thread|threads", "thump|thumps", "think about|thinks about"],
    places: ["on Thursday", "through the thicket", "at the theater", "in the north"],
    nums: ["three", "thirteen", "thirty", "thirty-three"],
  },
  DH: {
    names: ["Father", "Mother", "Heather", "Brother"],
    adj: ["smooth", "soothing", "leather", "feathery", "northern", "southern"],
    nouns: ["feathers", "brothers", "clothes", "mothers", "weathervanes"],
    verbs: ["bathe|bathes", "gather|gathers", "smooth|smooths", "soothe|soothes", "bother|bothers"],
    places: ["over there", "together", "with the others", "in this weather"],
  },
  CH: {
    names: ["Charlie", "Chelsea", "Chuck", "Cheryl", "Chad"],
    adj: ["cheap", "cheerful", "chubby", "chilly", "chewy", "chocolate"],
    nouns: ["cherries", "chickens", "cheeses", "chairs", "chips", "chipmunks"],
    verbs: ["chew|chews", "chase|chases", "chop|chops", "choose|chooses", "check|checks", "cheer for|cheers for"],
    places: ["in the kitchen", "at the church", "on the chair", "at the beach"],
  },
  J: {
    names: ["Jack", "Jenny", "Jake", "Julia", "Jasper"],
    adj: ["jolly", "juicy", "jumpy", "giant", "jealous", "jazzy", "gentle"],
    nouns: ["jugglers", "jellies", "jackets", "jars", "giraffes", "jets", "jewels"],
    verbs: ["juggle|juggles", "judge|judges", "join|joins", "jiggle|jiggles", "jog with|jogs with"],
    places: ["in the jungle", "at the gym", "in January", "in the garage"],
  },
  K: {
    names: ["Kate", "Kevin", "Kim", "Carl", "Cora"],
    adj: ["crunchy", "crooked", "curious", "clever", "clumsy", "cozy", "cool"],
    nouns: ["cats", "kites", "cookies", "crabs", "candles", "crowns", "coconuts", "kangaroos"],
    verbs: ["cook|cooks", "catch|catches", "carry|carries", "count|counts", "kick|kicks", "collect|collects"],
    places: ["in the kitchen", "at the castle", "on the coast", "by the creek"],
  },
  MN: {
    names: ["Molly", "Max", "Nina", "Ned", "Mona"],
    adj: ["noisy", "nimble", "merry", "mini", "magic", "nervous", "muddy"],
    nouns: ["mice", "monkeys", "muffins", "nuts", "nests", "melons", "mittens", "noodles"],
    verbs: ["nibble|nibbles", "mix|mixes", "move|moves", "mend|mends", "munch|munches", "name|names"],
    places: ["at night", "in the morning", "near the mountain", "in the meadow"],
    nums: ["nine", "nineteen", "ninety", "many"],
  },
};

const LEVEL_ORDER: Level[] = ["beginner", "elementary", "intermediate", "advanced", "native"];
const THRESHOLD = [70, 75, 80, 85, 90];

const CHAPTERS: { title: string; sound: string; icon: string; pools: string[]; boss: string }[] = [
  { title: "Super S", sound: "S", icon: "🐍", pools: ["S"], boss: "Six slippery snails slid slowly seaward." },
  { title: "Shhh!", sound: "SH", icon: "🐚", pools: ["SH"], boss: "Shy Shelly says she shall sew sheets." },
  { title: "S or SH?", sound: "S / SH", icon: "🌊", pools: ["S", "SH"], boss: "She sells seashells by the seashore." },
  { title: "Popping P", sound: "P", icon: "🌶️", pools: ["P"], boss: "Peter Piper picked a peck of pickled peppers." },
  { title: "Bouncing B", sound: "B", icon: "🐻", pools: ["B"], boss: "Betty Botter bought some butter, but she said the butter's bitter." },
  { title: "P or B?", sound: "P / B", icon: "🫧", pools: ["P", "B"], boss: "A big black bug bit a big black bear, and the big black bear bled blood." },
  { title: "Fun F", sound: "F", icon: "🐸", pools: ["F"], boss: "Fred fed Ted bread, and Ted fed Fred bread." },
  { title: "Vivid V", sound: "V", icon: "🎻", pools: ["V"], boss: "Vincent vowed vengeance very vehemently." },
  { title: "Wild W", sound: "W", icon: "🪵", pools: ["W"], boss: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?" },
  { title: "V or W?", sound: "V / W", icon: "🌀", pools: ["V", "W"], boss: "Which witch switched the Swiss wristwatches?" },
  { title: "Rolling R", sound: "R", icon: "🐇", pools: ["R"], boss: "Truly rural, truly rural, truly rural." },
  { title: "Lovely L", sound: "L", icon: "🦁", pools: ["L"], boss: "Lesser leather never weathered wetter weather better." },
  { title: "R or L?", sound: "R / L", icon: "🚚", pools: ["R", "L"], boss: "Red lorry, yellow lorry, red lorry, yellow lorry." },
  { title: "Thinking TH", sound: "TH (think)", icon: "🤔", pools: ["TH"], boss: "The thirty-three thieves thought that they thrilled the throne throughout Thursday." },
  { title: "Smooth TH", sound: "TH (this)", icon: "🪶", pools: ["DH"], boss: "The father, the mother and the brother gathered together over there." },
  { title: "Cheery CH", sound: "CH", icon: "🍒", pools: ["CH"], boss: "Cheryl's cheap chip shop sells cheap chips." },
  { title: "Jazzy J", sound: "J", icon: "🤹", pools: ["J"], boss: "Jolly juggling jesters jauntily juggle jingling jugs." },
  { title: "Crunchy K", sound: "K / C", icon: "🥥", pools: ["K"], boss: "Can you can a can as a canner can can a can?" },
  { title: "M & N", sound: "M / N", icon: "🐭", pools: ["MN"], boss: "Unique New York, unique New York, you know you need unique New York." },
  { title: "Master Mix", sound: "Everything", icon: "👑", pools: Object.keys(P), boss: "Irish wristwatch, Swiss wristwatch, Irish wristwatch, Swiss wristwatch." },
];

export const PER_CHAPTER = 50;
const DEFAULT_NUMS = ["two", "three", "four", "five", "six", "seven", "eight", "ten", "twelve"];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function generateChapter(c: (typeof CHAPTERS)[number], chapterIdx: number): string[] {
  const levelIdx = Math.floor(chapterIdx / 4);
  const r = rng(chapterIdx * 7919 + 17);
  const one = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const pool = () => P[one(c.pools)];
  const verb = () => one(pool().verbs).split("|");
  const nums = () => {
    const p = pool();
    return one(p.nums ?? DEFAULT_NUMS);
  };
  const patterns: (() => string)[] = [
    () => `${one(pool().names)} ${verb()[1]} ${one(pool().nouns)}.`,
    () => `${one(pool().names)} ${verb()[1]} ${one(pool().adj)} ${one(pool().nouns)}.`,
    () => `${one(pool().names)} ${verb()[1]} ${nums()} ${one(pool().adj)} ${one(pool().nouns)} ${one(pool().places)}.`,
    () => {
      const [a1, n1, a2, n2] = [one(pool().adj), one(pool().nouns), one(pool().adj), one(pool().nouns)];
      return `${cap(a1)} ${n1} ${verb()[0]} ${a2} ${n2}, and ${a2} ${n2} ${verb()[0]} ${a1} ${n1}.`;
    },
    () => {
      const name = one(pool().names);
      const [base, third] = verb();
      const [a, n] = [one(pool().adj), one(pool().nouns)];
      return `If ${name} ${third} ${a} ${n}, how many ${a} ${n} does ${name} ${base}?`;
    },
    () =>
      `${one(pool().names)} ${verb()[1]} ${one(pool().adj)} ${one(pool().nouns)} ${one(pool().places)}, but ${one(pool().names)} ${verb()[1]} ${one(pool().adj)} ${one(pool().nouns)} ${one(pool().places)}.`,
    () => {
      const [a1, n1, a2, n2] = [one(pool().adj), one(pool().nouns), one(pool().adj), one(pool().nouns)];
      return `${one(pool().names)}'s ${a1} ${n1} ${verb()[0]} ${a2} ${n2} ${one(pool().places)}, while ${one(pool().names)}'s ${a2} ${n2} ${verb()[0]} ${a1} ${n1}.`;
    },
  ];
  const tiers = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]][levelIdx];
  const out: string[] = [];
  const seen = new Set<string>([c.boss]);
  let guard = 0;
  while (out.length < PER_CHAPTER - 1 && guard++ < 5000) {
    const tier = tiers[Math.min(2, Math.floor((out.length / (PER_CHAPTER - 1)) * 3))];
    const s = patterns[tier]();
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  out.push(c.boss);
  return out;
}

function buildAll() {
  const chapters: Chapter[] = [];
  const twisters: Twister[] = [];
  CHAPTERS.forEach((c, ci) => {
    const texts = generateChapter(c, ci);
    const levelIdx = Math.floor(ci / 4);
    chapters.push({
      n: ci + 1,
      title: c.title,
      sound: c.sound,
      icon: c.icon,
      level: LEVEL_ORDER[levelIdx],
      threshold: THRESHOLD[levelIdx],
      first: twisters.length + 1,
      count: texts.length,
    });
    texts.forEach((text, i) =>
      twisters.push({ id: twisters.length + 1, chapter: ci + 1, index: i, text, boss: i === texts.length - 1 }),
    );
  });
  return { chapters, twisters };
}

export const { chapters, twisters } = buildAll();
