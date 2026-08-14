import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CaseForm } from "@/components/case-form";
import { RefreshCgatButton } from "@/components/refresh-cgat-button";
import { CaseCalendar } from "@/components/case-calendar";
import { MobileCaseBrowser } from "@/components/mobile-case-browser";
import { CaseOrders } from "@/components/case-orders";
import { FetchAllOrdersButton } from "@/components/fetch-all-orders-button";
import { deleteCase } from "@/app/actions";
import type { Case, CaseOrderRow } from "@/lib/types";

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

  const { data: allOrders } = await supabase
    .from("case_orders")
    .select("*")
    .order("order_date", { ascending: false, nullsFirst: false })
    .returns<CaseOrderRow[]>();

  const ordersByCase: Record<string, CaseOrderRow[]> = {};
  for (const o of allOrders ?? []) {
    (ordersByCase[o.case_id] ??= []).push(o);
  }

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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-blue-100/80 via-indigo-50/50 to-transparent lg:hidden dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent"
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-6 lg:gap-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Court Case Tracker
          </h1>
          <div className="flex flex-wrap gap-3 lg:gap-4">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px] lg:items-start lg:gap-8">
          <aside className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            {/* Mobile: full-size hero calendar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm shadow-blue-100/80 lg:hidden dark:border-blue-900/40 dark:from-slate-900 dark:to-blue-950/30 dark:shadow-none">
              <h2 className="text-sm font-semibold tracking-wide text-blue-700 uppercase dark:text-blue-400">
                Your Calendar
              </h2>
              <CaseCalendar
                selectedDate={selectedDate ?? null}
                hearingCounts={hearingCounts}
                compact={false}
              />
            </div>
            {/* Desktop: original compact sidebar calendar, unchanged */}
            <div className="hidden lg:flex lg:flex-col lg:gap-3">
              <h2 className="text-sm font-medium text-black dark:text-zinc-50">
                Calendar
              </h2>
              <CaseCalendar
                selectedDate={selectedDate ?? null}
                hearingCounts={hearingCounts}
              />
            </div>
          </aside>

          <section className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                {selectedDate ? `Cases on ${selectedDate}` : "Cases"}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <FetchAllOrdersButton />
                {selectedDate && (
                  <Link
                    href="/"
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear filter ×
                  </Link>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                Failed to load cases: {error.message}
              </p>
            )}

            {!error && (!cases || cases.length === 0) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No cases yet. Add one below.
              </p>
            )}

            {!error && cases && cases.length > 0 && selectedDate && visibleCases.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No cases have a hearing on this date.
              </p>
            )}

            {!error && visibleCases.length > 0 && (
              <>
                {/* Desktop: original table, unchanged */}
                <div className="hidden overflow-x-auto rounded-lg border border-black/[.08] lg:block dark:border-white/[.145]">
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
                              <CaseOrders
                                caseId={c.id}
                                orders={ordersByCase[c.id] ?? []}
                              />
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

                {/* Mobile: interactive card list + search bar (search appears after the list) */}
                <MobileCaseBrowser
                  cases={visibleCases}
                  ordersByCase={ordersByCase}
                />
              </>
            )}
          </section>

          <section className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
            <h2 className="text-lg font-medium text-black dark:text-zinc-50">
              Add a Case
            </h2>
            <CaseForm />
          </section>
        </div>
      </main>
    </div>
  );
}
