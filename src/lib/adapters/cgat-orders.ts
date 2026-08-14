import { type CaseTypeId } from "./cgat-srinagar";

const CATLIVE_BASE = "https://cis.cgat.gov.in/catlive/";
const SRINAGAR_SCHEMA_ID = 119;

export type OrderType = "daily" | "final";

export type OrderEntry = {
  orderType: OrderType;
  diaryNo: string | null;
  caseNo: string | null;
  applicant: string | null;
  respondent: string | null;
  orderDate: string | null; // ISO yyyy-mm-dd
  pdfUrl: string;
};

export type OrderSearchParams = {
  caseTypeId: CaseTypeId;
  caseNo: string | number;
  caseYear: string | number;
};

function ddmmyyyyToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Both order_detail.php (Daily Order) and fiorder_detail.php (Oral/Final
// Order) return the identical table shape when queried by case number: Sr
// No, Diary No, Case No, Date of order, Applicant, Respondent, PDF link.
function parseOrderRows(html: string, orderType: OrderType): OrderEntry[] {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const entries: OrderEntry[] = [];

  for (const row of rows) {
    const pdfMatch = row.match(
      /href="(\.\/pdf\/(?:order|judge)\.php\?file=[^"]+)"/,
    );
    if (!pdfMatch) continue; // not a data row (e.g. no rows found)

    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      stripTags(m[1]),
    );
    const [, diaryNo, caseNo, dateStr, applicant, respondent] = cells;

    entries.push({
      orderType,
      diaryNo: diaryNo || null,
      caseNo: caseNo || null,
      applicant: applicant || null,
      respondent: respondent || null,
      orderDate: dateStr ? ddmmyyyyToIso(dateStr) : null,
      pdfUrl: new URL(pdfMatch[1], CATLIVE_BASE).toString(),
    });
  }

  return entries;
}

async function fetchOrderReport(
  path: "order_detail.php" | "fiorder_detail.php",
  orderType: OrderType,
  { caseTypeId, caseNo, caseYear }: OrderSearchParams,
): Promise<OrderEntry[]> {
  const url = new URL(path, CATLIVE_BASE);
  url.searchParams.set("caseNo", String(caseNo));
  url.searchParams.set("benchCode1", String(SRINAGAR_SCHEMA_ID));
  url.searchParams.set("caseType", String(caseTypeId));
  url.searchParams.set("year", String(caseYear));
  url.searchParams.set("id", "casetypewise");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar ${orderType} order lookup failed: ${res.status} ${res.statusText}`,
    );
  }
  return parseOrderRows(await res.text(), orderType);
}

export function fetchDailyOrders(
  params: OrderSearchParams,
): Promise<OrderEntry[]> {
  return fetchOrderReport("order_detail.php", "daily", params);
}

export function fetchFinalOrders(
  params: OrderSearchParams,
): Promise<OrderEntry[]> {
  return fetchOrderReport("fiorder_detail.php", "final", params);
}

export async function fetchAllOrders(
  params: OrderSearchParams,
): Promise<OrderEntry[]> {
  const [daily, final] = await Promise.all([
    fetchDailyOrders(params),
    fetchFinalOrders(params),
  ]);
  // Final orders (the disposal/judgment) first, then daily orders newest
  // first — matches the order the source site itself returns each in.
  return [...final, ...daily];
}
