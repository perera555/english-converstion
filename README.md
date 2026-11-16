# SpeakUp English (free)

A free English speaking practice app from **Beginner (A1) to Native (C2)**. It runs in the browser and can be installed on Windows, Mac, iPhone/iPad, Android and Chromebook.

## What's inside

| Section | Content |
| --- | --- |
| 💬 Conversations | **1,250** dialogues (250 per level: Beginner, Elementary, Intermediate, Advanced, Native) |
| 📝 Essays | **1,000** essays (200 per level) |
| 👅 Tongue Twisters | **1,000** twisters in 20 chapters / 5 levels, with a pass-to-unlock challenge |
| 🎓 IELTS & PTE | **160** model essays (4 question types × 20 topics × 2 exams) + timed writing practice |

## Features

- 🎥 **Real videos**: verified YouTube lessons with real native speakers, embedded per topic.
- 🎬 **Animated video mode**: each dialogue as a 3D scene with talking characters and karaoke subtitles.
- 🎤 **Karaoke**: words light up as they're spoken (Web Speech API voices, speed and accent picker).
- 🗣️ **Voice scoring**: shadowing, role-play and the twister challenge check your speech word by word.
- ⏱️ **15 minutes a day**: the timer counts only while you practice. You get a goal-complete popup, bonus time, streaks and a weekly chart.
- 📲 **Installable PWA** with a device-specific install guide.
- Progress, scores and drafts are saved in the browser. No account is needed.

Speech recognition works in Chrome, Edge, Safari and Samsung Internet. Firefox can play voices but cannot score speech.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Content is generated at build time from templates in `lib/templates/`, `lib/essays/`, `lib/twisters.ts` and `lib/exam-topics.ts`.
