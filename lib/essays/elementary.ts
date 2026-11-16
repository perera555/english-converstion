import type { EssayTemplate } from "../essay-types";
import { CITIES } from "../templates/pools";

export const elementaryEssays: EssayTemplate[] = [
  {
    key: "holiday",
    topic: "Travel",
    emoji: "🏝️",
    title: "My last holiday in {place}",
    slots: {
      place: ["Thailand", "Italy", "Japan", "Spain", "Egypt", "Canada", "Bali"],
      who: ["my family", "my best friend", "my cousins", "my classmates"],
      act: ["visited old temples and markets", "swam in the clear blue sea", "climbed a small mountain", "took a boat trip along the river"],
      food: ["the street food", "the fresh seafood", "the local desserts", "the spicy dishes"],
      bad: ["it rained for two days", "I lost my sunglasses", "the hotel was a bit noisy", "I got a little sunburned"],
    },
    paragraphs: [
      ["Last summer, I went to {place} with {who}.", "We stayed there for one week.", "It was my first time in {place}, so I was very excited."],
      ["Every day, we did something new.", "We {act}.", "I also loved {food}.", "It was cheaper and tastier than I expected."],
      ["Not everything was perfect.", "For example, {bad}.", "But I didn't mind, because the trip was wonderful.", "I want to go back again next year."],
    ],
    vocab: [["Holiday", "Time off for travel or rest"], ["Expected", "Thought something would happen"], ["Didn't mind", "Was not upset"], ["Wonderful", "Very good"]],
    tip: "Tell past stories with the past simple: went, stayed, did, loved. Irregular verbs need practice!",
  },
  {
    key: "birthday",
    topic: "Celebrations",
    emoji: "🎂",
    title: "My {age} birthday",
    slots: {
      age: ["tenth", "sixteenth", "eighteenth", "twenty-first", "thirtieth"],
      surprise: ["a surprise party", "a trip to the beach", "a dinner at my favorite restaurant", "a picnic in the park"],
      gift: ["a new bike", "a guitar", "a beautiful watch", "a camera", "concert tickets"],
    },
    paragraphs: [
      ["I will never forget my {age} birthday.", "I thought it was a normal day.", "I went to work in the morning, and nobody said anything."],
      ["In the evening, my friends took me out.", "They planned {surprise} for me!", "Everybody sang \"Happy Birthday\", and I almost cried."],
      ["My parents gave me {gift}.", "It was exactly what I wanted.", "That day showed me how lucky I am to have such great people in my life."],
    ],
    vocab: [["Forget", "Not remember"], ["Took me out", "Took me somewhere for fun"], ["Planned", "Prepared in advance"], ["Lucky", "Having good luck"]],
    tip: "Use \"I will never forget...\" to start a story about a special memory.",
  },
  {
    key: "first-day",
    topic: "Work",
    emoji: "🏫",
    title: "My first day at {place}",
    slots: {
      place: ["a new school|teacher", "my new job|manager", "university|professor", "a new office|boss"],
      feel: ["nervous", "worried", "shy", "a little scared"],
      helper: ["Emma", "Ravi", "Carlos", "Yuki", "Grace"],
    },
    paragraphs: [
      ["My first day at {place} was last September.", "I woke up early because I was very {feel}.", "I didn't know anyone there."],
      ["When I arrived, the {place:1} smiled and showed me around.", "Then I met {helper}.", "{helper} was very friendly and helped me all day.", "We had lunch together and talked about our hobbies."],
      ["By the end of the day, I felt much better.", "Now {helper} is one of my best friends.", "I learned that new beginnings are not so scary."],
    ],
    vocab: [["Nervous", "Worried and a little afraid"], ["Showed me around", "Gave me a tour"], ["By the end of", "When something finished"], ["Beginnings", "Starts"]],
    tip: "Contrast feelings to make your story interesting: \"At first I was nervous, but later I felt better.\"",
  },
  {
    key: "gift",
    topic: "Memories",
    emoji: "🎁",
    title: "The best gift I ever got",
    slots: {
      gift: ["an old wooden box|my grandfather|He made it with his own hands", "a handwritten letter|my mother|She wrote about my childhood", "a small plant|my best friend|She said it would grow like our friendship", "a photo album|my brother|He collected photos from my whole life"],
      when: ["when I was eight", "on my last birthday", "before I moved abroad", "when I finished school"],
    },
    paragraphs: [
      ["The best gift I ever received was {gift}.", "I got it from {gift:1} {when}."],
      ["It wasn't expensive.", "{gift:2}.", "When I opened it, I felt very emotional."],
      ["Today, I still keep it in my room.", "It reminds me that the best gifts come from the heart, not from the shop."],
    ],
    vocab: [["Received", "Got"], ["Expensive", "Costing a lot of money"], ["Emotional", "Having strong feelings"], ["Reminds me", "Makes me remember"]],
    tip: "\"The best ... I ever ...\" is a natural pattern: \"the best film I ever saw\".",
  },
  {
    key: "admire",
    topic: "People",
    emoji: "🌟",
    title: "A person I admire: my {p}",
    slots: {
      p: ["grandmother|She|her|she", "teacher|She|her|she", "father|He|him|he", "older sister|She|her|she", "uncle|He|him|he"],
      quality: ["patient and wise", "hard-working and honest", "brave and kind", "calm and generous"],
      story: ["worked two jobs to support the family", "learned to use a computer at the age of seventy", "helped many poor children in our town", "started a small business from nothing"],
    },
    paragraphs: [
      ["The person I admire most is my {p}.", "{p:1} is {quality}."],
      ["When {p:3} was young, life was difficult.", "But {p:3} never gave up.", "For example, {p:3} {story}."],
      ["I want to be like {p:2} in the future.", "{p:1} taught me that hard work and kindness are more important than money."],
    ],
    vocab: [["Admire", "Respect and look up to"], ["Wise", "Having good judgement"], ["Give up", "Stop trying"], ["Kindness", "Being nice to others"]],
    tip: "Support your opinions with an example: \"For example, she...\"",
  },
  {
    key: "relax",
    topic: "Places",
    emoji: "🌳",
    title: "My favorite place to relax",
    slots: {
      place: ["a small café near my house|the smell of coffee", "the beach in {city}|the sound of the waves", "my grandmother's garden|the colorful flowers", "the public library|the quiet atmosphere", "a hill outside town|the view of the sunset"],
      city: CITIES,
      act: ["read a book", "listen to music", "write in my diary", "just sit and think"],
    },
    paragraphs: [
      ["Everyone needs a place to relax.", "My favorite place is {place}."],
      ["I go there when I feel stressed or tired.", "I love {place:1}.", "Usually, I {act} for an hour or two."],
      ["After that, I feel calm and full of energy again.", "I think it's important to have a special place like this."],
    ],
    vocab: [["Relax", "Rest and feel calm"], ["Stressed", "Worried because of pressure"], ["Atmosphere", "The feeling of a place"], ["Full of energy", "Ready to do things"]],
    tip: "Use \"when\" to connect a situation and an action: \"I go there when I feel stressed.\"",
  },
  {
    key: "skill",
    topic: "Hobbies",
    emoji: "🚲",
    title: "Learning to {s}",
    slots: {
      s: ["swim|swimming|the water", "ride a bike|riding|the bike", "cook|cooking|the kitchen", "play the guitar|playing|the guitar", "drive|driving|the car"],
      who: ["my father", "my older brother", "a good teacher", "my best friend"],
    },
    paragraphs: [
      ["When I was younger, I really wanted to learn to {s}.", "At first, it was very hard for me.", "I was afraid of {s:2}."],
      ["{who:0} helped me every weekend.", "I made a lot of mistakes, and sometimes I wanted to stop.", "But I practiced again and again."],
      ["After a few months, I could do it well!", "Now I really enjoy {s:1}.", "This experience taught me that practice makes progress."],
    ],
    vocab: [["At first", "At the beginning"], ["Afraid of", "Scared of"], ["Mistakes", "Things done wrong"], ["Practice makes progress", "Practicing helps you improve"]],
    tip: "\"Could\" is the past of \"can\": \"After a few months, I could swim.\"",
  },
  {
    key: "bad-day",
    topic: "Daily Life",
    emoji: "🙈",
    title: "The day everything went wrong",
    slots: {
      start: ["my alarm didn't ring", "I spilled coffee on my shirt", "I missed the bus", "my phone battery died"],
      mid: ["I forgot my wallet at home", "it started to rain and I had no umbrella", "I went to the wrong room for my meeting", "I locked my keys in the car"],
      end: ["a stranger shared an umbrella with me", "my friend bought me lunch", "my boss just laughed", "I found twenty dollars on the street"],
    },
    paragraphs: [
      ["Last Monday was the worst day of my life.", "First, {start}.", "I was late, and I felt terrible."],
      ["Then, {mid}.", "I couldn't believe my bad luck!", "I wanted to go home and sleep."],
      ["But in the end, something nice happened: {end}.", "I laughed about the whole day.", "Now it is one of my favorite funny stories."],
    ],
    vocab: [["Went wrong", "Had problems"], ["Terrible", "Very bad"], ["Bad luck", "Unlucky things happening"], ["In the end", "Finally"]],
    tip: "Linkers like first, then, but in the end make stories easy to follow.",
  },
];
