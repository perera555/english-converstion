import type { Metadata } from "next";
import { PracticeTimer } from "@/components/PracticeTimer";
import { SectionHero } from "@/components/PageParts";
import TwisterGame from "@/components/TwisterGame";
import { chapters, twisters } from "@/lib/twisters";

export const metadata: Metadata = {
  title: "Tongue Twister Challenge",
  description: "1,000 tongue twisters in 20 chapters. Speak, get checked by voice recognition, and unlock the next level.",
};

export default function TwistersPage() {
  return (
    <div className="pb-10">
      <SectionHero icon="👅" kicker="Voice challenge" title="Tongue Twisters" count={twisters.length} unit={`twisters · ${chapters.length} chapters · 5 levels`}>
        Listen karaoke-style, then say it. Your voice is checked word by word. Pass to unlock the next one, repeat until you get it, and drill
        any twister as many times as you like.
      </SectionHero>
      <div className="mb-8">
        <PracticeTimer estimate={15} />
      </div>
      <TwisterGame chapters={chapters} twisters={twisters} />
    </div>
  );
}
