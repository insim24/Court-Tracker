import { fetchAndParseCauselist } from "@/lib/adapters/cgat-causelist";
import { createBackgroundClient } from "@/lib/supabase/background";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncResult =
  | { error: string }
  | { error: null; causelistDate: string; count: number };

// Shared by the manual "Fetch latest causelist" button and the background
// daily scheduler, so both stay behaviorally identical. Takes an optional
// Supabase client so callers with a request-scoped (cookie-based) client can
// reuse it instead of opening a second connection.
export async function syncLatestCauselist(
  supabase?: SupabaseClient,
): Promise<SyncResult> {
  try {
    const { causelistDate, entries } = await fetchAndParseCauselist();
    if (entries.length === 0) {
      return { error: "No entries parsed from the causelist PDF." };
    }

    const client = supabase ?? createBackgroundClient();
    const rows = entries.map((e) => ({
      causelist_date: e.causelistDate || causelistDate,
      bench: "Srinagar",
      court_no: e.courtNo,
      judge: e.judge,
      hearing_time: e.hearingTime,
      category: e.category,
      serial_no: e.serialNo,
      case_no: e.caseNo,
      is_paperless: e.isPaperless,
      tags: e.tags,
      parent_case_no: e.parentCaseNo,
      related_case_nos: e.relatedCaseNos,
      applicant: e.applicant,
      respondent: e.respondent,
      advocate_after_dash: e.advocateAfterDash,
      raw_text: [
        e.applicant,
        e.respondent,
        e.advocateAfterDash,
        e.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" | "),
      linked_from_serial: e.linkedFromSerial,
    }));

    const { error } = await client
      .from("causelist_entries")
      .upsert(rows, { onConflict: "causelist_date,case_no" });

    if (error) {
      return { error: error.message };
    }

    return { error: null, causelistDate, count: entries.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fetch failed." };
  }
}
