import type { SupabaseClient } from "@supabase/supabase-js";

// Uppercases, turns punctuation into spaces and collapses whitespace, then
// pads with spaces so names can be matched on whole-word boundaries
// ("SYED MANZOOR" matches "SYED  MANZOOR." but not "SYED MANZOORUL").
function normalizeForMatch(value: string): string {
  const collapsed = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
  return collapsed ? ` ${collapsed} ` : "";
}

// Returns the watched advocate name found in a causelist entry's text, or
// null. When several watched names match (e.g. "Syed Manzoor" and "Syed
// Manzoor Ahmed"), the longest — most specific — one wins.
export function matchWatchedAdvocate(
  text: string | null,
  watchedNames: string[],
): string | null {
  const haystack = normalizeForMatch(text ?? "");
  if (!haystack) return null;
  let best: string | null = null;
  let bestLength = 0;
  for (const name of watchedNames) {
    const needle = normalizeForMatch(name);
    if (needle && needle.length > bestLength && haystack.includes(needle)) {
      best = name;
      bestLength = needle.length;
    }
  }
  return best;
}

export type TrackedListing = {
  caseId: string;
  caseTitle: string;
  caseNumber: string;
  courtNo: number | null;
  serialNo: number | null;
};

// Cross-references a day's causelist entries against the user's tracked
// cases by case_number. Shared by the Cause List Watcher page and the
// display-board alert check.
export async function getTrackedListingsForDate(
  supabase: SupabaseClient,
  date: string,
): Promise<TrackedListing[]> {
  const [entriesRes, casesRes] = await Promise.all([
    supabase
      .from("causelist_entries")
      .select("case_no, court_no, serial_no")
      .eq("causelist_date", date),
    supabase.from("cases").select("id, title, case_number"),
  ]);

  const entries =
    (entriesRes.data as
      | { case_no: string; court_no: number | null; serial_no: number | null }[]
      | null) ?? [];
  const cases =
    (casesRes.data as
      | { id: string; title: string; case_number: string | null }[]
      | null) ?? [];

  const caseByNumber = new Map(
    cases
      .filter((c) => c.case_number)
      .map((c) => [c.case_number as string, c]),
  );

  const result: TrackedListing[] = [];
  for (const entry of entries) {
    const match = caseByNumber.get(entry.case_no);
    if (match) {
      result.push({
        caseId: match.id,
        caseTitle: match.title,
        caseNumber: match.case_number as string,
        courtNo: entry.court_no,
        serialNo: entry.serial_no,
      });
    }
  }
  return result;
}
