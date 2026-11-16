"use client";

import { useEffect, useRef, useState } from "react";
import { addPracticeSeconds, DAILY_GOAL_SECONDS, fmt, getFlag, isActive, msUntilTomorrow, setFlag, usePractice } from "@/lib/practice";

function Ring({ value, size = 56, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, value))}
        className="transition-[stroke-dashoffset] duration-700"
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function untilTomorrowText() {
  const m = Math.ceil(msUntilTomorrow() / 60000);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * Counts practice time while this page is visible and shows today's 15-minute goal.
 * When the goal is reached the learner chooses: keep practicing (bonus time) or stop until tomorrow.
 */
export function PracticeTimer({ estimate }: { estimate: number }) {
  const { today, streak, goalMet } = usePractice();
  const [session, setSession] = useState(0);
  const [popup, setPopup] = useState(false);
  const [resting, setResting] = useState(false); // chose "done for today"
  const [, setNow] = useState(0);
  const [activeNow, setActiveNow] = useState(false);
  const pending = useRef(0);
  const restingRef = useRef(false);

  useEffect(() => {
    if (getFlag("done")) {
      restingRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResting(true);
    }
    const tick = setInterval(() => {
      setNow((n) => n + 1); // refresh the "until tomorrow" countdown
      const counting = document.visibilityState === "visible" && !restingRef.current && isActive();
      setActiveNow(counting);
      if (!counting) return;
      setSession((s) => s + 1);
      pending.current++;
      if (pending.current >= 5) {
        addPracticeSeconds(pending.current);
        pending.current = 0;
      }
    }, 1000);
    return () => {
      clearInterval(tick);
      if (pending.current) addPracticeSeconds(pending.current);
      pending.current = 0;
    };
  }, []);

  // Show the "goal complete" popup once per day, the moment 15 minutes is reached.
  useEffect(() => {
    if (goalMet && !getFlag("seen") && !getFlag("done")) {
      setFlag("seen");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPopup(true);
    }
  }, [goalMet]);

  const keepGoing = () => {
    setPopup(false);
    setFlag("done", false);
    restingRef.current = false;
    setResting(false);
  };
  const doneForToday = () => {
    if (pending.current) addPracticeSeconds(pending.current);
    pending.current = 0;
    setFlag("done");
    restingRef.current = true;
    setResting(true);
    setPopup(false);
  };

  const shown = today;
  const bonus = Math.max(0, shown - DAILY_GOAL_SECONDS);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-fuchsia-500/10 p-4">
      <div className="relative">
        <Ring value={shown / DAILY_GOAL_SECONDS} />
        <span className="absolute inset-0 flex items-center justify-center text-lg">{goalMet ? "🏆" : "⏱️"}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-widest text-white/50">Daily practice goal</div>
        <div className="text-xl font-black tabular-nums">
          {fmt(Math.min(shown, DAILY_GOAL_SECONDS))} <span className="text-sm font-medium text-white/50">/ 15:00 today</span>
          {bonus > 0 && <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-200">+{fmt(bonus)} bonus</span>}
        </div>
        <div className="text-xs text-white/55">
          {resting ? (
            <>
              ✅ Done for today. Next 15-minute session in {untilTomorrowText()}.{" "}
              <button onClick={keepGoing} className="font-semibold text-amber-200 underline">
                Practice extra anyway
              </button>
            </>
          ) : (
            <>
              <span className={`mr-1.5 inline-block rounded-full px-2 py-0.5 font-bold ${activeNow ? "bg-emerald-400 text-black" : "bg-white/10 text-white/60"}`}>
                {activeNow ? "● Counting" : "⏸ Paused: press Play to start"}
              </span>
              {goalMet ? "Goal complete! Extra time counts as bonus ⭐" : `${Math.ceil((DAILY_GOAL_SECONDS - shown) / 60)} min left today`}
            </>
          )}
        </div>
      </div>
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-sm rounded-3xl border border-emerald-400/30 bg-[#0f1a1a] p-6 text-center shadow-2xl">
            <div className="text-6xl">🏆</div>
            <h3 className="mt-3 text-2xl font-black">Today&apos;s 15 minutes complete!</h3>
            <p className="mt-2 text-sm text-white/70">
              Amazing work. Your streak is now 🔥 {streak} day{streak === 1 ? "" : "s"}. Have some spare time? Keep going, and the extra minutes
              count as bonus. Or rest and come back tomorrow for your next 15 minutes.
            </p>
            <div className="mt-5 grid gap-2">
              <button onClick={keepGoing} className="btn-3d rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-black">
                ⭐ Keep practicing (bonus time)
              </button>
              <button onClick={doneForToday} className="rounded-2xl bg-white/10 py-3 font-bold hover:bg-white/15">
                😴 Done for today, see you tomorrow
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-black/30 px-3 py-2">
          <div className="text-lg font-black tabular-nums">{fmt(session)}</div>
          <div className="text-white/45">this session</div>
        </div>
        <div className="rounded-2xl bg-black/30 px-3 py-2">
          <div className="text-lg font-black">≈{estimate}m</div>
          <div className="text-white/45">this lesson</div>
        </div>
        <div className="rounded-2xl bg-black/30 px-3 py-2">
          <div className="text-lg font-black">🔥{streak}</div>
          <div className="text-white/45">day streak</div>
        </div>
      </div>
    </div>
  );
}

/** Compact badge for the header. */
export function PracticeBadge() {
  const { today, streak } = usePractice();
  return (
    <span className="hidden items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-xs font-semibold ring-1 ring-white/10 md:flex" title="Today's practice (goal: 15 minutes)">
      <Ring value={today / DAILY_GOAL_SECONDS} size={26} stroke={4} />
      {Math.floor(today / 60)}/15 min · 🔥{streak}
    </span>
  );
}

/** Weekly overview for the home page. */
export function DailyGoalCard() {
  const { today, streak, week, goalMet } = usePractice();
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Ring value={today / DAILY_GOAL_SECONDS} size={72} stroke={8} />
          <span className="absolute inset-0 flex items-center justify-center text-xl">{goalMet ? "🏆" : "⏱️"}</span>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">Practice 15 min every day</div>
          <div className="text-2xl font-black tabular-nums">
            {fmt(Math.min(today, 5999))} <span className="text-sm font-medium text-white/50">/ 15:00</span>
          </div>
          <div className="text-xs text-white/55">🔥 {streak}-day streak</div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-1.5">
        {week.map((d) => (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-14 w-full items-end overflow-hidden rounded-lg bg-white/5">
              <div
                className={`w-full rounded-lg ${d.sec >= DAILY_GOAL_SECONDS ? "bg-gradient-to-t from-emerald-500 to-emerald-300" : "bg-gradient-to-t from-fuchsia-600 to-fuchsia-400"}`}
                style={{ height: `${Math.min(100, (d.sec / DAILY_GOAL_SECONDS) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-white/45">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
