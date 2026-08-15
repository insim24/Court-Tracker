"use client";

import { useState } from "react";
import { CgatResultsTable, type NormalizedCgatResult } from "./results-table";
import type { CgatAdvocateSearchResult } from "@/lib/adapters/cgat-srinagar";

export function AdvocateSearchTab() {
  const [advType, setAdvType] = useState<"1" | "2">("1");
  const [advName, setAdvName] = useState("");
  const [results, setResults] = useState<NormalizedCgatResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!advName.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/cgat/srinagar/advocate-search?advType=${advType}&advName=${encodeURIComponent(advName)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        setResults([]);
        return;
      }
      setResults(
        (data as CgatAdvocateSearchResult[]).map((r) => ({
          caseno: r.caseno,
          diaryno: r.diaryno,
          applicant: r.applicant,
          respondent: r.respondent,
          dateoffiling: r.dateoffiling,
          status: r.stage ?? null,
        })),
      );
    } catch {
      setSearchError("Search failed.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSearch}
        className="grid w-full grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="advType" className="mb-1 block text-sm font-medium">
            Advocate for
          </label>
          <select
            id="advType"
            value={advType}
            onChange={(e) => setAdvType(e.target.value as "1" | "2")}
            className="w-full rounded border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="1">Applicant</option>
            <option value="2">Respondent</option>
          </select>
        </div>
        <div>
          <label htmlFor="advName" className="mb-1 block text-sm font-medium">
            Advocate name
          </label>
          <input
            id="advName"
            value={advName}
            onChange={(e) => setAdvName(e.target.value)}
            required
            className="w-full rounded border border-border bg-transparent px-3 py-2 text-sm"
            placeholder="e.g. Satinder Singh"
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

      <CgatResultsTable results={results} />
    </div>
  );
}
