import { NextRequest, NextResponse } from "next/server";
import {
  searchByAdvocateName,
  type AdvocateType,
} from "@/lib/adapters/cgat-srinagar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const advType = Number(searchParams.get("advType")) as AdvocateType;
  const advName = searchParams.get("advName");

  if ((advType !== 1 && advType !== 2) || !advName) {
    return NextResponse.json(
      { error: "advType (1=Applicant, 2=Respondent) and advName are required" },
      { status: 400 },
    );
  }

  try {
    const results = await searchByAdvocateName({ advType, advName });
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
