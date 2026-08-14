const CGAT_API_BASE = "https://cgat.gov.in/catapi";

// Central Administrative Tribunal, Srinagar Bench. Each bench has its own
// numeric schema id in CGAT's backend; this was read off the network
// requests the bench's own case-status page sends.
const SRINAGAR_SCHEMA_ID = 119;

export const CASE_TYPES = {
  1: "Original Application",
  2: "Transfer Application",
  3: "Misc Application",
  4: "Contempt Petiton",
  5: "Petition for Transfer",
  6: "Review Application",
  7: "Criminal Contempt Petition",
  8: "Oa Obj",
} as const;

export type CaseTypeId = keyof typeof CASE_TYPES;

// Reverse lookup from the case-number abbreviation CGAT returns in search
// results (e.g. "O.A.") back to the numeric case type id needed to search
// or refresh by case number. Only the types actually observed in real
// search results are mapped; the rest are left unmapped rather than guessed.
const CASE_TYPE_ABBREVIATIONS: Record<string, CaseTypeId> = {
  "O.A.": 1,
  "T.A.": 2,
  "M.A.": 3,
  "C.P.": 4,
};

export type CgatCaseResult = {
  caseno: string;
  caseType: string;
  diaryno: string;
  dateoffiling: string;
  applicant: string;
  respondent: string;
  location: string;
  casestatus: string;
};

export type CaseNoSearchParams = {
  caseTypeId: CaseTypeId;
  caseNo: string | number;
  caseYear: string | number;
};

export async function searchCaseByCaseNo({
  caseTypeId,
  caseNo,
  caseYear,
}: CaseNoSearchParams): Promise<CgatCaseResult[]> {
  const body = new FormData();
  body.append("casetypeId", String(caseTypeId));
  body.append("catschemaId", String(SRINAGAR_SCHEMA_ID));
  body.append("caseNo", String(caseNo));
  body.append("caseYear", String(caseYear));

  const res = await fetch(
    `${CGAT_API_BASE}/casedetail_individual_case_no_wise`,
    { method: "POST", body },
  );

  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar case search failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export type AdvocateType = 1 | 2; // 1 = Applicant, 2 = Respondent

export type CgatAdvocateSearchResult = {
  casetype: string;
  // null when the matter only has a diary number and was never formally
  // assigned a case number (e.g. rejected before registration).
  caseno: string | null;
  diaryno: string;
  dateoffiling: string;
  applicant: string;
  respondent: string;
  applicantadvocate?: string;
  respondentadvocate?: string;
  stage?: string;
};

export type AdvocateSearchParams = {
  advType: AdvocateType;
  advName: string;
};

export async function searchByAdvocateName({
  advType,
  advName,
}: AdvocateSearchParams): Promise<CgatAdvocateSearchResult[]> {
  const body = new FormData();
  body.append("catschemaId", String(SRINAGAR_SCHEMA_ID));
  body.append("advType", String(advType));
  body.append("advName", advName.toLowerCase());

  const res = await fetch(`${CGAT_API_BASE}/casedetail_adv_name_wise`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar advocate search failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export type PartyType = 1 | 2 | 3; // 1 = Applicant, 2 = Respondent, 3 = Both

export type CgatPartySearchResult = {
  filing_no: string;
  casetype: string;
  // null when the matter only has a diary number and was never formally
  // assigned a case number (e.g. rejected before registration).
  caseno: string | null;
  diaryno: string;
  dateoffiling: string;
  applicant: string;
  respondent: string;
  location: string;
  stage: string;
  nextlistingdate: string | null;
  dateofdisposal: string | null;
  listing_date: string | null;
};

export type PartySearchParams = {
  partyType: PartyType;
  partyName: string;
};

export async function searchByPartyName({
  partyType,
  partyName,
}: PartySearchParams): Promise<CgatPartySearchResult[]> {
  const body = new FormData();
  body.append("catschemaId", String(SRINAGAR_SCHEMA_ID));
  body.append("partyType", String(partyType));
  body.append("partyName", partyName.toLowerCase());

  const res = await fetch(`${CGAT_API_BASE}/casedetail_party_name_wise`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar party name search failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export type DiarySearchParams = {
  diaryNo: string | number;
  diaryYear: string | number;
};

async function getMoreDetailUrl({
  diaryNo,
  diaryYear,
}: DiarySearchParams): Promise<string> {
  const body = new FormData();
  body.append("catschemaId", String(SRINAGAR_SCHEMA_ID));
  body.append("dairyNo", String(diaryNo));
  body.append("dairyYear", String(diaryYear));

  const res = await fetch(`${CGAT_API_BASE}/getAdditionalDetail`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar additional detail lookup failed: ${res.status} ${res.statusText}`,
    );
  }

  const data: { "More Detail"?: string } = await res.json();
  const url = data["More Detail"];
  if (!url) {
    throw new Error("CGAT Srinagar additional detail lookup returned no URL");
  }
  return url;
}

export type CgatCaseDetail = {
  status: string | null;
  nextHearingDate: string | null; // ISO yyyy-mm-dd
  disposalDate: string | null; // ISO yyyy-mm-dd
};

function ddmmyyyyToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseLegacyDetailPage(html: string): CgatCaseDetail {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const statusMatch = text.match(
    /Status\s*\/\s*Stage\s+([A-Z ]+?)(?=\s+(?:Disposal Nature|Notification Date|In the Court|Petitioner))/,
  );
  const hearingMatch = text.match(
    /Present\s*\/\s*Next listed On\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
  );
  const disposalMatch = text.match(
    /Date of Disposal\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
  );

  return {
    status: statusMatch?.[1]?.trim() ?? null,
    nextHearingDate: hearingMatch ? ddmmyyyyToIso(hearingMatch[1]) : null,
    disposalDate: disposalMatch ? ddmmyyyyToIso(disposalMatch[1]) : null,
  };
}

export async function getCaseDetailByDiary(
  params: DiarySearchParams,
): Promise<CgatCaseDetail> {
  const url = await getMoreDetailUrl(params);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `CGAT Srinagar detail page fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  return parseLegacyDetailPage(await res.text());
}

export type RefreshedCase = {
  caseno: string;
  applicant: string;
  respondent: string;
  status: string;
  nextHearingDate: string | null;
  disposalDate: string | null;
  diaryNo: string;
  diaryYear: string;
};

// Combines the case-number search (canonical status + diary no) with the
// legacy detail page (hearing date) into one normalized result.
export async function refreshCase(
  params: CaseNoSearchParams,
): Promise<RefreshedCase> {
  const results = await searchCaseByCaseNo(params);
  const match = results[0];
  if (!match) {
    throw new Error("No matching case found on CGAT Srinagar");
  }

  const [diaryNo, diaryYear] = match.diaryno.split("/");
  const detail = await getCaseDetailByDiary({ diaryNo, diaryYear });

  return {
    caseno: match.caseno,
    applicant: match.applicant,
    respondent: match.respondent,
    status: detail.status ?? match.casestatus,
    nextHearingDate: detail.nextHearingDate,
    disposalDate: detail.disposalDate,
    diaryNo,
    diaryYear,
  };
}

export function parseCgatCaseNo(
  caseno: string,
): { caseTypeId: CaseTypeId; caseNo: string; caseYear: string } | null {
  const match = caseno.match(/^([A-Za-z.]+)\/(\d+)\/(\d{4})$/);
  if (!match) return null;
  const [, abbrev, no, year] = match;
  const caseTypeId = CASE_TYPE_ABBREVIATIONS[abbrev];
  if (!caseTypeId) return null;
  return { caseTypeId, caseNo: no, caseYear: year };
}
