"use client";

import { useMemo, useState } from "react";
import { deleteCase } from "@/app/actions";
import { RefreshCgatButton } from "@/components/refresh-cgat-button";
import type { Case } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  // Fixed locale (not the runtime default) so SSR and client hydration
  // always agree, regardless of server/browser locale settings.
  return new Date(value + "T00:00:00").toLocaleDateString("en-GB");
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  closed: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.closed;
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-blue-400 dark:text-blue-500"
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 11L14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MobileCaseBrowser({ cases }: { cases: Case[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.title, c.case_number, c.court, c.status]
        .filter((v): v is string => Boolean(v))
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [cases, query]);

  return (
    <>
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-blue-200 p-4 text-center text-sm text-zinc-500 dark:border-blue-900/40 dark:text-zinc-400">
            No cases match &quot;{query}&quot;.
          </p>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.98] dark:border-blue-900/30 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                {c.title}
              </h3>
              <StatusPill status={c.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-zinc-400 dark:text-zinc-500">Case #</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {c.case_number ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400 dark:text-zinc-500">Court</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {c.court ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-400 dark:text-zinc-500">
                  Next hearing
                </dt>
                <dd className="font-medium text-blue-700 dark:text-blue-400">
                  {formatDate(c.next_hearing_date)}
                </dd>
              </div>
            </dl>
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-blue-50 pt-2 dark:border-blue-900/20">
              <div>
                {c.cgat_case_type_id && c.cgat_case_no && c.cgat_case_year && (
                  <RefreshCgatButton caseId={c.id} />
                )}
              </div>
              <form action={deleteCase.bind(null, c.id)}>
                <button
                  type="submit"
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 active:scale-95 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your cases…"
            aria-label="Search your cases"
            className="w-full rounded-full border border-blue-100 bg-white py-2.5 pr-4 pl-9 text-sm text-black shadow-sm transition-all duration-200 outline-none placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-blue-900/30 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-blue-900/30"
          />
        </div>
      </div>
    </>
  );
}
