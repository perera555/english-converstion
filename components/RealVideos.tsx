"use client";

import { useEffect, useState } from "react";
import type { RealVideo } from "@/lib/videos";
import { pingActivity } from "@/lib/practice";

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

/** Embedded real (human-presented) YouTube lessons with a playlist strip. */
export default function RealVideos({
  videos,
  search,
  heading = "🎥 Real videos: native speakers",
  compact = false,
}: {
  videos: RealVideo[];
  search: string;
  heading?: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  // While a real video is open and the tab is visible, it counts as practice time.
  useEffect(() => {
    if (!started) return;
    pingActivity();
    const id = setInterval(() => document.visibilityState === "visible" && pingActivity(), 1000);
    return () => clearInterval(id);
  }, [started]);
  const v = videos[active];
  if (!v) return null;

  return (
    <section className={compact ? "" : "mt-12"}>
      {!compact && (
        <div className="mb-4">
          <h2 className="text-lg font-black">{heading}</h2>
          <p className="text-sm text-white/55">Real people speaking real English. Watch, then practice the same situation below.</p>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {started ? (
            <iframe
              key={v.id}
              src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&cc_load_policy=1&cc_lang_pref=en`}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button onClick={() => setStarted(true)} className="group absolute inset-0" aria-label={`Play ${v.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex h-16 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600 text-3xl text-white shadow-2xl shadow-red-600/50 transition group-hover:scale-110">
                ▶
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 text-left">
                <span className="block text-xs font-semibold uppercase tracking-widest text-red-300">Real video · {v.channel}</span>
                <span className="mt-1 line-clamp-2 block text-base font-bold sm:text-lg">{v.title}</span>
              </span>
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {videos.map((x, i) => (
            <button
              key={x.id}
              onClick={() => {
                setActive(i);
                setStarted(true);
              }}
              className={`flex w-56 shrink-0 gap-3 rounded-2xl p-2 text-left transition lg:w-full ${
                i === active ? "bg-white/10 ring-1 ring-red-400/50" : "hover:bg-white/5"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${x.id}/mqdefault.jpg`} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-xs font-semibold leading-snug">{x.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-white/45">{x.channel}</span>
              </span>
            </button>
          ))}
          <a
            href={yt(search)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-56 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 p-3 text-xs font-semibold text-white/60 hover:text-white lg:w-full"
          >
            More on YouTube ↗
          </a>
        </div>
      </div>
    </section>
  );
}
