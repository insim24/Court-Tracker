"use client";

import { useState, useTransition } from "react";
import { importCgatCases, type ImportCasesState } from "@/app/actions";
import { CASE_TYPES, type CgatCaseResult } from "@/lib/adapters/cgat-srinagar";

const initialImportState: ImportCasesState = {
  error: null,
  imported: 0,
  skipped: 0,
};

export function CaseNoTab() {
  const [caseTypeId, setCaseTypeId] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [caseYear, setCaseYear] = useState("");
  const [result, setResult] = useState<CgatCaseResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importState, setImportState] =
    useState<ImportCasesState>(initialImportState);
  const [isImporting, startImport] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!caseTypeId || !caseNo.trim() || !caseYear.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResult(null);
    setImportState(initialImportState);
    try {
      const res = await fetch(
        `/api/cgat/srinagar/case-status?caseTypeId=${caseTypeId}&caseNo=${encodeURIComponent(caseNo)}&caseYear=${encodeURIComponent(caseYear)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        return;
      }
      const match: CgatCaseResult | undefined = data[0];
      if (!match) {
        setSearchError("No matching case found.");
        return;
      }
      setResult(match);
    } catch {
      setSearchError("Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function handleImport() {
    if (!result) return;
    startImport(async () => {
      const importResult = await importCgatCases([
        {
          caseno: result.caseno,
          diaryno: result.diaryno,
          applicant: result.applicant,
          respondent: result.respondent,
          status: result.casestatus,
        },
      ]);
      setImportState(importResult);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSearch}
        className="grid w-full grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="caseTypeId"
            className="mb-1 block text-sm font-medium"
          >
            Case type
          </label>
          <select
            id="caseTypeId"
            value={caseTypeId}
            onChange={(e) => setCaseTypeId(e.target.value)}
            required
            className="w-full rounded border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select</option>
            {Object.entries(CASE_TYPES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="caseNo" className="mb-1 block text-sm font-medium">
            Case no.
          </label>
          <input
            id="caseNo"
            value={caseNo}
            onChange={(e) => setCaseNo(e.target.value)}
            required
            className="w-24 rounded border border-border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="caseYear"
            className="mb-1 block text-sm font-medium"
          >
            Year
          </label>
          <input
            id="caseYear"
            value={caseYear}
            onChange={(e) => setCaseYear(e.target.value)}
            required
            className="w-24 rounded border border-border bg-transparent px-3 py-2 text-sm"
            placeholder="2026"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {searchError && (
        <p className="text-sm text-red-600" role="alert">
          {searchError}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {result.applicant} vs {result.respondent}
              </p>
              <p className="text-sm text-muted">
                {result.caseno} · filed {result.dateoffiling} ·{" "}
                <span className="capitalize">{result.casestatus}</span>
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={isImporting || importState.imported > 0}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {isImporting
                ? "Adding…"
                : importState.imported > 0
                  ? "Added"
                  : "Add to my cases"}
            </button>
          </div>
          {importState.error && (
            <p className="text-sm text-red-600" role="alert">
              {importState.error}
            </p>
          )}
          {!importState.error && importState.skipped > 0 && (
            <p className="text-sm text-muted">
              Already in your cases.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
