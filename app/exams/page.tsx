import type { Metadata } from "next";
import Link from "next/link";
import { SectionHero } from "@/components/PageParts";
import { EXAM_INFO, EXAM_TIPS, examEssays, TYPE_LABEL, type Exam } from "@/lib/exams";

export const metadata: Metadata = {
  title: "IELTS & PTE Essays",
  description: "Model IELTS Writing Task 2 and PTE Write Essay answers with read-aloud, timed writing practice and real lesson videos.",
};

export default function ExamsPage() {
  return (
    <div className="pb-10">
      <SectionHero icon="🎓" kicker="Exam preparation" title="IELTS & PTE" count={examEssays.length} unit="model essays · 4 question types">
        Read model answers with karaoke, do voice practice on every sentence, watch real exam lessons, then write your own answer against the
        real exam timer.
      </SectionHero>
      <div className="flex gap-3">
        <a href="#ielts" className="rounded-full bg-gradient-to-r from-red-500 to-rose-700 px-5 py-2 font-bold">IELTS →</a>
        <a href="#pte" className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-700 px-5 py-2 font-bold">PTE →</a>
      </div>

      {(["IELTS", "PTE"] as Exam[]).map((exam) => {
        const list = examEssays.filter((e) => e.exam === exam);
        return (
          <section key={exam} id={exam.toLowerCase()} className="mt-12 scroll-mt-20">
            <div className={`rounded-3xl bg-gradient-to-r ${EXAM_INFO[exam].color} p-6 shadow-2xl`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black">{exam}</h2>
                  <p className="text-sm text-white/85">{EXAM_INFO[exam].desc}</p>
                </div>
                <span className="rounded-full bg-black/25 px-3 py-1 text-sm font-bold">{list.length} model essays</span>
              </div>
              <ul className="mt-4 grid gap-1 text-sm text-white/90 sm:grid-cols-2">
                {EXAM_TIPS[exam].slice(0, 4).map((t) => (
                  <li key={t}>✓ {t}</li>
                ))}
              </ul>
            </div>
            {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((type) => (
              <div key={type} className="mt-6">
                <h3 className="mb-3 font-bold text-white/80">{TYPE_LABEL[type]}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {list
                    .filter((e) => e.type === type)
                    .map((e) => (
                      <Link
                        key={e.id}
                        href={`/exams/${e.id}`}
                        data-tilt="8"
                        className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{e.emoji}</span>
                          <span className="text-[11px] text-white/45">{e.words} words</span>
                        </div>
                        <div className="mt-2 font-bold">{e.theme}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-white/55">{e.question}</p>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
