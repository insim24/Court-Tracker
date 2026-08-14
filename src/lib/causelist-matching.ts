import type { SupabaseClient } from "@supabase/supabase-js";

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
