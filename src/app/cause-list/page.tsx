import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FetchCauselistButton } from "@/components/fetch-causelist-button";
import { WatchedAdvocates } from "@/components/watched-advocates";
import { CauselistCalendar } from "@/components/causelist-calendar";
import { PushSubscribeButton } from "@/components/push-subscribe-button";
import type { CauselistEntryRow, WatchedAdvocate, Case } from "@/lib/types";

type TrackedCaseInfo = Pick<
  Case,
  "id" | "title" | "case_number" | "status" | "next_hearing_date"
>;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString();
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function matchedWatchedAdvocate(
  entry: CauselistEntryRow,
  watched: WatchedAdvocate[],
): string | null {
  const haystack = (entry.raw_text ?? "").toUpperCase();
  for (const w of watched) {
    const needle = w.name.trim().toUpperCase();
    if (needle && haystack.includes(needle)) return w.name;
  }
  return null;
}

function splitEntries(
  entries: CauselistEntryRow[],
  myCaseByNumber: Map<string, TrackedCaseInfo>,
  watched: WatchedAdvocate[],
) {
  const tracked: { entry: CauselistEntryRow; case: TrackedCaseInfo }[] = [];
  const advocateFlagged: { entry: CauselistEntryRow; advocate: string }[] = [];
  const rest: CauselistEntryRow[] = [];

  for (const entry of entries) {
    const trackedCase = myCaseByNumber.get(entry.case_no);
    const advocate = matchedWatchedAdvocate(entry, watched);
    if (trackedCase) {
      tracked.push({ entry, case: trackedCase });
    } else if (advocate) {
      advocateFlagged.push({ entry, advocate });
    } else {
      rest.push(entry);
    }
  }

  return { tracked, advocateFlagged, rest };
}

function EntryCard({
  entry,
  badge,
}: {
  entry: CauselistEntryRow;
  badge?: { label: string; className: string };
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-medium">
            #{entry.serial_no ?? "—"} · {entry.case_no}
          </span>
          {entry.is_paperless && (
            <span className="ml-2 text-xs text-zinc-500">(paperless)</span>
          )}
          {entry.linked_from_serial && (
            <span className="ml-2 text-xs text-zinc-500">(with above)</span>
          )}
        </div>
        {badge && (
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <p>
        {entry.applicant ?? "—"} <span className="text-zinc-500">vs</span>{" "}
        {entry.respondent ?? "—"}
      </p>
      <p className="text-xs text-muted">
        Court {entry.court_no ?? "—"}
        {entry.judge && ` · ${entry.judge}`}
        {entry.category && ` · ${entry.category}`}
      </p>
      {entry.tags.length > 0 && (
        <p className="text-xs text-zinc-500">{entry.tags.join(" · ")}</p>
      )}
      {entry.advocate_after_dash && (
        <p className="text-xs text-zinc-500">
          Advocate: {entry.advocate_after_dash}
        </p>
      )}
    </div>
  );
}

export default async function CauseListPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: requestedDate } = await searchParams;
  const supabase = await createClient();
  const today = todayIso();

  const [liteEntriesRes, casesRes, watchedRes] = await Promise.all([
    supabase
      .from("causelist_entries")
      .select("causelist_date, case_no")
      .returns<{ causelist_date: string; case_no: string }[]>(),
    supabase
      .from("cases")
      .select("id, title, case_number, status, next_hearing_date")
      .returns<TrackedCaseInfo[]>(),
    supabase
      .from("watched_advocates")
      .select("*")
      .order("name")
      .returns<WatchedAdvocate[]>(),
  ]);

  const liteEntries = liteEntriesRes.data ?? [];
  const myCases = casesRes.data ?? [];
  const watched = watchedRes.data ?? [];

  const myCaseByNumber = new Map(
    myCases.filter((c) => c.case_number).map((c) => [c.case_number as string, c]),
  );

  const availableDates = [...new Set(liteEntries.map((r) => r.causelist_date))];
  const trackedCounts: Record<string, number> = {};
  for (const e of liteEntries) {
    if (myCaseByNumber.has(e.case_no)) {
      trackedCounts[e.causelist_date] = (trackedCounts[e.causelist_date] ?? 0) + 1;
    }
  }

  const activeDate = requestedDate ?? availableDates[0] ?? today;

  const [activeEntriesRes, todayEntriesRes] = await Promise.all([
    supabase
      .from("causelist_entries")
      .select("*")
      .eq("causelist_date", activeDate)
      .order("court_no", { ascending: true })
      .order("serial_no", { ascending: true })
      .returns<CauselistEntryRow[]>(),
    activeDate === today
      ? Promise.resolve(null)
      : supabase
          .from("causelist_entries")
          .select("*")
          .eq("causelist_date", today)
          .returns<CauselistEntryRow[]>(),
  ]);

  const activeSplit = splitEntries(
    activeEntriesRes.data ?? [],
    myCaseByNumber,
    watched,
  );
  const todaySplit = todayEntriesRes
    ? splitEntries(todayEntriesRes.data ?? [], myCaseByNumber, watched)
    : activeSplit;

  const hasDataForActiveDate = availableDates.includes(activeDate);
  const hasDataForToday = availableDates.includes(today);

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cause List Watcher
          </h1>
          <div className="flex items-center gap-4">
            <FetchCauselistButton />
            <Link
              href="/"
              className="text-sm font-medium text-accent hover:underline"
            >
              ← Back to cases
            </Link>
          </div>
        </div>

        <PushSubscribeButton />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
              <section className="flex flex-col gap-3 rounded-lg border border-accent-border bg-accent-bg p-4 md:w-72 md:flex-shrink-0">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Today&apos;s Cases
                  </h2>
                  <span className="text-xs text-zinc-500">{today}</span>
                </div>

                {!hasDataForToday && (
                  <p className="text-sm text-muted">
                    No causelist fetched for today yet.
                  </p>
                )}

                {hasDataForToday && (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <strong className="font-semibold text-foreground">
                          {todaySplit.tracked.length}
                        </strong>
                        <span className="text-muted">
                          tracked
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                        <strong className="font-semibold text-foreground">
                          {todaySplit.advocateFlagged.length}
                        </strong>
                        <span className="text-muted">
                          flagged
                        </span>
                      </span>
                    </div>

                    {todaySplit.tracked.length > 0 && (
                      <ul className="flex flex-col gap-2 border-t border-accent-border pt-3">
                        {todaySplit.tracked.slice(0, 6).map(({ entry, case: c }) => (
                          <li key={entry.id} className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-accent-strong">
                              Court {entry.court_no ?? "—"} · Sl. {entry.serial_no ?? "—"}
                            </span>
                            <span className="truncate text-xs text-muted">
                              {c.title.toUpperCase()}{" "}
                              <span className="text-zinc-500">
                                ({c.case_number ?? "—"})
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {activeDate !== today && (
                  <Link
                    href={`/cause-list?date=${today}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    View today →
                  </Link>
                )}
              </section>

              <div className="flex-1">
                <CauselistCalendar
                  selectedDate={activeDate}
                  trackedCounts={trackedCounts}
                  availableDates={availableDates}
                />
              </div>
            </div>

            {!hasDataForActiveDate && (
              <p className="text-sm text-muted">
                No causelist fetched for {activeDate}. The source site only
                publishes the next hearing day at a time — click &quot;Fetch
                latest causelist&quot; above to pull whatever&apos;s currently
                published, or pick a date you&apos;ve already fetched (marked
                on the calendar).
              </p>
            )}

            {hasDataForActiveDate && (
              <>
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-medium text-foreground">
                    Your tracked cases listed on {activeDate} (
                    {activeSplit.tracked.length})
                  </h2>
                  {activeSplit.tracked.length === 0 && (
                    <p className="text-sm text-muted">
                      None of your tracked cases appear on this date&apos;s
                      list.
                    </p>
                  )}
                  {activeSplit.tracked.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-hover">
                          <tr>
                            <th className="px-3 py-2 font-medium">Serial #</th>
                            <th className="px-3 py-2 font-medium">Court</th>
                            <th className="px-3 py-2 font-medium">Title</th>
                            <th className="px-3 py-2 font-medium">Case #</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">
                              Next hearing
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSplit.tracked.map(({ entry, case: c }) => (
                            <tr
                              key={entry.id}
                              className="border-t border-border"
                            >
                              <td className="px-3 py-2">
                                {entry.serial_no ?? "—"}
                                {entry.linked_from_serial && (
                                  <span className="ml-1 text-xs text-zinc-500">
                                    (with above)
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {entry.court_no ?? "—"}
                              </td>
                              <td className="px-3 py-2">{c.title}</td>
                              <td className="px-3 py-2">
                                {c.case_number ?? "—"}
                              </td>
                              <td className="px-3 py-2 capitalize">
                                {c.status}
                              </td>
                              <td className="px-3 py-2">
                                {formatDate(c.next_hearing_date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-medium text-foreground">
                    Watched advocate matches (
                    {activeSplit.advocateFlagged.length})
                  </h2>
                  <p className="text-sm text-muted">
                    Cases not yet in your tracker, but involving a watched
                    advocate.
                  </p>
                  <div className="flex flex-col gap-2">
                    {activeSplit.advocateFlagged.map(({ entry, advocate }) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        badge={{
                          label: advocate,
                          className:
                            "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                        }}
                      />
                    ))}
                  </div>
                </section>

                <details className="flex flex-col gap-3">
                  <summary className="cursor-pointer text-lg font-medium text-foreground">
                    All other entries ({activeSplit.rest.length})
                  </summary>
                  <div className="mt-3 flex flex-col gap-2">
                    {activeSplit.rest.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-8">
            <WatchedAdvocates advocates={watched} />
          </aside>
        </div>
      </main>
    </div>
  );
}
