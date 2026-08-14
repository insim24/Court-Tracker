import { PDFParse } from "pdf-parse";

const CAUSELIST_URL = "https://cis.cgat.gov.in/catlive/display_causelist.php";
const SRINAGAR_SCHEMA_ID = 119;

export type CauselistEntry = {
  causelistDate: string; // ISO yyyy-mm-dd
  courtNo: number | null;
  judge: string | null;
  hearingTime: string | null;
  category: string | null;
  serialNo: number | null;
  caseNo: string;
  isPaperless: boolean;
  tags: string[];
  parentCaseNo: string | null;
  relatedCaseNos: string[];
  applicant: string | null;
  respondent: string | null;
  advocateAfterDash: string | null;
  linkedFromSerial: boolean;
};

// --- Step 1: find the currently published causelist PDF ------------------
//
// This bench's causelist page only ever exposes ONE PDF link at a time (the
// next published hearing day for the bench) — there's no date picker or
// archive on the source site. Each fetch is stored in our own DB so a
// history builds up over time even though the source only shows "current".

async function fetchLatestCauselistPdfUrl(): Promise<{
  date: string;
  pdfUrl: string;
}> {
  const body = new FormData();
  body.append("schemas", String(SRINAGAR_SCHEMA_ID));

  const res = await fetch(CAUSELIST_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar causelist page failed: ${res.status} ${res.statusText}`,
    );
  }
  const html = await res.text();

  const linkMatch = html.match(/href="(\.\/pdf\/pdf\.php\?file=[^"]+)"/);
  const dateMatch = html.match(
    /Print PDF Causelist of (\d{4}-\d{2}-\d{2})/,
  );
  if (!linkMatch || !dateMatch) {
    throw new Error(
      "No causelist currently published for CGAT Srinagar (or page layout changed).",
    );
  }

  const pdfUrl = new URL(linkMatch[1], "https://cis.cgat.gov.in/catlive/").toString();
  return { date: dateMatch[1], pdfUrl };
}

async function fetchCauselistPdfBuffer(pdfUrl: string): Promise<Buffer> {
  const res = await fetch(pdfUrl);
  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar causelist PDF fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// --- Step 2: parse the PDF's extracted text into structured entries ------

const CASE_NO_TOKEN = "[A-Z]{1,4}(?:\\.[A-Z]{1,4})*\\.?/\\d+/\\d+";
const ENTRY_START_RE = new RegExp(
  `^(\\d{1,3})\\s+(${CASE_NO_TOKEN})\\s*(\\(PAPER LESS\\))?\\s*\\(\\s*(\\w+)\\s*\\)\\s*$`,
);
const WITH_CASE_RE = new RegExp(
  `^(${CASE_NO_TOKEN})\\s*(\\(PAPER LESS\\))?\\s*\\(\\s*(\\w+)\\s*\\)\\s*$`,
);
const BARE_CASE_RE = new RegExp(`^(${CASE_NO_TOKEN})\\s*(\\(PAPER LESS\\))?$`);
const CASE_NO_RE = new RegExp(`^${CASE_NO_TOKEN}$`);
const NOTE_LINE_RE =
  /^(OA|CP|MA|TA) FIXED (ON|FOR)\b|^SWP\b|^WP\b|^wpc\b|^DB$|^HIGHER UP$|^FRESH MA$|^ALONG WITH\b|^COD NOT FILED$|^P\/H$|^SECOND COPY\b|^SOFT COPY\b|^FUND COST\b/i;

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function extractDate(text: string): string | null {
  const m = text.match(
    /LIST OF CASES TO BE HEARD ON \w+ (\d{1,2})(?:ST|ND|RD|TH) OF (\w+) (\d{4})/i,
  );
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const monthIdx = MONTHS.indexOf(m[2].toLowerCase());
  if (monthIdx === -1) return null;
  const month = String(monthIdx + 1).padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

export function parseCauselistText(text: string): {
  causelistDate: string | null;
  entries: CauselistEntry[];
} {
  const causelistDate = extractDate(text);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^-- \d+ of \d+ --$/.test(l));

  const entries: CauselistEntry[] = [];
  let courtNo: number | null = null;
  let judge: string | null = null;
  let hearingTime: string | null = null;
  let category: string | null = null;
  let inNotification = false;
  let lastSerial: number | null = null;
  let expectJudge = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line === "NOTIFICATION") {
      inNotification = true;
      i++;
      continue;
    }
    if (inNotification) {
      i++;
      continue;
    }

    if (/^-{10,}$/.test(line)) {
      expectJudge = true;
      i++;
      continue;
    }
    if (expectJudge) {
      expectJudge = false;
      if (
        !/^-,?\s*--?$/.test(line) &&
        !/^COURT NO/i.test(line) &&
        !/^AT\s+\d{1,2}:\d{2}/i.test(line)
      ) {
        judge = line;
        i++;
        continue;
      }
      // fall through: let this line be handled by the normal checks below
    }

    const courtMatch = line.match(/^COURT NO\s*:\s*(\d+)/i);
    if (courtMatch) {
      courtNo = Number(courtMatch[1]);
      i++;
      continue;
    }
    if (/^AT\s+\d{1,2}:\d{2}\s*[AP]M/i.test(line)) {
      hearingTime = line;
      i++;
      continue;
    }

    if (
      line === "DAILY CAUSELIST" ||
      line === "CENTRAL ADMINISTRATIVE TRIBUNAL SRINAGAR" ||
      /^LIST OF CASES TO BE HEARD ON/i.test(line) ||
      /^SO\/Dy\. REGISTRAR/i.test(line) ||
      /^NOTE:-/.test(line) ||
      /^ADVOCATES\/PARTIES-IN-PERSON/.test(line) ||
      /^FOLLOWING LINK/.test(line) ||
      /^CISCO WEBEX/.test(line) ||
      /^https:\/\/centraladministrativetribunal/.test(line) ||
      /^LEARNED COUNSEL/.test(line) ||
      /^SOFT COPIES SPEICALLY/.test(line) ||
      /^IT IS ALSO NECESSARY/.test(line) ||
      /^IN CASE OF ANY INCONVENIENCE/.test(line) ||
      /^AFTER SB IS OVER/.test(line) ||
      /^ALL MATTERS SHALL STAND ADJOURNED/.test(line) ||
      /^DUE TO NON AVAILABILITY/.test(line) ||
      /^BY COURT OFFICER\.?$/.test(line)
    ) {
      i++;
      continue;
    }

    const entryMatch = line.match(ENTRY_START_RE);
    if (entryMatch) {
      const [, serialStr, caseNo, paperLess] = entryMatch;
      lastSerial = Number(serialStr);
      i++;
      i = parseEntryBody(
        lines, i, entries, causelistDate, courtNo, judge, hearingTime,
        category, lastSerial, caseNo, !!paperLess, false,
      );
      continue;
    }

    if (line === "WITH") {
      i++;
      const nextLine = lines[i];
      const wm = nextLine?.match(WITH_CASE_RE);
      if (wm) {
        const [, caseNo, paperLess] = wm;
        i++;
        i = parseEntryBody(
          lines, i, entries, causelistDate, courtNo, judge, hearingTime,
          category, lastSerial, caseNo, !!paperLess, true,
        );
      }
      continue;
    }

    if (
      line.length < 80 &&
      !/^[a-z]/.test(line) &&
      !CASE_NO_RE.test(line.split(" ")[0])
    ) {
      category = line;
    }
    i++;
  }

  return { causelistDate, entries };
}

function parseEntryBody(
  lines: string[],
  startIndex: number,
  entries: CauselistEntry[],
  causelistDate: string | null,
  courtNo: number | null,
  judge: string | null,
  hearingTime: string | null,
  category: string | null,
  serialNo: number | null,
  caseNo: string,
  isPaperless: boolean,
  linkedFromSerial: boolean,
): number {
  let i = startIndex;
  const tags: string[] = [];
  const relatedCaseNos: string[] = [];
  let parentCaseNo: string | null = null;
  let inBracket = false;
  let bracketBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("[")) {
      inBracket = true;
      bracketBuf = [line.replace(/^\[/, "").trim()];
      if (line.includes("]")) {
        tags.push(bracketBuf.join(" ").replace(/\]$/, "").trim());
        inBracket = false;
      }
      i++;
      continue;
    }
    if (inBracket) {
      bracketBuf.push(line);
      if (line.includes("]")) {
        tags.push(bracketBuf.join(" ").replace(/\]$/, "").trim());
        inBracket = false;
      }
      i++;
      continue;
    }
    if (line === "IN") {
      i++;
      const parentLine = lines[i];
      const pm =
        parentLine?.match(WITH_CASE_RE) ||
        parentLine?.match(new RegExp(`^(${CASE_NO_TOKEN})`));
      if (pm) {
        relatedCaseNos.push(pm[1]);
        if (!parentCaseNo) parentCaseNo = pm[1];
      }
      i++;
      continue;
    }
    const bareRelated = line.match(WITH_CASE_RE) || line.match(BARE_CASE_RE);
    if (bareRelated && line !== "IN") {
      relatedCaseNos.push(bareRelated[1]);
      i++;
      continue;
    }
    if (/^(Vs|VS|V\/S)$/.test(line)) break;
    break;
  }

  const applicantLines: string[] = [];
  while (i < lines.length && !/^(Vs|VS|V\/S)$/.test(lines[i])) {
    if (!NOTE_LINE_RE.test(lines[i])) applicantLines.push(lines[i]);
    i++;
  }
  i++; // skip Vs line

  const respondentLines: string[] = [];
  while (i < lines.length && !/^-{5,}$/.test(lines[i])) {
    if (
      ENTRY_START_RE.test(lines[i]) ||
      lines[i] === "WITH" ||
      /^COURT NO/i.test(lines[i])
    )
      break;
    respondentLines.push(lines[i]);
    i++;
  }

  const advocateAfterDash: string[] = [];
  if (i < lines.length && /^-{5,}$/.test(lines[i])) {
    i++;
    while (
      i < lines.length &&
      !ENTRY_START_RE.test(lines[i]) &&
      lines[i] !== "WITH" &&
      !/^COURT NO/i.test(lines[i]) &&
      lines[i] !== "NOTIFICATION" &&
      !/^SO\/Dy\. REGISTRAR/i.test(lines[i])
    ) {
      advocateAfterDash.push(lines[i]);
      i++;
    }
  }

  entries.push({
    causelistDate: causelistDate ?? "",
    courtNo,
    judge,
    hearingTime,
    category,
    serialNo,
    caseNo,
    isPaperless,
    tags,
    parentCaseNo,
    relatedCaseNos,
    applicant: applicantLines.join(" ").trim() || null,
    respondent: respondentLines.join(" ").trim() || null,
    advocateAfterDash: advocateAfterDash.join(" ").trim() || null,
    linkedFromSerial,
  });

  return i;
}

// --- Combined fetch + parse ------------------------------------------------

export async function fetchAndParseCauselist(): Promise<{
  causelistDate: string;
  entries: CauselistEntry[];
}> {
  const { date, pdfUrl } = await fetchLatestCauselistPdfUrl();
  const buffer = await fetchCauselistPdfBuffer(pdfUrl);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const { causelistDate, entries } = parseCauselistText(result.text);
  return { causelistDate: causelistDate ?? date, entries };
}
