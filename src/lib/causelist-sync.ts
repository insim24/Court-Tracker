import { fetchAndParseCauselist } from "@/lib/adapters/cgat-causelist";
import { createBackgroundClient } from "@/lib/supabase/background";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncResult =
  | { error: string }
  | { error: null; causelistDate: string; count: number };

// The source site never exposes an archive, so causelist_entries is a
// pure accumulate-only history (see migration 0003) with nothing else
// pruning it. Cap it at 60 days so it doesn't grow unbounded.
const RETENTION_DAYS = 60;

function cutoffDateIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

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

    // Best-effort: an old-entry cleanup failure shouldn't fail a successful
    // fetch, so it's only logged, not surfaced as a sync error.
    const { error: cleanupError } = await client
      .from("causelist_entries")
      .delete()
      .lt("causelist_date", cutoffDateIso(RETENTION_DAYS));
    if (cleanupError) {
      console.error(
        "[causelist-sync] cleanup of old entries failed:",
        cleanupError.message,
      );
    }

    return { error: null, causelistDate, count: entries.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fetch failed." };
  }
}
