"use client";

import { useRef } from "react";
import type { Conversation, Speaker } from "@/lib/types";
import { tokenize } from "@/lib/score";

const SCENES: Record<string, { bg: string; props: string[]; place: string }> = {
  Greetings: { bg: "from-sky-400 via-emerald-300 to-lime-200", props: ["🌳", "🌼", "☁️", "🐦"], place: "City park" },
  "Food & Drink": { bg: "from-amber-700 via-orange-400 to-amber-200", props: ["☕", "🥐", "🧁", "🪴"], place: "Café" },
  Family: { bg: "from-rose-400 via-orange-300 to-yellow-200", props: ["🛋️", "🖼️", "🪴", "🧸"], place: "Living room" },
  Shopping: { bg: "from-fuchsia-500 via-pink-400 to-rose-200", props: ["🛍️", "👗", "🏷️", "🛒"], place: "Store" },
  Directions: { bg: "from-slate-500 via-sky-400 to-cyan-200", props: ["🚦", "🏢", "🚌", "🗺️"], place: "Street" },
  "Daily Life": { bg: "from-indigo-500 via-sky-400 to-amber-200", props: ["⏰", "🚲", "🏙️", "☀️"], place: "Morning" },
  Weather: { bg: "from-sky-500 via-cyan-300 to-white", props: ["☀️", "🌧️", "☁️", "❄️"], place: "Outside" },
  Hobbies: { bg: "from-violet-500 via-fuchsia-400 to-pink-200", props: ["🎸", "⚽", "🎨", "📷"], place: "Weekend" },
  "Making Plans": { bg: "from-purple-600 via-indigo-400 to-sky-200", props: ["📅", "📱", "🎉", "🗓️"], place: "On the phone" },
  Travel: { bg: "from-cyan-600 via-sky-400 to-blue-100", props: ["✈️", "🧳", "🗺️", "🏨"], place: "On the road" },
  Health: { bg: "from-teal-500 via-emerald-300 to-white", props: ["🩺", "💊", "🏥", "🍎"], place: "Clinic" },
  Problems: { bg: "from-slate-600 via-slate-400 to-slate-200", props: ["🎒", "🔎", "📋", "🚉"], place: "Help desk" },
  Entertainment: { bg: "from-indigo-900 via-purple-700 to-fuchsia-500", props: ["🎬", "🍿", "📺", "🎧"], place: "Movie night" },
  Work: { bg: "from-slate-700 via-blue-500 to-sky-200", props: ["💼", "💻", "📊", "☕"], place: "Office" },
  Money: { bg: "from-emerald-700 via-emerald-500 to-lime-200", props: ["🏦", "💳", "💵", "📄"], place: "Bank" },
  Relationships: { bg: "from-pink-500 via-rose-300 to-orange-100", props: ["🏠", "🍽️", "🪴", "🛋️"], place: "Apartment" },
  Technology: { bg: "from-blue-900 via-indigo-600 to-cyan-400", props: ["💻", "📱", "🔧", "📶"], place: "Tech support" },
  Debate: { bg: "from-zinc-800 via-indigo-700 to-violet-400", props: ["💬", "📰", "⚖️", "🌍"], place: "Discussion" },
  Leadership: { bg: "from-slate-800 via-sky-700 to-teal-400", props: ["🧭", "📈", "🗂️", "☕"], place: "Meeting room" },
  Business: { bg: "from-gray-900 via-purple-800 to-amber-400", props: ["🚀", "📈", "💡", "🤝"], place: "Boardroom" },
  Academic: { bg: "from-amber-900 via-amber-600 to-yellow-200", props: ["🎓", "📚", "📝", "🔬"], place: "University" },
  Negotiation: { bg: "from-stone-700 via-amber-600 to-orange-200", props: ["🔑", "📄", "🏠", "✍️"], place: "Apartment" },
  Culture: { bg: "from-red-600 via-orange-400 to-yellow-200", props: ["🌏", "🍜", "🎎", "🧳"], place: "Home again" },
  "Catching Up": { bg: "from-orange-500 via-pink-400 to-violet-300", props: ["🤗", "☕", "🏙️", "💬"], place: "Downtown" },
  "Hanging Out": { bg: "from-violet-700 via-fuchsia-500 to-orange-300", props: ["🍕", "🎮", "🛋️", "🏈"], place: "Friend's place" },
  "Small Talk": { bg: "from-amber-800 via-orange-500 to-rose-300", props: ["☕", "🎶", "🥂", "💬"], place: "Out and about" },
  Venting: { bg: "from-slate-800 via-rose-700 to-orange-400", props: ["😩", "📞", "🌯", "💼"], place: "After work" },
  "Everyday Life": { bg: "from-teal-600 via-cyan-400 to-yellow-200", props: ["🍔", "🍜", "🚗", "🏠"], place: "Home" },
  "Phone Calls": { bg: "from-indigo-600 via-sky-400 to-pink-200", props: ["📱", "❤️", "✈️", "🏡"], place: "On the phone" },
  Favors: { bg: "from-emerald-600 via-teal-400 to-sky-200", props: ["🙏", "🛋️", "🚗", "🐶"], place: "Neighborhood" },
};

export { SCENES };

const SKIN = ["#f5d0b0", "#e8b48a", "#c98e62", "#a26a42", "#7a4a2c", "#f1c6a6"];
const HAIR = ["#1f1a17", "#4a2f1d", "#8b5a2b", "#d8a95b", "#2d2d2d", "#6b2f2f"];
const SHIRT = ["#7c3aed", "#0ea5e9", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function Character({ name, role, speaking, side }: { name: string; role: string; speaking: boolean; side: "left" | "right" }) {
  const h = hash(name);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const shirt = SHIRT[(h >> 5) % SHIRT.length];
  const longHair = (h >> 7) % 2 === 0;
  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ${speaking ? "scale-105 opacity-100" : "scale-95 opacity-75"}`}
    >
      <svg
        viewBox="0 0 120 150"
        className={`h-36 w-28 drop-shadow-2xl sm:h-52 sm:w-40 ${speaking ? "animate-talk-bob" : "animate-idle"} ${side === "right" ? "-scale-x-100" : ""}`}
        aria-hidden
      >
        {/* body */}
        <path d="M20 150 Q20 100 60 98 Q100 100 100 150 Z" fill={shirt} />
        <rect x="52" y="82" width="16" height="20" rx="6" fill={skin} />
        {/* hair back */}
        {longHair && <path d="M24 52 Q22 100 40 104 L80 104 Q98 100 96 52 Z" fill={hair} />}
        {/* head */}
        <ellipse cx="60" cy="54" rx="32" ry="36" fill={skin} />
        {/* hair top */}
        <path d="M27 50 Q28 16 60 16 Q94 16 93 50 Q84 30 60 32 Q40 30 27 50 Z" fill={hair} />
        {/* eyes */}
        <g className="animate-blink" style={{ transformOrigin: "60px 52px" }}>
          <ellipse cx="48" cy="54" rx="4" ry="5" fill="#1f1a17" />
          <ellipse cx="72" cy="54" rx="4" ry="5" fill="#1f1a17" />
          <circle cx="49.5" cy="52.5" r="1.4" fill="#fff" />
          <circle cx="73.5" cy="52.5" r="1.4" fill="#fff" />
        </g>
        {/* cheeks */}
        <circle cx="40" cy="66" r="5" fill="#f472b6" opacity="0.35" />
        <circle cx="80" cy="66" r="5" fill="#f472b6" opacity="0.35" />
        {/* mouth */}
        {speaking ? (
          <ellipse cx="60" cy="73" rx="7" ry="5" fill="#7f1d1d" className="animate-mouth" style={{ transformOrigin: "60px 73px" }} />
        ) : (
          <path d="M52 72 Q60 78 68 72" stroke="#7f1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
      <div className="-mt-3 h-4 w-24 rounded-[50%] bg-black/40 blur-md sm:w-32" aria-hidden />
      <div className="mt-1 rounded-full bg-black/45 px-3 py-1 text-center text-xs font-semibold text-white backdrop-blur sm:text-sm">
        {name} <span className="font-normal text-white/70">· {role}</span>
      </div>
    </div>
  );
}

export default function VideoStage({
  conv,
  current,
  wordIndex,
  playing,
  listening,
  heard,
  onTogglePlay,
}: {
  conv: Conversation;
  current: number;
  wordIndex: number;
  playing: boolean;
  listening: boolean;
  heard: string;
  onTogglePlay: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scene = SCENES[conv.topic] ?? SCENES.Greetings;
  const line = conv.lines[current];
  const speaker: Speaker | null = line ? line.speaker : null;
  const words = line ? tokenize(line.text) : [];
  const progress = ((current + (wordIndex >= words.length ? 1 : 0)) / conv.lines.length) * 100;

  const fullscreen = () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  };

  return (
    <div
      ref={ref}
      className={`relative aspect-video w-full overflow-hidden rounded-3xl bg-gradient-to-b ${scene.bg} shadow-2xl shadow-black/50 ring-1 ring-white/10 [&:fullscreen]:rounded-none`}
    >
      {/* floating props */}
      {scene.props.map((p, i) => (
        <span
          key={i}
          className="animate-float pointer-events-none absolute select-none text-3xl opacity-80 sm:text-5xl"
          style={{ left: `${8 + i * 24}%`, top: `${8 + (i % 2) * 14}%`, animationDelay: `${i * 0.7}s` }}
        >
          {p}
        </span>
      ))}
      {/* 3D floor */}
      <div className="stage-floor absolute -inset-x-1/4 bottom-0 h-[45%] bg-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/55 to-transparent" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur sm:text-sm">
          <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
          <span className="truncate">
            {scene.place} · {conv.title}
          </span>
        </div>
        <button
          onClick={fullscreen}
          className="shrink-0 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/60"
        >
          ⛶ Full screen
        </button>
      </div>

      {/* characters */}
      <div className="absolute inset-x-0 bottom-[22%] flex items-end justify-between px-[6%] sm:bottom-[20%]">
        <Character name={conv.speakers.A.name} role={conv.speakers.A.role} speaking={playing && speaker === "A" && !listening} side="left" />
        <Character name={conv.speakers.B.name} role={conv.speakers.B.role} speaking={playing && speaker === "B" && !listening} side="right" />
      </div>

      {/* subtitles */}
      <div className="absolute inset-x-0 bottom-0 flex min-h-[22%] items-center justify-center px-3 pb-4 sm:px-10">
        {line && (
          <p className="max-w-4xl rounded-2xl bg-black/65 px-4 py-2 text-center text-sm font-semibold leading-relaxed text-white/60 backdrop-blur-md sm:text-2xl">
            <span className="mr-2 text-amber-300">{conv.speakers[line.speaker].name}:</span>
            {words.map((w, i) => (
              <span
                key={i}
                className={`transition-colors duration-150 ${
                  i < wordIndex ? "text-white" : i === wordIndex ? "rounded bg-amber-300 px-1 text-black" : ""
                }`}
              >
                {w}{" "}
              </span>
            ))}
            {listening && (
              <span className="mt-1 block text-xs font-medium text-emerald-300 sm:text-base">
                🎙️ Your turn{heard ? `: “${heard}”` : "… speak now"}
              </span>
            )}
          </p>
        )}
      </div>

      {/* big play overlay */}
      {!playing && (
        <button
          onClick={onTogglePlay}
          className="group absolute inset-0 flex items-center justify-center bg-black/25 transition hover:bg-black/35"
          aria-label="Play video"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-3xl text-black shadow-2xl transition group-hover:scale-110 sm:h-24 sm:w-24 sm:text-5xl">
            ▶
          </span>
        </button>
      )}

      {/* progress */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
        <div className="h-full bg-gradient-to-r from-amber-300 to-rose-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
