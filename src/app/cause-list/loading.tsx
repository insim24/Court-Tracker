// Shown instantly when navigating to /cause-list, while the page's Supabase
// queries are still in flight. See src/app/loading.tsx for why this exists.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans animate-fade-in">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 animate-pulse rounded-md bg-surface" />
          <div className="flex items-center gap-4">
            <div className="h-9 w-40 animate-pulse rounded-full bg-surface" />
            <div className="h-5 w-28 animate-pulse rounded bg-surface" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
              <div className="h-48 w-full animate-pulse rounded-lg border border-accent-border bg-accent-bg md:w-72 md:flex-shrink-0" />
              <div className="h-72 flex-1 animate-pulse rounded-lg border border-accent-border bg-accent-bg" />
            </div>
            <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
          </div>
          <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
        </div>
      </main>
    </div>
  );
}
