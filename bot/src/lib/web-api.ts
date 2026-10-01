import type { Env } from "../types/env";

export interface WebFundSyncResponse {
  ok: boolean;
  fund?: {
    id: string;
    name: string;
    fundType: "ROOM" | "BATCH";
    currency: string;
    totalBalancePaisa: number;
    totalContributionsPaisa: number;
    totalExpensesPaisa: number;
    memberCount: number;
    targetBudgetPaisa: number;
    description: string;
    announcement: string;
  };
  members?: Array<{
    id: string;
    displayName: string;
    role: string;
    status: string;
    contributedPaisa: number;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: string;
    memberName?: string;
    category?: string;
    description: string;
    amountPaisa: number;
    date: string;
    status: string;
  }>;
}

export async function fetchFundFromWebApi(env: Env): Promise<WebFundSyncResponse | null> {
  if (!env.WEB_API_URL) return null;

  try {
    const url = `${env.WEB_API_URL.replace(/\/$/, "")}/api/bot/sync`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-bot-api-key": env.BOT_API_KEY || "",
      },
    });

    if (!res.ok) {
      console.warn("Web API responded with status", res.status);
      return null;
    }

    const data = (await res.json()) as WebFundSyncResponse;
    return data;
  } catch (err) {
    console.warn("Could not fetch from Web API endpoint:", err);
    return null;
  }
}

export async function postTransactionToWebApi(
  payload: {
    type: "CONTRIBUTION" | "EXPENSE";
    memberName?: string;
    category?: string;
    amountPaisa: number;
    description?: string;
    telegramChatId?: string | number;
    telegramUser?: string;
  },
  env: Env
): Promise<boolean> {
  if (!env.WEB_API_URL) return false;

  try {
    const url = `${env.WEB_API_URL.replace(/\/$/, "")}/api/bot/sync`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-api-key": env.BOT_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn("Could not post transaction to Web API endpoint:", err);
    return false;
  }
}
