"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  refreshCase,
  parseCgatCaseNo,
  CASE_TYPES,
  type CaseTypeId,
} from "@/lib/adapters/cgat-srinagar";
import { fetchAllOrders } from "@/lib/adapters/cgat-orders";
import { syncLatestCauselist } from "@/lib/causelist-sync";

export type AddCaseState = {
  error: string | null;
  success: boolean;
};

function asNullable(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function addCase(
  _prevState: AddCaseState,
  formData: FormData,
): Promise<AddCaseState> {
  const title = asNullable(formData.get("title"));
  if (!title) {
    return { error: "Title is required.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cases").insert({
    title,
    case_number: asNullable(formData.get("case_number")),
    court: asNullable(formData.get("court")),
    case_type: asNullable(formData.get("case_type")),
    status: asNullable(formData.get("status")) ?? "open",
    filed_date: asNullable(formData.get("filed_date")),
    next_hearing_date: asNullable(formData.get("next_hearing_date")),
    notes: asNullable(formData.get("notes")),
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteCase(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("cases").delete().eq("id", id);
  revalidatePath("/");
}

export type RefreshCaseState = {
  error: string | null;
  message: string | null;
};

export async function refreshCaseFromCgat(
  _prevState: RefreshCaseState,
  formData: FormData,
): Promise<RefreshCaseState> {
  const caseId = formData.get("caseId");
  if (typeof caseId !== "string" || !caseId) {
    return { error: "Missing case id.", message: null };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("cases")
    .select("cgat_case_type_id, cgat_case_no, cgat_case_year")
    .eq("id", caseId)
    .single();

  if (fetchError || !existing) {
    return { error: "Case not found.", message: null };
  }

  const { cgat_case_type_id, cgat_case_no, cgat_case_year } = existing;
  if (!cgat_case_type_id || !cgat_case_no || !cgat_case_year) {
    return {
      error: "This case isn't linked to a CGAT Srinagar case.",
      message: null,
    };
  }

  try {
    const result = await refreshCase({
      caseTypeId: cgat_case_type_id as CaseTypeId,
      caseNo: cgat_case_no,
      caseYear: cgat_case_year,
    });

    const { error: updateError } = await supabase
      .from("cases")
      .update({
        status: result.status.toLowerCase(),
        next_hearing_date: result.nextHearingDate,
        cgat_last_synced_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (updateError) {
      return { error: updateError.message, message: null };
    }

    revalidatePath("/");
    return {
      error: null,
      message: result.nextHearingDate
        ? `Updated: ${result.status}, next hearing ${result.nextHearingDate}`
        : `Updated: ${result.status}`,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Refresh failed.",
      message: null,
    };
  }
}

export type ImportableCgatCase = {
  // null when the matter only has a diary number and was never formally
  // assigned a case number (e.g. rejected before registration).
  caseno: string | null;
  diaryno: string;
  applicant: string;
  respondent: string;
  status?: string;
};

export type ImportCasesState = {
  error: string | null;
  imported: number;
  skipped: number;
};

export async function importCgatCases(
  rows: ImportableCgatCase[],
): Promise<ImportCasesState> {
  if (rows.length === 0) {
    return { error: null, imported: 0, skipped: 0 };
  }

  // Cases without a case number yet are identified by diary number instead,
  // so every row gets a stable, unique case_number for dedup and display.
  const withCaseNumber = rows.map((r) => ({
    ...r,
    caseNumber: r.caseno ?? `Diary ${r.diaryno}`,
  }));

  const supabase = await createClient();

  const { data: existingRows } = await supabase
    .from("cases")
    .select("case_number")
    .in(
      "case_number",
      withCaseNumber.map((r) => r.caseNumber),
    );
  const existingCaseNumbers = new Set(
    (existingRows ?? []).map((r) => r.case_number),
  );

  const toInsert = withCaseNumber
    .filter((r) => !existingCaseNumbers.has(r.caseNumber))
    .map((r) => {
      const parsed = r.caseno ? parseCgatCaseNo(r.caseno) : null;
      return {
        title: `${r.applicant} vs ${r.respondent}`,
        case_number: r.caseNumber,
        court: "CAT Srinagar",
        case_type: parsed ? CASE_TYPES[parsed.caseTypeId] : null,
        status: (r.status ?? "open").toLowerCase(),
        cgat_case_type_id: parsed?.caseTypeId ?? null,
        cgat_case_no: parsed?.caseNo ?? null,
        cgat_case_year: parsed?.caseYear ?? null,
      };
    });

  const skipped = rows.length - toInsert.length;
  if (toInsert.length === 0) {
    return { error: null, imported: 0, skipped };
  }

  const { error } = await supabase.from("cases").insert(toInsert);
  if (error) {
    return { error: error.message, imported: 0, skipped };
  }

  revalidatePath("/");
  return { error: null, imported: toInsert.length, skipped };
}

export type FetchCauselistState = {
  error: string | null;
  message: string | null;
};

export async function fetchLatestCauselist(
  _prevState: FetchCauselistState,
): Promise<FetchCauselistState> {
  const supabase = await createClient();
  const result = await syncLatestCauselist(supabase);

  if (result.error !== null) {
    return { error: result.error, message: null };
  }

  revalidatePath("/cause-list");
  return {
    error: null,
    message: `Fetched ${result.count} entries for ${result.causelistDate}.`,
  };
}

export type WatchedAdvocateState = {
  error: string | null;
};

export async function addWatchedAdvocate(
  _prevState: WatchedAdvocateState,
  formData: FormData,
): Promise<WatchedAdvocateState> {
  const name = asNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("watched_advocates").insert({ name });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cause-list");
  return { error: null };
}

export async function removeWatchedAdvocate(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("watched_advocates").delete().eq("id", id);
  revalidatePath("/cause-list");
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(
  subscription: PushSubscriptionInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  return { error: error?.message ?? null };
}

export async function unsubscribeFromPush(
  endpoint: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  return { error: error?.message ?? null };
}

export type FetchOrdersState = {
  error: string | null;
  message: string | null;
};

export async function fetchCaseOrders(
  _prevState: FetchOrdersState,
  formData: FormData,
): Promise<FetchOrdersState> {
  const caseId = formData.get("caseId");
  if (typeof caseId !== "string" || !caseId) {
    return { error: "Missing case id.", message: null };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("cases")
    .select("case_number")
    .eq("id", caseId)
    .single();

  if (fetchError || !existing) {
    return { error: "Case not found.", message: null };
  }

  const parsed = existing.case_number
    ? parseCgatCaseNo(existing.case_number)
    : null;
  if (!parsed) {
    return {
      error:
        "Case number isn't in a recognized CAT Srinagar format (e.g. T.A./1234/2021).",
      message: null,
    };
  }

  try {
    const orders = await fetchAllOrders(parsed);

    if (orders.length === 0) {
      return { error: null, message: "No orders published for this case yet." };
    }

    const { error: upsertError } = await supabase.from("case_orders").upsert(
      orders.map((o) => ({
        case_id: caseId,
        order_type: o.orderType,
        order_date: o.orderDate,
        diary_no: o.diaryNo,
        applicant: o.applicant,
        respondent: o.respondent,
        pdf_url: o.pdfUrl,
      })),
      { onConflict: "case_id,pdf_url" },
    );

    if (upsertError) {
      return { error: upsertError.message, message: null };
    }

    revalidatePath("/");
    return { error: null, message: `Found ${orders.length} order(s).` };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Order fetch failed.",
      message: null,
    };
  }
}

export type FetchAllOrdersState = {
  error: string | null;
  message: string | null;
};

// Bounded concurrency so fetching orders for every tracked case doesn't
// fire dozens of simultaneous requests at the source site at once.
const ORDER_FETCH_CONCURRENCY = 4;

export async function fetchAllCaseOrders(
  _prevState: FetchAllOrdersState,
): Promise<FetchAllOrdersState> {
  const supabase = await createClient();
  const { data: cases, error: fetchError } = await supabase
    .from("cases")
    .select("id, case_number");

  if (fetchError) {
    return { error: fetchError.message, message: null };
  }
  if (!cases || cases.length === 0) {
    return { error: null, message: "No cases to fetch orders for." };
  }

  const targets = cases
    .map((c) => ({
      id: c.id as string,
      parsed: c.case_number ? parseCgatCaseNo(c.case_number) : null,
    }))
    .filter(
      (c): c is { id: string; parsed: NonNullable<typeof c.parsed> } =>
        c.parsed !== null,
    );
  const skipped = cases.length - targets.length;

  let totalOrders = 0;
  let failedCases = 0;
  const rows: {
    case_id: string;
    order_type: "daily" | "final";
    order_date: string | null;
    diary_no: string | null;
    applicant: string | null;
    respondent: string | null;
    pdf_url: string;
  }[] = [];

  for (let i = 0; i < targets.length; i += ORDER_FETCH_CONCURRENCY) {
    const batch = targets.slice(i, i + ORDER_FETCH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async ({ id, parsed }) => ({
        id,
        orders: await fetchAllOrders(parsed),
      })),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        failedCases++;
        continue;
      }
      totalOrders += result.value.orders.length;
      for (const o of result.value.orders) {
        rows.push({
          case_id: result.value.id,
          order_type: o.orderType,
          order_date: o.orderDate,
          diary_no: o.diaryNo,
          applicant: o.applicant,
          respondent: o.respondent,
          pdf_url: o.pdfUrl,
        });
      }
    }
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("case_orders")
      .upsert(rows, { onConflict: "case_id,pdf_url" });
    if (upsertError) {
      return { error: upsertError.message, message: null };
    }
  }

  revalidatePath("/");

  const parts = [
    `Checked ${targets.length} case(s), found ${totalOrders} order(s).`,
  ];
  if (skipped > 0) {
    parts.push(`${skipped} skipped (no recognizable case number).`);
  }
  if (failedCases > 0) {
    parts.push(`${failedCases} failed to fetch.`);
  }
  return { error: null, message: parts.join(" ") };
}
