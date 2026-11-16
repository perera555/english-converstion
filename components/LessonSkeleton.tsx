/** Instant placeholder shown while a lesson page loads. */
export default function LessonSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-5xl animate-pulse py-8" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="mb-4 h-4 w-48 rounded bg-white/10" />
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-3xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-8 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-6 h-20 rounded-3xl bg-white/5" />
      <div className="mt-6 aspect-video rounded-3xl bg-white/5" />
      <p className="mt-6 text-center text-sm text-white/50">Loading {label}…</p>
    </div>
  );
}
