import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <div className="text-6xl">🤔</div>
      <h1 className="mt-4 text-3xl font-black">Conversation not found</h1>
      <p className="mt-2 text-white/60">That page doesn&apos;t exist. Pick a conversation from the library.</p>
      <Link href="/#library" className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 font-bold">
        Go to library
      </Link>
    </div>
  );
}
