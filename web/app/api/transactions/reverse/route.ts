import { NextResponse } from "next/server";
import { reverseTransaction } from "@/lib/db/ledger-service";

export async function POST(request: Request) {
  try {
    interface ReverseRequestBody {
      transactionId?: string;
      reversedBy?: string;
    }

    const body = (await request.json()) as ReverseRequestBody;
    const { transactionId, reversedBy } = body;

    if (!transactionId || typeof transactionId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const result = await reverseTransaction(transactionId, reversedBy || "Admin");

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: "Transaction not found or already reversed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Transaction reversed successfully",
      reversedTx: result.reversedTx,
      correctionTx: result.correctionTx,
    });
  } catch (err) {
    console.error("POST /api/transactions/reverse error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to reverse transaction" },
      { status: 500 }
    );
  }
}
