import type { EssayTemplate } from "../essay-types";

export const advancedEssays: EssayTemplate[] = [
  {
    key: "ai",
    topic: "Technology",
    emoji: "🤖",
    title: "Artificial intelligence in {f}: threat or opportunity?",
    slots: {
      f: ["medicine", "education", "journalism", "law", "the creative industries", "finance"],
    },
    paragraphs: [
      ["Few technologies have provoked as much excitement and anxiety as artificial intelligence.", "In {f}, its impact is already impossible to ignore."],
      ["Proponents argue that AI can automate tedious tasks, freeing professionals to focus on judgment, empathy and creativity.", "In {f}, this could mean faster decisions, fewer errors and services that are accessible to far more people."],
      ["Critics, however, warn that the benefits may be unevenly distributed.", "Workers whose roles consist largely of routine tasks risk being displaced, and algorithms trained on biased data may reinforce existing inequalities."],
      ["Ultimately, AI is neither inherently a threat nor an opportunity; it is an amplifier.", "Whether it amplifies human potential or human prejudice will depend on the regulations, values and safeguards we choose to put in place."],
    ],
    vocab: [["Provoke", "Cause a strong reaction"], ["Tedious", "Boring and repetitive"], ["Displaced", "Replaced; forced out"], ["Inherently", "By its basic nature"]],
    tip: "Avoid a simple yes/no conclusion in advanced essays. Reframe the question: \"neither X nor Y; it is Z.\"",
  },
  {
    key: "fashion",
    topic: "Society",
    emoji: "👗",
    title: "The hidden cost of fast fashion",
    slots: {
      stat: ["The fashion industry is responsible for a significant share of global carbon emissions", "Millions of tonnes of clothing end up in landfills every year", "Producing a single cotton T-shirt can require thousands of liters of water"],
      fix: ["buying second-hand", "repairing rather than replacing", "choosing quality over quantity", "supporting transparent brands"],
    },
    paragraphs: [
      ["Fast fashion has made trendy clothing cheaper and more accessible than ever before.", "Yet behind the low price tags lies a cost that consumers rarely see."],
      ["{stat}.", "Moreover, many garments are produced in factories where workers endure long hours for wages that barely cover their basic needs."],
      ["Defenders of the industry point out that it provides millions of jobs in developing economies.", "This is undeniably true, but it does not justify unsafe conditions or environmental destruction."],
      ["Meaningful change will require pressure from governments, brands and consumers alike.", "On an individual level, {fix} is a small but powerful step toward a more sustainable wardrobe."],
    ],
    vocab: [["Accessible", "Easy to get or afford"], ["Endure", "Suffer patiently"], ["Undeniably", "Certainly; without doubt"], ["Sustainable", "Not harmful to the environment long-term"]],
    tip: "Concede a point before rebutting it: \"This is undeniably true, but...\" It makes your argument more persuasive.",
  },
  {
    key: "free-uni",
    topic: "Education",
    emoji: "🎓",
    title: "Should university education be free?",
    slots: {
      country: ["Germany", "Norway", "Finland", "Argentina"],
      stance: ["On balance, I believe free tuition is a worthwhile investment", "On balance, I believe targeted support is fairer than universal free tuition"],
    },
    paragraphs: [
      ["As tuition fees continue to rise in many countries, the question of whether higher education should be free has become increasingly urgent."],
      ["Advocates argue that education is a public good.", "A well-educated population drives innovation and economic growth, and countries such as {country} have shown that tuition-free systems can work."],
      ["Opponents counter that free tuition disproportionately benefits wealthier families, whose children are already more likely to attend university.", "They contend that the money would be better spent on early childhood education or vocational training."],
      ["{stance}.", "Whatever the model, the guiding principle should be that talent, not family income, determines who gets to learn."],
    ],
    vocab: [["Public good", "Something that benefits all of society"], ["Disproportionately", "Too much compared to others"], ["Contend", "Argue; claim"], ["Vocational", "Related to practical job skills"]],
    tip: "Use precise reporting verbs: argue, contend, counter, maintain, acknowledge.",
  },
  {
    key: "four-day",
    topic: "Work",
    emoji: "📅",
    title: "The case for a four-day work week",
    slots: {
      evidence: ["several large trials have reported stable or even increased productivity", "companies that adopted it saw a sharp fall in sick days", "many firms found it easier to attract talented staff"],
    },
    paragraphs: [
      ["The five-day work week is a relatively recent invention, and there is growing evidence that it may no longer be fit for purpose."],
      ["Supporters of a four-day week point out that {evidence}.", "Employees with an extra day off report better mental health, stronger relationships and more time for learning."],
      ["Nevertheless, the model is not universally applicable.", "Hospitals, schools and customer-facing businesses cannot simply close for a day, and compressing hours may lead to burnout rather than balance."],
      ["The four-day week is therefore best seen not as a rigid rule, but as an invitation to rethink how we measure work.", "Output, not hours, should be the yardstick of productivity."],
    ],
    vocab: [["Fit for purpose", "Suitable for its intended use"], ["Universally applicable", "Usable in every situation"], ["Burnout", "Exhaustion from overwork"], ["Yardstick", "A standard for measuring"]],
    tip: "Signal your final position with \"therefore\" and restate it in a fresh, memorable way.",
  },
  {
    key: "misinfo",
    topic: "Society",
    emoji: "📰",
    title: "Misinformation in the digital age",
    slots: {
      ex: ["health scares", "election rumors", "fake celebrity quotes", "doctored images of natural disasters"],
    },
    paragraphs: [
      ["Never before has information travelled so quickly, and never before has it been so difficult to tell truth from fiction."],
      ["Social media algorithms tend to reward content that provokes strong emotions, which means that sensational falsehoods, such as {ex}, often spread faster than careful corrections."],
      ["Some argue that platforms should be held legally responsible for what they host.", "Others fear that heavy regulation could threaten free speech and hand governments too much power over public debate."],
      ["Perhaps the most sustainable solution lies in education.", "Teaching people to question sources, check facts and recognize manipulation may be our strongest defense against a polluted information ecosystem."],
    ],
    vocab: [["Sensational", "Designed to shock or excite"], ["Falsehoods", "Lies; untrue statements"], ["Manipulation", "Unfair influence"], ["Ecosystem", "A complex connected system"]],
    tip: "Inversion adds power: \"Never before has information travelled so quickly.\"",
  },
  {
    key: "tourism",
    topic: "Travel",
    emoji: "🗺️",
    title: "Tourism in {city}: blessing or burden?",
    slots: {
      city: ["Venice", "Barcelona", "Kyoto", "Amsterdam", "Bali", "Dubrovnik"],
    },
    paragraphs: [
      ["For many destinations, tourism is a double-edged sword, and few places illustrate this better than {city}."],
      ["On the one hand, visitors bring in vital revenue, sustain thousands of jobs and help preserve cultural heritage that might otherwise be neglected."],
      ["On the other hand, overtourism has driven up rents, pushed residents out of historic neighborhoods and placed enormous strain on local infrastructure.", "In some streets, locals now feel like strangers in their own city."],
      ["The challenge is not to stop tourism but to manage it intelligently.", "Measures such as visitor caps, tourist taxes and promoting off-season travel can ensure that the city remains a home, not merely a backdrop."],
    ],
    vocab: [["Double-edged sword", "Something with both good and bad effects"], ["Revenue", "Income"], ["Overtourism", "Too many tourists"], ["Backdrop", "Scenery behind the main action"]],
    tip: "Idioms like \"a double-edged sword\" are effective in introductions, but use them sparingly.",
  },
  {
    key: "failure",
    topic: "Personal Growth",
    emoji: "🌱",
    title: "The underrated value of failure",
    slots: {
      ex: ["Thomas Edison's thousands of failed experiments", "J.K. Rowling's many rejected manuscripts", "the countless startups that pivoted after a disastrous first product", "athletes who lost repeatedly before becoming champions"],
    },
    paragraphs: [
      ["In a culture that celebrates success, failure is often treated as something shameful, to be hidden or forgotten as quickly as possible."],
      ["Yet history is full of examples, from {ex}, that suggest failure is less the opposite of success than a necessary part of it."],
      ["Failure provides feedback that success rarely does.", "It exposes weaknesses in our assumptions and forces us to adapt.", "Crucially, it also builds resilience, the ability to recover and try again."],
      ["This is not to romanticize failure; repeated setbacks can be painful and costly.", "But if we learn to view mistakes as data rather than verdicts, we free ourselves to take the risks that real growth requires."],
    ],
    vocab: [["Underrated", "Valued less than it deserves"], ["Resilience", "Ability to recover from difficulty"], ["Romanticize", "Make something seem better than it is"], ["Verdict", "A final judgement"]],
    tip: "\"Less X than Y\" is an elegant way to redefine an idea: \"less the opposite of success than a part of it\".",
  },
  {
    key: "cities",
    topic: "Society",
    emoji: "🌆",
    title: "Designing cities for people, not cars",
    slots: {
      city: ["Copenhagen", "Paris", "Amsterdam", "Barcelona", "Seoul"],
      change: ["turned a busy highway into a riverside park", "created hundreds of kilometers of protected bike lanes", "converted parking spaces into public squares", "made its city center largely car-free"],
    },
    paragraphs: [
      ["For most of the twentieth century, cities were designed around the private car.", "The consequences, including congestion, pollution and isolated communities, are now painfully clear."],
      ["A growing number of cities are reversing this trend.", "{city}, for instance, has {change}, with remarkable effects on air quality and street life."],
      ["Such changes are not without controversy.", "Business owners often fear losing customers, and residents in suburbs may feel that their needs are being overlooked."],
      ["Nevertheless, the evidence increasingly suggests that streets designed for people are healthier, safer and more economically vibrant.", "The question is no longer whether to change, but how quickly."],
    ],
    vocab: [["Congestion", "Heavy traffic"], ["Reverse a trend", "Change the direction of a pattern"], ["Controversy", "Public disagreement"], ["Vibrant", "Full of life and energy"]],
    tip: "End with a forward-looking sentence: \"The question is no longer whether..., but how...\"",
  },
];
