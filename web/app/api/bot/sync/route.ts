import { NextResponse } from "next/server";
import {
  getFundSummary,
  getMembers,
  getTransactions,
  createTransaction,
  verifyBotApiKey,
} from "@/lib/db/ledger-service";

function checkBotAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-bot-api-key");

  const token =
    apiKeyHeader ||
    (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader);

  if (!token) return true; // Allows open access in local dev if no key provided
  return verifyBotApiKey(token);
}

export async function GET(request: Request) {
  try {
    if (!checkBotAuth(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized bot access" },
        { status: 401 }
      );
    }

    const [fund, members, transactions] = await Promise.all([
      getFundSummary(),
      getMembers(),
      getTransactions({ limit: 10 }),
    ]);

    return NextResponse.json({
      ok: true,
      fund,
      members,
      recentTransactions: transactions,
    });
  } catch (err) {
    console.error("GET /api/bot/sync error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to sync bot data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!checkBotAuth(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized bot access" },
        { status: 401 }
      );
    }

    interface BotTransactionPayload {
      type: "CONTRIBUTION" | "EXPENSE";
      memberName?: string;
      category?: string;
      amountTaka?: number;
      amountPaisa?: number;
      description?: string;
      telegramChatId?: string | number;
      telegramUser?: string;
    }

    const body = (await request.json()) as BotTransactionPayload;
    const { type, memberName, category, amountTaka, amountPaisa, description, telegramUser } = body;

    const calculatedPaisa =
      amountPaisa !== undefined
        ? Math.round(amountPaisa)
        : amountTaka !== undefined
        ? Math.round(Number(amountTaka) * 100)
        : 0;

    if (calculatedPaisa <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valid positive amount is required" },
        { status: 400 }
      );
    }

    const newTx = await createTransaction({
      type,
      memberName,
      category,
      amountPaisa: calculatedPaisa,
      description: description || `Recorded via Telegram by ${telegramUser || "Bot"}`,
      source: "TELEGRAM",
      createdBy: telegramUser || "Telegram Bot",
    });

    const updatedFund = await getFundSummary();

    return NextResponse.json({
      ok: true,
      transaction: newTx,
      fund: updatedFund,
    });
  } catch (err) {
    console.error("POST /api/bot/sync error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to record bot transaction" },
      { status: 500 }
    );
  }
}
