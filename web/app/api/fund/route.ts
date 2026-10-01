import { NextResponse } from "next/server";
import { getFundSummary, updateFundSettings, type FundType } from "@/lib/db/ledger-service";

export async function GET() {
  try {
    const fund = await getFundSummary();
    return NextResponse.json({ ok: true, fund });
  } catch (err) {
    console.error("GET /api/fund error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch fund details" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    interface FundRequestBody {
      name?: string;
      fundType?: FundType;
      targetBudgetPaisa?: number;
      targetBudgetTaka?: number;
      description?: string;
      announcement?: string;
      openingBalancePaisa?: number;
    }

    const body = (await request.json()) as FundRequestBody;
    const { name, fundType, targetBudgetPaisa, targetBudgetTaka, description, announcement, openingBalancePaisa } = body;

    const resolvedBudgetPaisa =
      targetBudgetPaisa !== undefined
        ? targetBudgetPaisa
        : targetBudgetTaka !== undefined
        ? Math.round(Number(targetBudgetTaka) * 100)
        : undefined;

    const updated = await updateFundSettings({
      name,
      fundType,
      targetBudgetPaisa: resolvedBudgetPaisa,
      description,
      announcement,
      openingBalancePaisa,
    });

    return NextResponse.json({ ok: true, fund: updated });
  } catch (err) {
    console.error("POST /api/fund error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update fund details" },
      { status: 500 }
    );
  }
}
