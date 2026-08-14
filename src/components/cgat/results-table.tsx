"use client";

import { useState, useTransition } from "react";
import { importCgatCases, type ImportCasesState } from "@/app/actions";

const initialImportState: ImportCasesState = {
  error: null,
  imported: 0,
  skipped: 0,
};

export type NormalizedCgatResult = {
  // null when the matter only has a diary number and was never formally
  // assigned a case number (e.g. rejected before registration).
  caseno: string | null;
  diaryno: string;
  applicant: string;
  respondent: string;
  dateoffiling: string;
  status: string | null;
};

export function CgatResultsTable({
  results,
}: {
  results: NormalizedCgatResult[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importState, setImportState] =
    useState<ImportCasesState>(initialImportState);
  const [isImporting, startImport] = useTransition();

  function toggle(diaryno: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(diaryno)) next.delete(diaryno);
      else next.add(diaryno);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === results.length
        ? new Set()
        : new Set(results.map((r) => r.diaryno)),
    );
  }

  function handleImport() {
    const rows = results
      .filter((r) => selected.has(r.diaryno))
      .map((r) => ({
        caseno: r.caseno,
        diaryno: r.diaryno,
        applicant: r.applicant,
        respondent: r.respondent,
        status: r.status ?? undefined,
      }));
    startImport(async () => {
      const result = await importCgatCases(rows);
      setImportState(result);
      if (!result.error) setSelected(new Set());
    });
  }

  if (results.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-black dark:text-zinc-50">
          {results.length} result{results.length === 1 ? "" : "s"}
        </h2>
        <button
          onClick={handleImport}
          disabled={selected.size === 0 || isImporting}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isImporting ? "Importing…" : `Import selected (${selected.size})`}
        </button>
      </div>

      {importState.error && (
        <p className="text-sm text-red-600" role="alert">
          {importState.error}
        </p>
      )}
      {!importState.error &&
        (importState.imported > 0 || importState.skipped > 0) && (
          <p className="text-sm text-green-600">
            Imported {importState.imported}
            {importState.skipped > 0 &&
              ` (${importState.skipped} already in your cases, skipped)`}
            .
          </p>
        )}

      <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[.03] dark:bg-white/[.06]">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.size === results.length && results.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 font-medium">Case No</th>
              <th className="px-3 py-2 font-medium">Applicant</th>
              <th className="px-3 py-2 font-medium">Respondent</th>
              <th className="px-3 py-2 font-medium">Filed</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.diaryno}
                className="border-t border-black/[.08] dark:border-white/[.145]"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.diaryno)}
                    onChange={() => toggle(r.diaryno)}
                  />
                </td>
                <td className="px-3 py-2">
                  {r.caseno ?? (
                    <span className="text-zinc-500" title="No case number assigned yet">
                      Diary {r.diaryno}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{r.applicant}</td>
                <td className="px-3 py-2">{r.respondent}</td>
                <td className="px-3 py-2">{r.dateoffiling}</td>
                <td className="px-3 py-2 capitalize">{r.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
