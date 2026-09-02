// Shown instantly when navigating to /cgat-import, covering the moment
// before its client bundle takes over. See src/app/loading.tsx for why
// this exists.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans animate-fade-in">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 animate-pulse rounded-md bg-surface" />
          <div className="h-5 w-28 animate-pulse rounded bg-surface" />
        </div>
        <div className="flex gap-1 border-b border-border pb-2">
          <div className="h-6 w-20 animate-pulse rounded bg-surface" />
          <div className="h-6 w-24 animate-pulse rounded bg-surface" />
          <div className="h-6 w-28 animate-pulse rounded bg-surface" />
        </div>
        <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
      </main>
    </div>
  );
}
