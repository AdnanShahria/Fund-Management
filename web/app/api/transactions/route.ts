import { NextResponse } from "next/server";
import { getTransactions, createTransaction } from "@/lib/db/ledger-service";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const transactions = await getTransactions({ type, limit });
    return NextResponse.json({ ok: true, transactions });
  } catch (err) {
    console.error("GET /api/transactions error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    interface TransactionRequestBody {
      type?: "CONTRIBUTION" | "EXPENSE";
      memberId?: string;
      memberName?: string;
      category?: string;
      amountTaka?: number;
      amountPaisa?: number;
      description?: string;
      createdBy?: string;
    }

    const body = (await request.json()) as TransactionRequestBody;
    const { type, memberId, memberName, category, amountTaka, amountPaisa, description, createdBy } = body;

    if (!type || (type !== "CONTRIBUTION" && type !== "EXPENSE")) {
      return NextResponse.json(
        { ok: false, error: "Invalid transaction type. Must be CONTRIBUTION or EXPENSE." },
        { status: 400 }
      );
    }

    const calculatedPaisa = amountPaisa ? Math.round(amountPaisa) : Math.round(Number(amountTaka) * 100);

    if (isNaN(calculatedPaisa) || calculatedPaisa <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valid positive amount is required." },
        { status: 400 }
      );
    }

    const created = await createTransaction({
      type,
      memberId,
      memberName,
      category,
      description: description || (type === "CONTRIBUTION" ? "Contribution via Web" : "Expense via Web"),
      amountPaisa: calculatedPaisa,
      source: "WEB",
      createdBy: createdBy || "Treasurer",
    });

    return NextResponse.json({ ok: true, transaction: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/transactions error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to record transaction" },
      { status: 500 }
    );
  }
}
