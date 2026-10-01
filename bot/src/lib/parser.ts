/**
 * Rule-based parser for Telegram messages.
 *
 * This runs before any AI parser. If it can extract intent, type, member,
 * amount, and description from the message, we skip AI entirely. This keeps
 * the system cheap and functional during AI outages.
 *
 * Supported patterns:
 *
 * Contributions:
 *   /add Murad 200
 *   /add Murad 200 monthly
 *   Murad contributed 200
 *   Murad gave 300 tk
 *   Murad দিয়েছে 200
 *
 * Expenses:
 *   /expense 90 grocery
 *   /expense grocery 90
 *   We spent 150 on electricity
 *   Grocery 90 taka
 *
 * Commands (no amount):
 *   /balance
 *   /summary
 *   /history
 *   /members
 *   /help
 *   /start
 */

export type ParsedIntent =
  | { type: "BALANCE" }
  | { type: "SUMMARY" }
  | { type: "HISTORY" }
  | { type: "MEMBERS" }
  | { type: "HELP" }
  | { type: "START" }
  | {
      type: "CONTRIBUTION";
      memberName: string;
      amountPaisa: number;
      description: string;
    }
  | {
      type: "EXPENSE";
      category: string;
      amountPaisa: number;
      description: string;
    }
  | {
      type: "REVERSE";
      transactionId: string;
    }
  | { type: "UNKNOWN" };

// Known expense category keywords
const EXPENSE_CATEGORIES: Record<string, string> = {
  grocery: "GROCERY",
  groceries: "GROCERY",
  food: "GROCERY",
  বাজার: "GROCERY",
  electricity: "ELECTRICITY",
  electric: "ELECTRICITY",
  বিদ্যুৎ: "ELECTRICITY",
  cleaning: "CLEANING",
  clean: "CLEANING",
  internet: "INTERNET",
  net: "INTERNET",
  transport: "TRANSPORT",
  other: "OTHER",
};

/** Convert a recognized keyword to a canonical category string. */
function detectCategory(word: string): string {
  return EXPENSE_CATEGORIES[word.toLowerCase()] ?? "OTHER";
}

/** Parse a numeric amount string (handles "200", "200.50", "200tk", "200 tk", "200 taka") */
function extractAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/[৳,]/g, "")
    .replace(/\s*(tk|taka|টাকা)\s*/gi, "")
    .trim();
  const n = parseFloat(cleaned);
  if (isNaN(n) || n <= 0) return null;
  return Math.round(n * 100); // paisa
}

/** Simple rule-based parser. Returns null when it cannot parse the message. */
export function ruleBasedParse(text: string): ParsedIntent | null {
  const t = text.trim();

  // ── Command patterns ─────────────────────────────────────────────────────
  if (/^\/balance\b/i.test(t)) return { type: "BALANCE" };
  if (/^\/summary\b/i.test(t)) return { type: "SUMMARY" };
  if (/^\/history\b/i.test(t)) return { type: "HISTORY" };
  if (/^\/members\b/i.test(t)) return { type: "MEMBERS" };
  if (/^\/help\b/i.test(t)) return { type: "HELP" };
  if (/^\/start\b/i.test(t)) return { type: "START" };

  // ── /add <name> <amount> [description] ───────────────────────────────────
  const addCmd = t.match(/^\/add\s+(\S+(?:\s+\S+)?)\s+([\d,৳.]+(?:\s*(?:tk|taka|টাকা))?)(.*)?$/i);
  if (addCmd) {
    const memberName = (addCmd[1] ?? "").trim();
    const amountPaisa = extractAmount(addCmd[2] ?? "");
    const description = (addCmd[3] ?? "").trim() || "Contribution via Telegram";
    if (amountPaisa && memberName) {
      return { type: "CONTRIBUTION", memberName, amountPaisa, description };
    }
  }

  // ── /expense <category> <amount> or /expense <amount> <category> ─────────
  const expCmd = t.match(/^\/expense\s+(.*)/i);
  if (expCmd) {
    const parts = (expCmd[1] ?? "").trim().split(/\s+/);
    // Try number first
    let category = "OTHER";
    let amountPaisa: number | null = null;

    for (const part of parts) {
      if (amountPaisa === null) {
        const n = extractAmount(part);
        if (n !== null) { amountPaisa = n; continue; }
      }
      const cat = detectCategory(part);
      if (cat !== "OTHER") { category = cat; }
    }

    if (amountPaisa) {
      return {
        type: "EXPENSE",
        category,
        amountPaisa,
        description: expCmd[1]?.trim() ?? "Expense via Telegram",
      };
    }
  }

  // ── /reverse <tx-id> ─────────────────────────────────────────────────────
  const revCmd = t.match(/^\/reverse\s+(\S+)/i);
  if (revCmd) {
    const transactionId = (revCmd[1] ?? "").trim();
    if (transactionId) {
      return { type: "REVERSE", transactionId };
    }
  }

  // ── Natural language: "Murad contributed 200" / "Murad gave 300 tk" ──────
  const nlContrib = t.match(
    /^([A-Za-z\u0980-\u09FF][\w\s.]{0,30}?)\s+(?:contributed?|gave?|paid?|দিয়েছে|দিল)\s+([\d,৳.]+(?:\s*(?:tk|taka|টাকা))?)/i
  );
  if (nlContrib) {
    const memberName = (nlContrib[1] ?? "").trim();
    const amountPaisa = extractAmount(nlContrib[2] ?? "");
    if (memberName && amountPaisa) {
      return { type: "CONTRIBUTION", memberName, amountPaisa, description: t };
    }
  }

  // ── Natural language: "We spent 150 on electricity" ─────────────────────
  const nlExpense = t.match(
    /(?:spent?|expense|খরচ)\s+([\d,৳.]+(?:\s*(?:tk|taka|টাকা))?)\s*(?:on|for)?\s*([A-Za-z\u0980-\u09FF]*)/i
  );
  if (nlExpense) {
    const amountPaisa = extractAmount(nlExpense[1] ?? "");
    const category = detectCategory(nlExpense[2] ?? "");
    if (amountPaisa) {
      return { type: "EXPENSE", category, amountPaisa, description: t };
    }
  }

  return null; // could not parse — caller should try the AI parser
}
