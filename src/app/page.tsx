import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CaseForm } from "@/components/case-form";
import { RefreshCgatButton } from "@/components/refresh-cgat-button";
import { CaseCalendar } from "@/components/case-calendar";
import { deleteCase } from "@/app/actions";
import type { Case } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: selectedDate } = await searchParams;
  const supabase = await createClient();
  const { data: cases, error } = await supabase
    .from("cases")
    .select("*")
    .order("next_hearing_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Case[]>();

  const hearingCounts: Record<string, number> = {};
  for (const c of cases ?? []) {
    if (c.next_hearing_date) {
      hearingCounts[c.next_hearing_date] =
        (hearingCounts[c.next_hearing_date] ?? 0) + 1;
    }
  }

  const visibleCases = selectedDate
    ? (cases ?? []).filter((c) => c.next_hearing_date === selectedDate)
    : (cases ?? []);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Court Case Tracker
          </h1>
          <div className="flex gap-4">
            <Link
              href="/cause-list"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Cause List Watcher →
            </Link>
            <Link
              href="/cgat-import"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Import from CGAT Srinagar →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px] lg:items-start">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                Add a Case
              </h2>
              <CaseForm />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  {selectedDate ? `Cases on ${selectedDate}` : "Cases"}
                </h2>
                {selectedDate && (
                  <Link
                    href="/"
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear filter ×
                  </Link>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  Failed to load cases: {error.message}
                </p>
              )}

              {!error && (!cases || cases.length === 0) && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No cases yet. Add one above.
                </p>
              )}

              {!error && cases && cases.length > 0 && selectedDate && visibleCases.length === 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No cases have a hearing on this date.
                </p>
              )}

              {!error && visibleCases.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/[.03] dark:bg-white/[.06]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Title</th>
                        <th className="px-3 py-2 font-medium">Case #</th>
                        <th className="px-3 py-2 font-medium">Court</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Next hearing</th>
                        <th className="px-3 py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCases.map((c) => (
                        <tr
                          key={c.id}
                          className="border-t border-black/[.08] dark:border-white/[.145]"
                        >
                          <td className="px-3 py-2">{c.title}</td>
                          <td className="px-3 py-2">{c.case_number ?? "—"}</td>
                          <td className="px-3 py-2">{c.court ?? "—"}</td>
                          <td className="px-3 py-2 capitalize">{c.status}</td>
                          <td className="px-3 py-2">
                            {formatDate(c.next_hearing_date)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-end gap-2">
                              {c.cgat_case_type_id &&
                                c.cgat_case_no &&
                                c.cgat_case_year && (
                                  <RefreshCgatButton caseId={c.id} />
                                )}
                              <form action={deleteCase.bind(null, c.id)}>
                                <button
                                  type="submit"
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-3 lg:sticky lg:top-8">
            <h2 className="text-sm font-medium text-black dark:text-zinc-50">
              Calendar
            </h2>
            <CaseCalendar
              selectedDate={selectedDate ?? null}
              hearingCounts={hearingCounts}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
