"use client";

import { useState } from "react";
import { CgatResultsTable, type NormalizedCgatResult } from "./results-table";
import type { CgatPartySearchResult } from "@/lib/adapters/cgat-srinagar";

export function PartySearchTab() {
  const [partyType, setPartyType] = useState<"1" | "2" | "3">("3");
  const [partyName, setPartyName] = useState("");
  const [results, setResults] = useState<NormalizedCgatResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!partyName.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/cgat/srinagar/party-search?partyType=${partyType}&partyName=${encodeURIComponent(partyName)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        setResults([]);
        return;
      }
      setResults(
        (data as CgatPartySearchResult[]).map((r) => ({
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
        className="grid w-full grid-cols-1 gap-3 rounded-lg border border-black/[.08] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end dark:border-white/[.145]"
      >
        <div>
          <label
            htmlFor="partyType"
            className="mb-1 block text-sm font-medium"
          >
            Party
          </label>
          <select
            id="partyType"
            value={partyType}
            onChange={(e) =>
              setPartyType(e.target.value as "1" | "2" | "3")
            }
            className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
          >
            <option value="1">Applicant</option>
            <option value="2">Respondent</option>
            <option value="3">Both</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="partyName"
            className="mb-1 block text-sm font-medium"
          >
            Party / title name
          </label>
          <input
            id="partyName"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            required
            className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
            placeholder="e.g. Farooq Ahmad"
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
