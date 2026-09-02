// Shown instantly when navigating to this route, while the page's Supabase
// queries are still in flight. Without this, a click gave no visual
// feedback until the whole page resolved, which made navigation feel
// unresponsive (and prompted repeat clicks) and then pop in abruptly.
export default function Loading() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background font-sans animate-fade-in">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-6 lg:gap-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
          <div className="h-8 w-56 animate-pulse rounded-md bg-surface" />
          <div className="flex flex-wrap gap-3 lg:gap-4">
            <div className="h-5 w-36 animate-pulse rounded bg-surface" />
            <div className="h-5 w-44 animate-pulse rounded bg-surface" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="flex flex-col gap-3">
            <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
          </div>
          <div className="h-72 animate-pulse rounded-lg border border-accent-border bg-accent-bg" />
        </div>
      </main>
    </div>
  );
}
