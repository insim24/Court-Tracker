import { NextRequest, NextResponse } from "next/server";
import {
  searchCaseByCaseNo,
  CASE_TYPES,
  type CaseTypeId,
} from "@/lib/adapters/cgat-srinagar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseTypeId = Number(searchParams.get("caseTypeId")) as CaseTypeId;
  const caseNo = searchParams.get("caseNo");
  const caseYear = searchParams.get("caseYear");

  if (!(caseTypeId in CASE_TYPES) || !caseNo || !caseYear) {
    return NextResponse.json(
      { error: "caseTypeId, caseNo, and caseYear are required" },
      { status: 400 },
    );
  }

  try {
    const results = await searchCaseByCaseNo({ caseTypeId, caseNo, caseYear });
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
