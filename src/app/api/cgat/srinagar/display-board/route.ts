import { NextResponse } from "next/server";
import { fetchDisplayBoard } from "@/lib/adapters/cgat-displayboard";

export async function GET() {
  try {
    const entries = await fetchDisplayBoard();
    return NextResponse.json({ entries, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
