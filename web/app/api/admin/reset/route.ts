import { NextResponse } from "next/server";
import { resetLedger, type FundType } from "@/lib/db/ledger-service";

export async function POST(request: Request) {
  try {
    interface ResetRequestBody {
      preset?: FundType;
    }

    const body = (await request.json()) as ResetRequestBody;
    const preset = body.preset === "BATCH" ? "BATCH" : "ROOM";

    const fund = await resetLedger(preset);

    return NextResponse.json({
      ok: true,
      message: `Fund successfully reset with ${preset} preset`,
      fund,
    });
  } catch (err) {
    console.error("POST /api/admin/reset error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to reset ledger" },
      { status: 500 }
    );
  }
}
