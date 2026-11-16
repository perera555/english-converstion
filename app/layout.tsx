import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import InstallButton from "@/components/InstallButton";
import Tilt3D from "@/components/Tilt3D";
import { PracticeBadge } from "@/components/PracticeTimer";
import { BottomTabs, HeaderLinks } from "@/components/NavLinks";
import MicCheck from "@/components/MicCheck";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SpeakUp: Free English Conversations, Essays & Tongue Twisters",
    template: "%s · SpeakUp English",
  },
  description:
    "Free English speaking practice from beginner to native: 1,250 conversations, 1,000 essays and 1,000 tongue twisters with voice, karaoke, real videos and speech scoring.",
  applicationName: "SpeakUp English",
  appleWebApp: { capable: true, title: "SpeakUp", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/180" },
};

export const viewport: Viewport = {
  themeColor: "#07070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="relative min-h-full overflow-x-hidden">
        <div aria-hidden className="bg-aurora pointer-events-none fixed inset-0 -z-10" />
        <Tilt3D />
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07070f]/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-lg font-black text-black shadow-lg shadow-fuchsia-500/30">
                S
              </span>
              <span className="text-lg font-black tracking-tight">
                Speak<span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">Up</span>
              </span>
              <span className="hidden rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 sm:inline">FREE</span>
            </Link>
            <HeaderLinks />
            <nav className="flex items-center gap-2 sm:gap-3">
              <PracticeBadge />
              <MicCheck />
              <InstallButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 pb-24">{children}</main>
        <footer className="border-t border-white/5 pb-24 pt-8 text-center text-xs text-white/40 lg:pb-8">
          SpeakUp English · 100% free · 1,250 conversations · 1,000 essays · 1,000 tongue twisters · 160 IELTS/PTE essays. Works best in Chrome,
          Edge or Safari.
        </footer>
        <BottomTabs />
      </body>
    </html>
  );
}
