const FACES = [
  { t: "Hello!", c: "from-fuchsia-500 to-violet-600", tr: "rotateY(0deg)" },
  { t: "How are you?", c: "from-cyan-400 to-blue-600", tr: "rotateY(90deg)" },
  { t: "Nice to meet you", c: "from-amber-400 to-orange-600", tr: "rotateY(180deg)" },
  { t: "Let's talk!", c: "from-emerald-400 to-teal-600", tr: "rotateY(-90deg)" },
  { t: "🎤", c: "from-rose-500 to-pink-600", tr: "rotateX(90deg)" },
  { t: "🎧", c: "from-indigo-500 to-violet-700", tr: "rotateX(-90deg)" },
];

/** Pure-CSS spinning 3D cube with floating speech bubbles. */
export default function HeroCube() {
  return (
    <div className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64" style={{ perspective: "900px" }} aria-hidden>
      <div className="absolute inset-x-6 -bottom-6 h-8 rounded-[50%] bg-fuchsia-500/40 blur-2xl" />
      <div className="cube absolute inset-0 m-auto h-32 w-32 sm:h-40 sm:w-40">
        {FACES.map((f) => (
          <div
            key={f.tr}
            className={`cube-face absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br ${f.c} p-3 text-center text-lg font-black leading-tight text-white ring-1 ring-white/30 sm:text-xl`}
            style={{ transform: `${f.tr} translateZ(var(--half))` }}
          >
            {f.t}
          </div>
        ))}
      </div>
      <span className="bubble-3d absolute -left-6 top-4 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-xs font-bold text-black sm:-left-14">
        Hi! 👋
      </span>
      <span className="bubble-3d absolute -right-4 top-14 rounded-2xl rounded-br-sm bg-cyan-300 px-3 py-1.5 text-xs font-bold text-black sm:-right-16" style={{ animationDelay: "1.2s" }}>
        Cheers! ☕
      </span>
      <span className="bubble-3d absolute -left-2 bottom-6 rounded-2xl rounded-tl-sm bg-amber-300 px-3 py-1.5 text-xs font-bold text-black sm:-left-12" style={{ animationDelay: "2.1s" }}>
        See you! ✨
      </span>
    </div>
  );
}
