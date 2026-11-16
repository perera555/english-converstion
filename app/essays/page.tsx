import type { Metadata } from "next";
import EssayLibrary from "@/components/EssayLibrary";
import { SectionHero } from "@/components/PageParts";
import { ESSAY_TOTAL, getEssaySummaries } from "@/lib/essays";

export const metadata: Metadata = {
  title: "Essays",
  description: "1,000 English essays from beginner to native with read-aloud karaoke, video mode and shadowing.",
};

export default function EssaysPage() {
  return (
    <div className="pb-10">
      <SectionHero icon="📝" kicker="Read · Listen · Speak" title="Essays" count={ESSAY_TOTAL} unit="essays · Beginner → Native">
        Read along with karaoke highlighting, watch the video reading, do voice practice on every sentence, and watch real native-speaker videos
        on each topic. Repeat any essay up to 50 times.
      </SectionHero>
      <EssayLibrary items={getEssaySummaries()} />
    </div>
  );
}
