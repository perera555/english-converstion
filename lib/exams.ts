import { EXAM_TOPICS, type ExamTopic } from "./exam-topics";
import type { Essay } from "./essay-types";

export type Exam = "IELTS" | "PTE";
export type ExamType = "opinion" | "discuss" | "advdis" | "problem";

export interface ExamEssay {
  id: number;
  exam: Exam;
  type: ExamType;
  theme: string;
  emoji: string;
  title: string;
  question: string;
  sections: { label: string; sentences: string[] }[];
  words: number;
  minutes: number;
  target: string;
}

export const TYPE_LABEL: Record<ExamType, string> = {
  opinion: "Agree / Disagree",
  discuss: "Discuss both views",
  advdis: "Advantages & disadvantages",
  problem: "Problem & solution",
};

export const EXAM_INFO: Record<Exam, { minutes: number; target: string; min: number; max: number; color: string; desc: string }> = {
  IELTS: { minutes: 40, target: "at least 250 words", min: 250, max: 400, color: "from-red-500 to-rose-700", desc: "IELTS Writing Task 2 · 40 minutes · 250+ words" },
  PTE: { minutes: 20, target: "200–300 words", min: 200, max: 300, color: "from-sky-500 to-indigo-700", desc: "PTE Academic Write Essay · 20 minutes · 200–300 words" },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Build = (t: ExamTopic) => { question: string; sections: { label: string; sentences: string[] }[] };

const IELTS: Record<ExamType, Build> = {
  opinion: (t) => ({
    question: `Some people believe that ${t.statement}. To what extent do you agree or disagree?`,
    sections: [
      { label: "Introduction", sentences: [`It is often argued that ${t.statement}.`, `This is an issue that affects individuals, families and governments alike.`, `In my opinion, the arguments in favor of this view are considerably stronger than those against it, and in this essay I will explain why.`] },
      { label: "Body paragraph 1: main reasons", sentences: [`The main reason I hold this opinion is that ${t.pros[0]}.`, `This is a significant benefit that should not be overlooked, and this point alone is a strong reason to support the idea.`, `In addition, ${t.pros[1]}.`, `For example, ${t.example}.`, `This clearly demonstrates the practical value of this approach.`, `When people experience these benefits directly, they are far more likely to support the idea.`] },
      { label: "Body paragraph 2: the other side", sentences: [`Admittedly, some people point out that ${t.cons[0]}.`, `It is also true that ${t.cons[1]}.`, `Others worry that ${t.cons[2]}.`, `These concerns are understandable, but they can largely be addressed through sensible regulation and public education.`, `In my view, they are outweighed by the fact that ${t.pros[2]}.`] },
      { label: "Conclusion", sentences: [`In conclusion, I firmly believe that ${t.statement}.`, `Although there are some drawbacks, the benefits are far more significant, both for individuals and for society as a whole.`, `Therefore, decision-makers should support this approach while monitoring its effects carefully.`] },
    ],
  }),
  discuss: (t) => ({
    question: `Some people think that ${t.viewA}, while others believe that ${t.viewB}. Discuss both views and give your own opinion.`,
    sections: [
      { label: "Introduction", sentences: [`People have different views about whether ${t.viewA} or whether ${t.viewB}.`, `This question has become increasingly relevant in recent years.`, `This essay will discuss both sides before explaining why I support the first view.`] },
      { label: "Body paragraph 1: view B", sentences: [`On the one hand, there are good reasons to believe that ${t.viewB}.`, `Supporters of this view argue that ${t.cons[0]}.`, `They also point out that ${t.cons[1]}.`, `Furthermore, ${t.cons[2]}.`, `From this perspective, caution seems the most sensible approach, and these concerns deserve serious consideration.`] },
      { label: "Body paragraph 2: view A + my opinion", sentences: [`On the other hand, I agree with those who believe that ${t.viewA}.`, `Firstly, ${t.pros[0]}.`, `Secondly, ${t.pros[1]}.`, `In addition, ${t.pros[2]}.`, `For instance, ${t.example}.`, `In my view, these advantages are more important in the long term, especially when we consider the interests of society as a whole.`] },
      { label: "Conclusion", sentences: [`In conclusion, while there are valid arguments on both sides, I believe that ${t.viewA}.`, `This is mainly because ${t.pros[0]}.`, `Nevertheless, it is important to address the concerns raised by the other side.`, `Ultimately, a balanced approach that recognizes both perspectives is likely to produce the best results.`] },
    ],
  }),
  advdis: (t) => ({
    question: `${t.trend}. Do the advantages of this development outweigh the disadvantages?`,
    sections: [
      { label: "Introduction", sentences: [`It is true that ${low(t.trend)}.`, `This trend has attracted considerable attention from the public and the media, and it has both positive and negative effects.`, `Although it has some drawbacks, I believe the advantages are more significant.`] },
      { label: "Body paragraph 1: disadvantages", sentences: [`There are some disadvantages to this development.`, `The most obvious is that ${t.cons[0]}.`, `In addition, ${t.cons[1]}.`, `Furthermore, ${t.cons[2]}.`, `For some people, these effects can be serious, and it would be unwise to ignore them entirely.`, `Critics often highlight these points when they argue against the trend.`] },
      { label: "Body paragraph 2: advantages", sentences: [`However, the benefits are considerably greater.`, `First of all, ${t.pros[0]}.`, `Moreover, ${t.pros[1]}.`, `Finally, ${t.pros[2]}.`, `A good example of this is that ${t.example}.`, `These benefits are felt by individuals, communities and the wider economy, and many experts agree that they are likely to grow over time.`] },
      { label: "Conclusion", sentences: [`In conclusion, although there are some disadvantages, I believe the advantages of this development clearly outweigh them.`, `Governments and individuals should therefore focus on reducing the negative effects while making the most of the opportunities this trend offers.`, `Overall, the positive impact of this development is clear, and it is likely to become even more important in the future.`] },
    ],
  }),
  problem: (t) => ({
    question: `${t.problem}. What are the main causes of this problem, and what measures could be taken to solve it?`,
    sections: [
      { label: "Introduction", sentences: [`It is widely recognized that ${low(t.problem)}.`, `This is a growing concern in many parts of the world, and its effects can be seen in many areas of daily life.`, `This essay will examine the main causes of this issue and suggest some practical solutions.`] },
      { label: "Body paragraph 1: causes", sentences: [`There are two main causes of this problem.`, `The first is that ${t.causes[0]}.`, `The second is that ${t.causes[1]}.`, `These factors are closely connected and tend to reinforce each other.`, `As a result, the situation has become increasingly serious, and it affects people of all ages.`] },
      { label: "Body paragraph 2: solutions", sentences: [`Fortunately, there are several ways to tackle this issue.`, `Firstly, ${t.solutions[0]}.`, `This would address the root of the problem directly.`, `In addition, ${t.solutions[1]}.`, `Furthermore, public awareness campaigns could help people understand the seriousness of the issue and encourage them to change their behavior.`, `Schools and the media could also play an important role in spreading this message.`, `If these measures were combined, the results could be significant.`] },
      { label: "Conclusion", sentences: [`In conclusion, this problem is mainly caused by the fact that ${t.causes[0]}, as well as the fact that ${t.causes[1]}.`, `However, it could be greatly reduced if governments, organizations and individuals worked together on the solutions suggested above.`, `Taking action now would prevent the problem from becoming even more serious in the future.`] },
    ],
  }),
};

const PTE: Record<ExamType, Build> = {
  opinion: (t) => ({
    question: `"${cap(t.statement)}." Do you agree or disagree? Support your point of view with reasons and/or examples from your own experience or observations.`,
    sections: [
      { label: "Introduction", sentences: [`In contemporary society, the question of whether ${t.statement} has sparked considerable debate.`, `This issue has significant implications for individuals, communities and governments.`, `This essay strongly agrees with this notion for several compelling reasons, which will be outlined below.`] },
      { label: "Body paragraph 1", sentences: [`To begin with, ${t.pros[0]}.`, `Furthermore, ${t.pros[1]}.`, `Moreover, ${t.pros[2]}.`, `A prime example of this is that ${t.example}.`, `This demonstrates the tangible benefits of this approach in real-world settings.`, `Such outcomes are highly desirable in the modern world.`] },
      { label: "Body paragraph 2", sentences: [`Admittedly, critics argue that ${t.cons[0]}.`, `In addition, some contend that ${t.cons[1]}.`, `However, with appropriate planning and regulation, these challenges can be effectively mitigated, and the overall advantages remain far greater.`, `This suggests that the criticism, while understandable, is not decisive.`] },
      { label: "Conclusion", sentences: [`In conclusion, taking everything into account, it is evident that ${t.statement}, and the benefits far exceed the potential drawbacks.`, `Therefore, policymakers should embrace this approach while carefully addressing any concerns.`] },
    ],
  }),
  discuss: (t) => ({
    question: `Some argue that ${t.viewA}, whereas others claim that ${t.viewB}. Discuss both perspectives and state your own position.`,
    sections: [
      { label: "Introduction", sentences: [`It is a controversial issue whether ${t.viewA} or whether ${t.viewB}.`, `This debate has become increasingly prominent in recent years.`, `While both perspectives have merit, this essay will argue in favor of the former.`] },
      { label: "Body paragraph 1", sentences: [`Those who believe that ${t.viewB} often point out that ${t.cons[0]}.`, `In addition, they argue that ${t.cons[1]}.`, `Furthermore, ${t.cons[2]}.`, `These concerns are certainly not without foundation.`] },
      { label: "Body paragraph 2", sentences: [`However, the opposing view is more convincing.`, `Primarily, ${t.pros[0]}.`, `Moreover, ${t.pros[1]}.`, `Additionally, ${t.pros[2]}.`, `For instance, ${t.example}.`, `This evidence strongly supports the view that the advantages are substantial.`] },
      { label: "Conclusion", sentences: [`In conclusion, although both sides present valid points, it is my firm belief that ${t.viewA}.`, `Nevertheless, the legitimate concerns of the opposing side should be taken into account when making decisions.`, `A balanced policy would therefore be the most effective way forward.`] },
    ],
  }),
  advdis: (t) => ({
    question: `${t.trend}. What are the advantages and disadvantages of this trend? Support your answer with relevant examples.`,
    sections: [
      { label: "Introduction", sentences: [`In recent years, ${low(t.trend)}.`, `This development has had a profound impact on many aspects of modern life.`, `This essay will examine both the benefits and the drawbacks of this phenomenon.`] },
      { label: "Body paragraph 1: advantages", sentences: [`The most significant advantage is that ${t.pros[0]}.`, `Another benefit is that ${t.pros[1]}.`, `Furthermore, ${t.pros[2]}.`, `For example, ${t.example}.`, `This illustrates how significant the positive impact can be for individuals and the wider community.`] },
      { label: "Body paragraph 2: disadvantages", sentences: [`On the other hand, there are certain drawbacks.`, `One major concern is that ${t.cons[0]}.`, `Additionally, ${t.cons[1]}.`, `Moreover, ${t.cons[2]}.`, `These issues could have serious consequences if they are not addressed, and critics frequently cite them in public debates.`] },
      { label: "Conclusion", sentences: [`In conclusion, this trend offers considerable benefits, but its drawbacks must be carefully managed to ensure positive outcomes for society.`, `Governments and individuals must therefore work together to maximize the advantages while minimizing the disadvantages.`, `Only then can this trend truly benefit everyone.`] },
    ],
  }),
  problem: (t) => ({
    question: `${t.problem}. Discuss the causes of this issue and suggest possible solutions.`,
    sections: [
      { label: "Introduction", sentences: [`Nowadays, ${low(t.problem)}.`, `This issue has attracted widespread attention in recent years and affects a large number of people.`, `This essay will outline the key causes of this issue and propose effective solutions.`] },
      { label: "Body paragraph 1: causes", sentences: [`One primary cause is that ${t.causes[0]}.`, `Another contributing factor is that ${t.causes[1]}.`, `These factors are closely interconnected, and each one tends to make the other worse.`, `As a result, the problem has become increasingly difficult to solve, and without decisive action it is likely to continue growing.`] },
      { label: "Body paragraph 2: solutions", sentences: [`To address this issue, ${t.solutions[0]}.`, `Furthermore, ${t.solutions[1]}.`, `In addition, public awareness campaigns could encourage people to change their behavior.`, `Governments, businesses and communities must all play their part.`, `Such measures would significantly reduce the scale of the problem and bring lasting benefits to society as a whole.`] },
      { label: "Conclusion", sentences: [`In conclusion, while this problem has several causes, a combination of the measures discussed could lead to meaningful improvement.`, `With sustained effort and cooperation, this issue can be effectively tackled in the years to come.`, `Ultimately, a collective commitment to change is essential.`] },
    ],
  }),
};

const TYPES: ExamType[] = ["opinion", "discuss", "advdis", "problem"];

function buildAll(): ExamEssay[] {
  const out: ExamEssay[] = [];
  for (const exam of ["IELTS", "PTE"] as Exam[]) {
    for (const t of EXAM_TOPICS) {
      for (const type of TYPES) {
        const b = (exam === "IELTS" ? IELTS : PTE)[type](t);
        const words = b.sections.flatMap((s) => s.sentences).join(" ").split(/\s+/).length;
        out.push({
          id: out.length + 1,
          exam,
          type,
          theme: t.theme,
          emoji: t.emoji,
          title: `${exam} · ${TYPE_LABEL[type]}: ${t.theme}`,
          question: b.question,
          sections: b.sections,
          words,
          minutes: EXAM_INFO[exam].minutes,
          target: EXAM_INFO[exam].target,
        });
      }
    }
  }
  return out;
}

export const examEssays = buildAll();

/** Adapts an exam essay to the reader (karaoke, video, shadowing). */
export function toReaderEssay(e: ExamEssay): Essay {
  return {
    id: 100000 + e.id,
    level: "advanced",
    topic: e.theme,
    emoji: e.emoji,
    title: e.title,
    author: `${e.exam} model answer`,
    paragraphs: e.sections.map((s) => s.sentences),
    vocab: [],
    tip: "",
    words: e.words,
  };
}

export const EXAM_TIPS: Record<Exam, string[]> = {
  IELTS: [
    "Spend 5 minutes planning: decide your position and two main ideas before writing.",
    "Answer every part of the question. A two-part question needs two clear answers.",
    "Use 4 paragraphs: introduction, two body paragraphs, conclusion.",
    "Each body paragraph: one main idea → explanation → example.",
    "Keep your opinion consistent from the introduction to the conclusion.",
    "Save 3–5 minutes to check grammar, spelling and word count (250+).",
  ],
  PTE: [
    "Stay between 200 and 300 words. Outside this range you lose marks automatically.",
    "Use a clear template: intro, two body paragraphs, conclusion.",
    "Spelling counts. Choose one spelling convention and use it throughout.",
    "Use linking words: furthermore, nevertheless, for instance, in conclusion.",
    "Include keywords from the prompt to show you are on topic.",
    "Leave 2 minutes to proofread; the computer scores grammar and spelling.",
  ],
};
