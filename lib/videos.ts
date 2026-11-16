/**
 * Real, human-presented YouTube lessons per topic. Every id was checked
 * against YouTube's oEmbed endpoint (exists, public, embeddable, landscape).
 */
export interface RealVideo {
  id: string;
  title: string;
  channel: string;
}

const NATIVE: RealVideo[] = [
  { id: "jBUSWWM0JO4", title: "REAL English Conversation | FAST English!", channel: "Rachel's English" },
  { id: "6PJnEdbq8qc", title: "English Listening Practice #1: Real Native Conversation (B2–C1)", channel: "Smashing English!" },
  { id: "nso-hg7lRYg", title: "When native speakers speak English quickly…", channel: "Griffin English" },
  { id: "AOKmxU4820c", title: "American Slang Explained: Speak Like an American", channel: "Next English Level" },
  { id: "Kl9DRSS5SJQ", title: "Advanced English Listening Practice at Native Speed", channel: "EnglishAnyone" },
];

const SMALL_TALK: RealVideo[] = [
  { id: "rn1fkb1sMow", title: "Making Natural Small Talk with a Taxi Driver", channel: "My English Convo" },
  { id: "ouz3qGyOMV8", title: "Small Talk Tip: How To Introduce Yourself To Someone New", channel: "mmmEnglish" },
  { id: "jBUSWWM0JO4", title: "REAL English Conversation | FAST English!", channel: "Rachel's English" },
];

export const VIDEOS: Record<string, RealVideo[]> = {
  Greetings: [
    { id: "I_tRSrPru94", title: "How to introduce yourself: Easy English Conversations", channel: "BBC Learning English" },
    { id: "HooNbcbgi9U", title: "Meeting new people: what to say in English", channel: "British Council" },
    { id: "ouz3qGyOMV8", title: "How To Introduce Yourself To Someone New", channel: "mmmEnglish" },
  ],
  "Food & Drink": [
    { id: "KfjFLpjyCV4", title: "How to Order in a Restaurant in English (4 Restaurants!)", channel: "Smashing English!" },
    { id: "-OpToxW8-vk", title: "Order coffee and lunch: Conversation", channel: "SVC English" },
    { id: "bgfdqVmVjfk", title: "At the Restaurant Conversation", channel: "Easy English" },
  ],
  Family: [
    { id: "O3h7bUFrP0Q", title: "Real English Conversation: Talking about FAMILY", channel: "English with Emma · engVid" },
    { id: "Lt-oMp16iJY", title: "Family Conversation: English Conversation Practice", channel: "EverydayEnglish" },
    { id: "gP-aBVNZ4Ho", title: "Let's Talk About Family in English", channel: "Mr. English Channel" },
  ],
  Shopping: [
    { id: "kdQYKdbAiFs", title: "5-Minute English Conversation Practice: Shopping for clothes", channel: "English Together" },
    { id: "xowuC3keDcA", title: "Clothes shopping conversation in English", channel: "SpeakEasy Learn English" },
    { id: "VfBpGb2Q9kQ", title: "Shopping for Clothes: Simple English Conversation", channel: "Everyday English Lab" },
  ],
  Directions: [
    { id: "SHXPpsIJTb0", title: "Asking for and giving directions: Easy English Conversations", channel: "BBC Learning English" },
    { id: "Lms1qBpfYIM", title: "Asking for Directions: Everyday English Dialogues", channel: "Ellii" },
    { id: "DPYJQSA-x50", title: "Asking for and Giving Directions", channel: "Easy English" },
  ],
  "Daily Life": [
    { id: "bq6GBbh3uhU", title: "How to talk about your daily routine", channel: "BBC Learning English" },
    { id: "2e19gyP3ckY", title: "Talk About Daily Life in English", channel: "Mr. English Channel" },
    { id: "reKgQh0E9kg", title: "My Daily Routine: Easy English Listening Practice (A2)", channel: "English Phrases Hub" },
  ],
  Weather: [
    { id: "sMg4vj6ugSs", title: "Describing the weather where you are", channel: "BBC Learning English" },
    { id: "1MEQAQqCWoQ", title: "What's The Weather Like Today? English Conversation", channel: "Learn English with Jessica" },
    { id: "JqmXs7Uq-Gc", title: "Talking About the Weather: Easy English Dialogue", channel: "One Cup Of English" },
  ],
  Hobbies: [
    { id: "hoyhPZDp3dE", title: "How to Talk About Your Free Time and Hobbies in English", channel: "Oxford Online English" },
    { id: "z595z_DmpmQ", title: "Talking about Hobbies and Free Time Activities", channel: "Easy English" },
    { id: "0AIlXB2XNBM", title: "30 Phrases to Talk about your Free Time in English", channel: "English Speaking Success" },
  ],
  "Making Plans": [
    { id: "xBdDM_Ii8sU", title: "Making Plans: Everyday English Dialogues", channel: "Ellii" },
    { id: "1VwoP8mYUCw", title: "Making an Invitation: English Conversation", channel: "Pocket Passport" },
    { id: "CpD7_8m6P4o", title: "Making Plans with Friends in English", channel: "ESL Easy English" },
  ],
  Travel: [
    { id: "wyqfYJX23lg", title: "English for Hotel and Tourism: Checking into a hotel", channel: "LinguaTV" },
    { id: "-8cCMdwVa1g", title: "Phrases for checking in at the airport", channel: "English by Giovana" },
    { id: "h8DHo3ZoPaA", title: "Hotel Check-In Conversation (A1–A2)", channel: "Fluent English Stories" },
  ],
  Health: [
    { id: "Cj9DKRWp-ek", title: "At the Doctor's: English Conversation Practice", channel: "EverydayEnglish" },
    { id: "44SL8i8h0dg", title: "At the doctor: English conversation", channel: "Sunshine English" },
    { id: "leHpv4m_Pq4", title: "Doctor and Patient Conversation in English", channel: "Everyday Cafe" },
  ],
  Problems: [
    { id: "ZIA2Ach3ANI", title: "At the Lost & Found: Looking for a Missing Item", channel: "TalkLearn.English" },
    { id: "WfOFbpBu_oI", title: "Finding Something You Lost: Easy English Conversation (B1)", channel: "Key To Learn English" },
    { id: "xauIL32b0dQ", title: "Lost & Found! English Conversation Practice", channel: "Learn English With AI" },
  ],
  Entertainment: [
    { id: "BSABmr8hX7s", title: "Talking about films: Real Easy English", channel: "BBC Learning English" },
    { id: "9JroOpISbls", title: "How to Talk about Movies in English", channel: "Pocket Passport" },
    { id: "Ch4CEtU68Fw", title: "How to Talk About Movies in English", channel: "Talk Nora" },
  ],
  Work: [
    { id: "-JNjsOX0N0c", title: "English Job Interview Dos & Don'ts!", channel: "Rachel's English" },
    { id: "0k0Uc9uAJwk", title: "Job interview in English: questions and answers", channel: "Sunshine English" },
    { id: "GWkzCr3i0o0", title: "Job Interview in English: Conversation Practice", channel: "English Conversation Journal" },
  ],
  Money: [
    { id: "DT3UyVwJe9U", title: "At the bank: English conversation", channel: "Sunshine English" },
    { id: "15qgr9n1tcM", title: "At The Bank: Opening a Bank Account", channel: "English101" },
    { id: "ZFH4kR5Xps4", title: "Speak fluently at the Bank", channel: "JISH: Learn English Podcast" },
  ],
  Relationships: [
    { id: "vWMJ8uwtUVU", title: "The Roommates: English Conversation", channel: "Easy English" },
    { id: "R0hmKcgItKE", title: "Roommates Dialogues: Speaking Practice", channel: "LearnAmericanEnglish" },
    { id: "eENzHYPJrL8", title: "Talking with Your Roommate: Easy English Conversation", channel: "SpeakEasy Learn English" },
  ],
  Technology: [
    { id: "Gfrb3INodrY", title: "Talking to Customer Support: Easy Phone Conversation", channel: "English Smart Practice" },
    { id: "w0UWs11p0iA", title: "Spoken English Practice: Customer Service Call", channel: "Key to Conversation" },
    { id: "6jFNW5aa3H4", title: "Calling Customer Service for Support", channel: "Let's Learn English" },
  ],
  Debate: [
    { id: "iRKGHkY-u50", title: "Real English Conversation: Advanced English Lesson", channel: "Speak English With Vanessa" },
    { id: "VzaliNn4Rco", title: "39 Advanced English Phrases for Debates", channel: "English Etc. With Julie" },
    { id: "6PJnEdbq8qc", title: "Real Native Conversation (B2–C1)", channel: "Smashing English!" },
  ],
  Leadership: [
    { id: "UKz1Fsw_e8c", title: "Giving feedback: English at Work", channel: "BBC Learning English" },
    { id: "QEEpn0YZ78s", title: "How to Respond to Feedback at Work in English", channel: "Business English For Success" },
    { id: "VOCxCPxEDFY", title: "Speak Professionally When Receiving Feedback", channel: "Business English For Success" },
  ],
  Business: [
    { id: "lQJKmRD1gYg", title: "Business English Negotiations: Practical Dialogues", channel: "Business English Learning" },
    { id: "kO-xNOOoxsM", title: "Business English Conversation: Negotiations", channel: "Pocket Passport" },
    { id: "B-JDi7W7-Qk", title: "Business English Conversation Practice", channel: "Business English Channel" },
  ],
  Academic: [
    { id: "nUNc3SrCBSg", title: "Learn English series: Academic English", channel: "ABC Education" },
    { id: "bMEMqjrupHk", title: "Academic English: Learning Academic Vocabulary", channel: "ABC Education" },
    { id: "J2p8UmVZ6hs", title: "English at University", channel: "BBC Learning English" },
  ],
  Negotiation: [
    { id: "kO-xNOOoxsM", title: "Business English Conversation: Negotiations", channel: "Pocket Passport" },
    { id: "lQJKmRD1gYg", title: "Business English Negotiations: Practical Dialogues", channel: "Business English Learning" },
    { id: "mLkypxbztqU", title: "100 Negotiation Phrases for Business Meetings", channel: "Business English Learning" },
  ],
  Culture: [
    { id: "wWi-F9lWC_k", title: "Intermediate English Conversation: Culture Shocks", channel: "Learn English with Camille" },
    { id: "hEmH0Qm2Nwo", title: "Talking About Cultural Differences", channel: "One Cup Of English" },
    { id: "m8lLwZU9COg", title: "Advanced English Conversation: Education in the US", channel: "Speak English With Vanessa" },
  ],
  "Small Talk": SMALL_TALK,
  "Catching Up": NATIVE,
  "Hanging Out": NATIVE,
  Venting: NATIVE,
  "Everyday Life": NATIVE,
  "Phone Calls": NATIVE,
  Favors: NATIVE,
  Native: NATIVE,
};

export const EXAM_VIDEOS: Record<"IELTS" | "PTE", RealVideo[]> = {
  IELTS: [
    { id: "yvt8RzGNhBc", title: "Understand IELTS Writing Task 2 in 5 Minutes", channel: "IELTS Advantage" },
    { id: "w9tVmGia0_c", title: "How to Get a Band 9 in IELTS Writing Task 2", channel: "Fastrack IELTS" },
    { id: "G9aEKgQp6fs", title: "Nail Your Opinion Essay in 17 Minutes (Agree or Disagree)", channel: "Fastrack IELTS" },
    { id: "RTwTtu-YsnM", title: "BAND 9 Sample Essay: Problem & Solutions", channel: "Fastrack IELTS" },
    { id: "YBtSHDYty9s", title: "Plan and Write a Complete Discussion Essay", channel: "English Pro Tips" },
    { id: "dQIrKnXZtq4", title: "How to Write a Perfect Opinion Essay for Band 8+", channel: "Ross IELTS Academy" },
  ],
  PTE: [
    { id: "3d_PIii6Tt0", title: "Use this PTE Writing Essay Structure and NEVER fail!", channel: "E2 PTE" },
    { id: "Rnb2M5Zjlwc", title: "PTE Writing: Write Essay SUPER METHOD!", channel: "E2 PTE" },
    { id: "5NErMU-pgfI", title: "PTE Essay Writing: Score 79+ Complete Masterclass", channel: "SKILLS PTE ACADEMIC" },
    { id: "FWNKX2Fnpzc", title: "PTE Essay Universal Template: 90/90 Strategy", channel: "IELTS with Zulkaif" },
    { id: "9pOHR_p_doU", title: "PTE Writing 90/90 Formula: Tips and Template", channel: "Language Academy PTE" },
  ],
};

// Essay topics reuse the closest conversation topic.
Object.assign(VIDEOS, {
  Friends: VIDEOS.Greetings,
  Places: VIDEOS.Travel,
  Animals: VIDEOS["Daily Life"],
  Celebrations: VIDEOS["Making Plans"],
  Memories: VIDEOS["Daily Life"],
  People: VIDEOS.Family,
  Education: VIDEOS.Academic,
  Society: VIDEOS.Debate,
  "Personal Growth": VIDEOS.Debate,
});

/** Topic videos first, then native-speaker conversations, de-duplicated. */
export function videosFor(topic: string): RealVideo[] {
  const list = [...(VIDEOS[topic] ?? []), ...NATIVE];
  return list.filter((v, i) => list.findIndex((x) => x.id === v.id) === i).slice(0, 6);
}
