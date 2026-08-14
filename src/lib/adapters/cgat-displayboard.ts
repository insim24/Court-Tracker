import * as cheerio from "cheerio";

const DISPLAYBOARD_URL = "https://cis.cgat.gov.in/catlive/Displayboard1.php";

// Central Administrative Tribunal, Srinagar Bench. Same schema id (119)
// used across the case-status, causelist, and display board sources — the
// display board's "did" query param is just base64(schemaId).
const SRINAGAR_SCHEMA_ID = 119;

export type DisplayBoardEntry = {
  courtNo: string; // e.g. "1", "2", or "Registrar Court"
  note: string | null; // e.g. "START AT 11:00 AM(VIRTUAL MODE)"
  inSession: boolean;
  itemNo: number | null; // serial number currently being heard
  caseNo: string | null;
  causeTitle: string | null;
  passover: string | null;
  statusMessage: string | null; // e.g. "COURT WILL START AFTER SB IS OVER"
};

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function parseDisplayBoardHtml(html: string): DisplayBoardEntry[] {
  const $ = cheerio.load(html);
  const entries: DisplayBoardEntry[] = [];

  $("table tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length === 0) return; // header row

    const firstCell = tds.eq(0);
    const fontEl = firstCell.find("font").first();
    const courtNo = cleanText(fontEl.length ? fontEl.text() : firstCell.text());
    // Skip the footer disclaimer row and anything else that isn't actually
    // a court number / "Registrar Court" label.
    if (!/^\d+$/.test(courtNo) && courtNo !== "Registrar Court") return;
    const firstCellFullText = cleanText(firstCell.text());
    const note = firstCellFullText.startsWith(courtNo)
      ? firstCellFullText.slice(courtNo.length).trim() || null
      : firstCellFullText || null;

    if (tds.length >= 5) {
      const itemNoText = cleanText(tds.eq(1).text());
      const itemNo = itemNoText ? Number(itemNoText) : NaN;
      entries.push({
        courtNo,
        note,
        inSession: true,
        itemNo: Number.isFinite(itemNo) ? itemNo : null,
        caseNo: cleanText(tds.eq(2).text()) || null,
        causeTitle: cleanText(tds.eq(3).text()) || null,
        passover: cleanText(tds.eq(4).text()) || null,
        statusMessage: null,
      });
    } else if (tds.length >= 2) {
      entries.push({
        courtNo,
        note,
        inSession: false,
        itemNo: null,
        caseNo: null,
        causeTitle: null,
        passover: null,
        statusMessage: cleanText(tds.eq(1).text()) || null,
      });
    }
  });

  return entries;
}

export async function fetchDisplayBoard(): Promise<DisplayBoardEntry[]> {
  const did = Buffer.from(String(SRINAGAR_SCHEMA_ID)).toString("base64");
  const res = await fetch(`${DISPLAYBOARD_URL}?did=${did}`);
  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar display board fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  return parseDisplayBoardHtml(await res.text());
}
