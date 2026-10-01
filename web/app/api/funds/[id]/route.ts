import { NextResponse } from "next/server";
import { getFundSummary } from "@/lib/db/ledger-service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const summary = await getFundSummary(params.id);
    return NextResponse.json({ ok: true, fund: summary });
  } catch (err) {
    console.error("GET /api/funds/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch fund summary" },
      { status: 500 }
    );
  }
}
