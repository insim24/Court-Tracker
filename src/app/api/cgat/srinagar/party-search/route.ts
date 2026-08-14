import { NextRequest, NextResponse } from "next/server";
import { searchByPartyName, type PartyType } from "@/lib/adapters/cgat-srinagar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partyType = Number(searchParams.get("partyType")) as PartyType;
  const partyName = searchParams.get("partyName");

  if (![1, 2, 3].includes(partyType) || !partyName) {
    return NextResponse.json(
      {
        error:
          "partyType (1=Applicant, 2=Respondent, 3=Both) and partyName are required",
      },
      { status: 400 },
    );
  }

  try {
    const results = await searchByPartyName({ partyType, partyName });
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
