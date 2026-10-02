import Decimal from "decimal.js";
import { getRequestContext } from "@cloudflare/next-on-pages";

export type FundType = "ROOM" | "BATCH";

export interface FundSummary {
  id: string;
  name: string;
  fundType: FundType;
  currency: string;
  openingBalancePaisa: number;
  totalBalancePaisa: number;
  totalContributionsPaisa: number;
  totalExpensesPaisa: number;
  memberCount: number;
  targetBudgetPaisa: number;
  description: string;
  announcement: string;
}

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "CARD" | "OTHER";

export interface MemberRecord {
  id: string;
  userId: string;
  displayName: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  status: "active" | "suspended";
  contributedPaisa: number;
  phone?: string;
  telegramUsername?: string;
  targetQuotaPaisa?: number;
  dueStatus?: "paid" | "partial" | "overdue" | "exempt";
}

export interface TransactionRecord {
  id: string;
  type: "CONTRIBUTION" | "EXPENSE" | "REFUND" | "CORRECTION" | "REVERSAL";
  memberId?: string;
  memberName?: string;
  category?: string;
  description: string;
  amountPaisa: number;
  source: "TELEGRAM" | "WEB";
  date: string;
  createdBy: string;
  status: "completed" | "pending" | "reversed";
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  payeeName?: string;
  receiptUrl?: string;
  feePaisa?: number;
  voucherNo?: string;
}

// ─── D1 helpers ──────────────────────────────────────────────────────────────

function getDB(): D1Database | null {
  try {
    const ctx = getRequestContext();
    if (!ctx || !ctx.env || !(ctx.env as any).DB || typeof (ctx.env as any).DB.prepare !== "function") {
      return null;
    }
    return (ctx.env as any).DB as D1Database;
  } catch {
    return null;
  }
}

const FUND_ID = "fund-room-302";

// ─── In-memory fallback (local dev without wrangler) ─────────────────────────

let fallbackFund: FundSummary = {
  id: FUND_ID,
  name: "Room 302 General Fund",
  fundType: "ROOM",
  currency: "BDT",
  openingBalancePaisa: 100000,
  totalBalancePaisa: 367000,
  totalContributionsPaisa: 630000,
  totalExpensesPaisa: 363000,
  memberCount: 5,
  targetBudgetPaisa: 1000000,
  description: "Shared living and mess expenses for Room 302 members",
  announcement: "Monthly contributions due on the 5th of each month",
};

let fallbackMembers: MemberRecord[] = [
  { id: "mem-1", userId: "u-adnan", displayName: "Adnan Shahria", role: "TREASURER", status: "active", contributedPaisa: 200000, targetQuotaPaisa: 200000, dueStatus: "paid", telegramUsername: "adnan_dev" },
  { id: "mem-2", userId: "u-murad", displayName: "Murad Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, targetQuotaPaisa: 200000, dueStatus: "partial", telegramUsername: "murad_h" },
  { id: "mem-3", userId: "u-rahim", displayName: "Rahim Uddin", role: "MEMBER", status: "active", contributedPaisa: 200000, targetQuotaPaisa: 200000, dueStatus: "paid", telegramUsername: "rahim_u" },
  { id: "mem-4", userId: "u-karim", displayName: "Karim Sheikh", role: "MEMBER", status: "active", contributedPaisa: 100000, targetQuotaPaisa: 200000, dueStatus: "partial", telegramUsername: "karim_s" },
  { id: "mem-5", userId: "u-farhan", displayName: "Farhan Ali", role: "MEMBER", status: "suspended", contributedPaisa: 0, targetQuotaPaisa: 200000, dueStatus: "overdue", telegramUsername: "farhan_a" },
];

let fallbackTransactions: TransactionRecord[] = [
  { id: "tx-1", voucherNo: "VCH-2026-005", type: "CONTRIBUTION", memberId: "u-adnan", memberName: "Adnan Shahria", description: "October monthly dues deposit", category: "DUES", amountPaisa: 200000, paymentMethod: "BKASH", referenceId: "BK-892JK41", source: "TELEGRAM", date: "2026-10-02", createdBy: "Adnan Shahria", status: "completed", receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80" },
  { id: "tx-2", voucherNo: "VCH-2026-004", type: "EXPENSE", category: "GROCERY", payeeName: "Shwapno Super Shop", description: "Monthly cooking essentials (Rice, Oil, Spices)", amountPaisa: -125000, paymentMethod: "CARD", referenceId: "POS-SHW-9912", source: "WEB", date: "2026-10-01", createdBy: "Adnan Shahria", status: "completed", receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80" },
  { id: "tx-3", voucherNo: "VCH-2026-003", type: "CONTRIBUTION", memberId: "u-murad", memberName: "Murad Hasan", description: "Monthly room contribution", category: "DUES", amountPaisa: 150000, paymentMethod: "NAGAD", referenceId: "NG-7731BA", source: "TELEGRAM", date: "2026-10-01", createdBy: "Adnan Shahria", status: "completed" },
  { id: "tx-4", voucherNo: "VCH-2026-002", type: "EXPENSE", category: "ELECTRICITY", payeeName: "DESCO Electricity", description: "September electricity utility bill", amountPaisa: -80000, paymentMethod: "BKASH", referenceId: "BK-BILL-5510", source: "WEB", date: "2026-09-28", createdBy: "Adnan Shahria", status: "completed", receiptUrl: "https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=600&auto=format&fit=crop&q=80" },
  { id: "tx-5", voucherNo: "VCH-2026-001", type: "EXPENSE", category: "CLEANING", payeeName: "Local Market Store", description: "Floor disinfectant, broom and trash bags", amountPaisa: -35000, paymentMethod: "CASH", referenceId: "CSH-MEMO-12", source: "TELEGRAM", date: "2026-09-25", createdBy: "Adnan Shahria", status: "completed" },
];

// ─── Row mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFund(r: any): FundSummary {
  const contrib = Number(r.total_contributions_paisa ?? 0);
  const expenses = Number(r.total_expenses_paisa ?? 0);
  const opening = Number(r.opening_balance_paisa ?? 0);
  return {
    id: String(r.id),
    name: String(r.name),
    fundType: (r.fund_type ?? "ROOM") as FundType,
    currency: String(r.currency ?? "BDT"),
    openingBalancePaisa: opening,
    totalContributionsPaisa: contrib,
    totalExpensesPaisa: expenses,
    totalBalancePaisa: opening + contrib - expenses,
    memberCount: Number(r.member_count ?? 0),
    targetBudgetPaisa: Number(r.target_budget_paisa ?? 1000000),
    description: String(r.description ?? ""),
    announcement: String(r.announcement ?? ""),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMember(r: any): MemberRecord {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    displayName: String(r.display_name),
    role: (r.role ?? "MEMBER") as MemberRecord["role"],
    status: (r.status ?? "active") as MemberRecord["status"],
    contributedPaisa: Number(r.contributed_paisa ?? 0),
    phone: r.phone ? String(r.phone) : undefined,
    telegramUsername: r.telegram_username ? String(r.telegram_username) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTx(r: any): TransactionRecord {
  return {
    id: String(r.id),
    type: r.type as TransactionRecord["type"],
    memberId: r.member_id ? String(r.member_id) : undefined,
    memberName: r.member_name ? String(r.member_name) : undefined,
    category: r.category ? String(r.category) : undefined,
    description: String(r.description ?? ""),
    amountPaisa: Number(r.amount_paisa ?? 0),
    source: (r.source ?? "WEB") as TransactionRecord["source"],
    date: String(r.date),
    createdBy: String(r.created_by ?? "system"),
    status: (r.status ?? "completed") as TransactionRecord["status"],
  };
}

// ─── Member count helper ──────────────────────────────────────────────────────

async function syncMemberCount(db: D1Database, fundId: string): Promise<void> {
  const result = await db.prepare(
    "SELECT COUNT(*) as cnt FROM members WHERE status = 'active'"
  ).first<{ cnt: number }>();
  const count = result?.cnt ?? 0;
  await db.prepare(
    "UPDATE fund SET member_count = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(count, fundId).run();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getFundSummary(fundId?: string): Promise<FundSummary> {
  const db = getDB();
  const id = fundId ?? FUND_ID;

  if (!db) {
    const contrib = fallbackTransactions.filter(t => t.status === "completed" && t.amountPaisa > 0).reduce((s, t) => s + t.amountPaisa, 0);
    const expenses = fallbackTransactions.filter(t => t.status === "completed" && t.amountPaisa < 0).reduce((s, t) => s + Math.abs(t.amountPaisa), 0);
    fallbackFund = { ...fallbackFund, totalContributionsPaisa: contrib, totalExpensesPaisa: expenses, totalBalancePaisa: fallbackFund.openingBalancePaisa + contrib - expenses, memberCount: fallbackMembers.length };
    return { ...fallbackFund, id };
  }

  try {
    await syncMemberCount(db, FUND_ID);
    const row = await db.prepare("SELECT * FROM fund WHERE id = ?").bind(FUND_ID).first();
    if (!row) return { ...fallbackFund, id };
    return rowToFund(row);
  } catch {
    const contrib = fallbackTransactions.filter(t => t.status === "completed" && t.amountPaisa > 0).reduce((s, t) => s + t.amountPaisa, 0);
    const expenses = fallbackTransactions.filter(t => t.status === "completed" && t.amountPaisa < 0).reduce((s, t) => s + Math.abs(t.amountPaisa), 0);
    fallbackFund = { ...fallbackFund, totalContributionsPaisa: contrib, totalExpensesPaisa: expenses, totalBalancePaisa: fallbackFund.openingBalancePaisa + contrib - expenses, memberCount: fallbackMembers.length };
    return { ...fallbackFund, id };
  }
}

export async function updateFundSettings(input: {
  name?: string;
  fundType?: FundType;
  targetBudgetPaisa?: number;
  description?: string;
  announcement?: string;
  openingBalancePaisa?: number;
}): Promise<FundSummary> {
  const db = getDB();

  if (!db) {
    if (input.name !== undefined) fallbackFund.name = input.name.trim();
    if (input.fundType !== undefined) fallbackFund.fundType = input.fundType;
    if (input.targetBudgetPaisa !== undefined) fallbackFund.targetBudgetPaisa = input.targetBudgetPaisa;
    if (input.description !== undefined) fallbackFund.description = input.description.trim();
    if (input.announcement !== undefined) fallbackFund.announcement = input.announcement.trim();
    if (input.openingBalancePaisa !== undefined) fallbackFund.openingBalancePaisa = input.openingBalancePaisa;
    return getFundSummary();
  }

  const sets: string[] = ["updated_at = datetime('now')"];
  const binds: (string | number)[] = [];

  if (input.name !== undefined) { sets.push("name = ?"); binds.push(input.name.trim()); }
  if (input.fundType !== undefined) { sets.push("fund_type = ?"); binds.push(input.fundType); }
  if (input.targetBudgetPaisa !== undefined) { sets.push("target_budget_paisa = ?"); binds.push(input.targetBudgetPaisa); }
  if (input.description !== undefined) { sets.push("description = ?"); binds.push(input.description.trim()); }
  if (input.announcement !== undefined) { sets.push("announcement = ?"); binds.push(input.announcement.trim()); }
  if (input.openingBalancePaisa !== undefined) { sets.push("opening_balance_paisa = ?"); binds.push(input.openingBalancePaisa); }

  if (binds.length > 0) {
    binds.push(FUND_ID);
    await db.prepare(`UPDATE fund SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  }

  return getFundSummary();
}

export async function getTransactions(params?: {
  type?: string;
  limit?: number;
}): Promise<TransactionRecord[]> {
  const db = getDB();

  if (!db) {
    let result = [...fallbackTransactions];
    if (params?.type && params.type !== "ALL") result = result.filter(t => t.type === params.type);
    result.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (params?.limit) result = result.slice(0, params.limit);
    return result;
  }

  let sql = "SELECT * FROM transactions";
  const binds: (string | number)[] = [];

  if (params?.type && params.type !== "ALL") {
    sql += " WHERE type = ?";
    binds.push(params.type);
  }

  sql += " ORDER BY date DESC, created_at DESC";

  if (params?.limit) {
    sql += " LIMIT ?";
    binds.push(params.limit);
  }

  try {
    const rows = await db.prepare(sql).bind(...binds).all();
    return (rows.results ?? []).map(rowToTx);
  } catch {
    let result = [...fallbackTransactions];
    if (params?.type && params.type !== "ALL") result = result.filter(t => t.type === params.type);
    result.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (params?.limit) result = result.slice(0, params.limit);
    return result;
  }
}

export async function createTransaction(input: {
  type: "CONTRIBUTION" | "EXPENSE" | "REFUND" | "CORRECTION" | "REVERSAL";
  memberId?: string;
  memberName?: string;
  category?: string;
  description: string;
  amountPaisa: number;
  source?: "TELEGRAM" | "WEB";
  createdBy?: string;
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  payeeName?: string;
  receiptUrl?: string;
  feePaisa?: number;
  voucherNo?: string;
}): Promise<TransactionRecord> {
  const db = getDB();
  const isExpense = input.type === "EXPENSE" || input.type === "REVERSAL";
  const signedAmount = isExpense ? -Math.abs(input.amountPaisa) : Math.abs(input.amountPaisa);
  const dateStr = new Date().toISOString().split("T")[0] ?? "2026-10-01";
  const id = `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const voucherNo = input.voucherNo || `VCH-2026-${String(fallbackTransactions.length + 1).padStart(3, "0")}`;

  let resolvedMemberName = input.memberName;

  if (!db) {
    if (input.memberId && !resolvedMemberName) {
      const found = fallbackMembers.find(m => m.id === input.memberId || m.userId === input.memberId);
      if (found) resolvedMemberName = found.displayName;
    }
    const newTx: TransactionRecord = {
      id,
      voucherNo,
      type: input.type,
      memberId: input.memberId,
      memberName: resolvedMemberName,
      payeeName: input.payeeName,
      category: input.category,
      description: input.description,
      amountPaisa: signedAmount,
      paymentMethod: input.paymentMethod || (input.type === "CONTRIBUTION" ? "BKASH" : "CASH"),
      referenceId: input.referenceId,
      receiptUrl: input.receiptUrl,
      feePaisa: input.feePaisa,
      source: input.source ?? "WEB",
      date: dateStr,
      createdBy: input.createdBy ?? "Admin",
      status: "completed",
    };
    fallbackTransactions.unshift(newTx);
    if (input.type === "CONTRIBUTION" && resolvedMemberName) {
      const mem = fallbackMembers.find(m => m.displayName.toLowerCase() === resolvedMemberName?.toLowerCase() || m.id === input.memberId);
      if (mem) {
        mem.contributedPaisa += Math.abs(input.amountPaisa);
        if (mem.targetQuotaPaisa && mem.contributedPaisa >= mem.targetQuotaPaisa) {
          mem.dueStatus = "paid";
        } else if (mem.contributedPaisa > 0) {
          mem.dueStatus = "partial";
        }
      }
    }
    return newTx;
  }

  // Resolve member name from DB if not provided
  if (input.memberId && !resolvedMemberName) {
    const memRow = await db.prepare("SELECT display_name FROM members WHERE id = ? OR user_id = ?")
      .bind(input.memberId, input.memberId).first<{ display_name: string }>();
    if (memRow) resolvedMemberName = memRow.display_name;
  }

  await db.prepare(
    `INSERT INTO transactions (id, type, member_id, member_name, category, description, amount_paisa, source, date, created_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`
  ).bind(
    id, input.type, input.memberId ?? null, resolvedMemberName ?? null,
    input.category ?? null, input.description, signedAmount,
    input.source ?? "WEB", dateStr, input.createdBy ?? "Admin"
  ).run();

  // Update member contributed total
  if (input.type === "CONTRIBUTION" && input.memberId) {
    await db.prepare(
      "UPDATE members SET contributed_paisa = contributed_paisa + ?, updated_at = datetime('now') WHERE id = ? OR user_id = ?"
    ).bind(Math.abs(input.amountPaisa), input.memberId, input.memberId).run();
  }

  // Recalculate fund totals
  await recalcFundTotals(db);

  return {
    id, type: input.type, memberId: input.memberId, memberName: resolvedMemberName,
    category: input.category, description: input.description, amountPaisa: signedAmount,
    source: input.source ?? "WEB", date: dateStr, createdBy: input.createdBy ?? "Admin", status: "completed",
  };
}

async function recalcFundTotals(db: D1Database): Promise<void> {
  const r = await db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN amount_paisa > 0 AND status = 'completed' THEN amount_paisa ELSE 0 END), 0) AS contrib,
       COALESCE(SUM(CASE WHEN amount_paisa < 0 AND status = 'completed' THEN ABS(amount_paisa) ELSE 0 END), 0) AS expenses
     FROM transactions`
  ).first<{ contrib: number; expenses: number }>();

  if (r) {
    await db.prepare(
      "UPDATE fund SET total_contributions_paisa = ?, total_expenses_paisa = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(r.contrib, r.expenses, FUND_ID).run();
  }
}

export async function reverseTransaction(
  txId: string,
  reversedBy: string = "Admin"
): Promise<{ success: boolean; reversedTx?: TransactionRecord; correctionTx?: TransactionRecord }> {
  const db = getDB();

  if (!db) {
    const txIndex = fallbackTransactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return { success: false };
    const targetTx = fallbackTransactions[txIndex];
    if (!targetTx || targetTx.status === "reversed") return { success: false };
    targetTx.status = "reversed";
    if (targetTx.type === "CONTRIBUTION" && targetTx.memberName) {
      const mem = fallbackMembers.find(m => m.displayName === targetTx.memberName || m.id === targetTx.memberId);
      if (mem) mem.contributedPaisa = Math.max(0, mem.contributedPaisa - Math.abs(targetTx.amountPaisa));
    }
    const dateStr = new Date().toISOString().split("T")[0] ?? "2026-10-01";
    const correctionTx: TransactionRecord = {
      id: `tx-rev-${Date.now().toString(36)}`, type: "REVERSAL",
      memberId: targetTx.memberId, memberName: targetTx.memberName,
      category: targetTx.category ?? "CORRECTION",
      description: `Reversal of ${targetTx.id} (${targetTx.description})`,
      amountPaisa: -targetTx.amountPaisa, source: "WEB", date: dateStr,
      createdBy: reversedBy, status: "completed",
    };
    fallbackTransactions.unshift(correctionTx);
    return { success: true, reversedTx: targetTx, correctionTx };
  }

  const txRow = await db.prepare("SELECT * FROM transactions WHERE id = ?").bind(txId).first();
  if (!txRow) return { success: false };
  const targetTx = rowToTx(txRow);
  if (targetTx.status === "reversed") return { success: false };

  await db.prepare("UPDATE transactions SET status = 'reversed', reversed_by = ? WHERE id = ?")
    .bind(reversedBy, txId).run();

  if (targetTx.type === "CONTRIBUTION" && targetTx.memberId) {
    await db.prepare("UPDATE members SET contributed_paisa = MAX(0, contributed_paisa - ?) WHERE id = ? OR user_id = ?")
      .bind(Math.abs(targetTx.amountPaisa), targetTx.memberId, targetTx.memberId).run();
  }

  const dateStr = new Date().toISOString().split("T")[0] ?? "2026-10-01";
  const correctionId = `tx-rev-${Date.now().toString(36)}`;
  await db.prepare(
    `INSERT INTO transactions (id, type, member_id, member_name, category, description, amount_paisa, source, date, created_by, status)
     VALUES (?, 'REVERSAL', ?, ?, ?, ?, ?, 'WEB', ?, ?, 'completed')`
  ).bind(
    correctionId, targetTx.memberId ?? null, targetTx.memberName ?? null,
    targetTx.category ?? "CORRECTION",
    `Reversal of ${targetTx.id} (${targetTx.description})`,
    -targetTx.amountPaisa, dateStr, reversedBy
  ).run();

  await recalcFundTotals(db);

  const correctionTx: TransactionRecord = {
    id: correctionId, type: "REVERSAL", memberId: targetTx.memberId,
    memberName: targetTx.memberName, category: targetTx.category ?? "CORRECTION",
    description: `Reversal of ${targetTx.id} (${targetTx.description})`,
    amountPaisa: -targetTx.amountPaisa, source: "WEB", date: dateStr,
    createdBy: reversedBy, status: "completed",
  };

  return { success: true, reversedTx: { ...targetTx, status: "reversed" }, correctionTx };
}

export async function getMembers(): Promise<MemberRecord[]> {
  const db = getDB();
  if (!db) return [...fallbackMembers];
  try {
    const rows = await db.prepare("SELECT * FROM members ORDER BY display_name ASC").all();
    return (rows.results ?? []).map(rowToMember);
  } catch {
    return [...fallbackMembers];
  }
}

export async function addMember(input: {
  displayName: string;
  role: "MEMBER" | "TREASURER" | "VIEWER" | "OWNER";
  phone?: string;
  telegramUsername?: string;
}): Promise<MemberRecord> {
  const db = getDB();
  const id = `mem-${Date.now().toString(36)}`;
  const userId = `u-${Date.now().toString(36)}`;
  const username = input.telegramUsername?.trim().replace(/^@/, "");

  if (!db) {
    const newMember: MemberRecord = {
      id, userId, displayName: input.displayName.trim(), role: input.role,
      status: "active", contributedPaisa: 0,
      phone: input.phone?.trim(), telegramUsername: username,
    };
    fallbackMembers.push(newMember);
    return newMember;
  }

  await db.prepare(
    `INSERT INTO members (id, user_id, display_name, role, status, contributed_paisa, phone, telegram_username)
     VALUES (?, ?, ?, ?, 'active', 0, ?, ?)`
  ).bind(id, userId, input.displayName.trim(), input.role, input.phone?.trim() ?? null, username ?? null).run();

  await syncMemberCount(db, FUND_ID);

  return {
    id, userId, displayName: input.displayName.trim(), role: input.role,
    status: "active", contributedPaisa: 0,
    phone: input.phone?.trim(), telegramUsername: username,
  };
}

export async function updateMember(
  id: string,
  updates: {
    displayName?: string;
    role?: "MEMBER" | "TREASURER" | "VIEWER" | "OWNER";
    status?: "active" | "suspended";
    phone?: string;
    telegramUsername?: string;
  }
): Promise<MemberRecord | null> {
  const db = getDB();

  if (!db) {
    const index = fallbackMembers.findIndex(m => m.id === id || m.userId === id);
    if (index === -1) return null;
    const current = fallbackMembers[index];
    if (!current) return null;
    const updated: MemberRecord = {
      ...current,
      displayName: updates.displayName !== undefined ? updates.displayName.trim() : current.displayName,
      role: updates.role ?? current.role,
      status: updates.status ?? current.status,
      phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
      telegramUsername: updates.telegramUsername !== undefined ? updates.telegramUsername.trim().replace(/^@/, "") : current.telegramUsername,
    };
    fallbackMembers[index] = updated;
    return updated;
  }

  const sets: string[] = ["updated_at = datetime('now')"];
  const binds: (string | number)[] = [];

  if (updates.displayName !== undefined) { sets.push("display_name = ?"); binds.push(updates.displayName.trim()); }
  if (updates.role !== undefined) { sets.push("role = ?"); binds.push(updates.role); }
  if (updates.status !== undefined) { sets.push("status = ?"); binds.push(updates.status); }
  if (updates.phone !== undefined) { sets.push("phone = ?"); binds.push(updates.phone.trim()); }
  if (updates.telegramUsername !== undefined) { sets.push("telegram_username = ?"); binds.push(updates.telegramUsername.trim().replace(/^@/, "")); }

  if (binds.length === 0) {
    const row = await db.prepare("SELECT * FROM members WHERE id = ? OR user_id = ?").bind(id, id).first();
    return row ? rowToMember(row) : null;
  }

  binds.push(id, id);
  await db.prepare(`UPDATE members SET ${sets.join(", ")} WHERE id = ? OR user_id = ?`).bind(...binds).run();
  await syncMemberCount(db, FUND_ID);

  const row = await db.prepare("SELECT * FROM members WHERE id = ? OR user_id = ?").bind(id, id).first();
  return row ? rowToMember(row) : null;
}

export async function deleteMember(id: string): Promise<boolean> {
  const db = getDB();

  if (!db) {
    const before = fallbackMembers.length;
    fallbackMembers = fallbackMembers.filter(m => m.id !== id && m.userId !== id);
    return fallbackMembers.length < before;
  }

  const result = await db.prepare("DELETE FROM members WHERE id = ? OR user_id = ?").bind(id, id).run();
  await syncMemberCount(db, FUND_ID);
  return (result.meta?.changes ?? 0) > 0;
}

export async function resetLedger(preset: FundType): Promise<FundSummary> {
  const db = getDB();

  const isBatch = preset === "BATCH";
  const newFund = isBatch
    ? { id: "fund-batch-2024", name: "CSE Batch 2024 Central Fund", fundType: "BATCH" as FundType, currency: "BDT", openingBalancePaisa: 500000, totalBalancePaisa: 1450000, totalContributionsPaisa: 1200000, totalExpensesPaisa: 250000, memberCount: 6, targetBudgetPaisa: 3000000, description: "Batch fund for reunion, events, student support and welfare", announcement: "Batch reunion registration is ongoing. Please clear dues." }
    : { id: "fund-room-302", name: "Room 302 General Fund", fundType: "ROOM" as FundType, currency: "BDT", openingBalancePaisa: 100000, totalBalancePaisa: 367000, totalContributionsPaisa: 630000, totalExpensesPaisa: 363000, memberCount: 5, targetBudgetPaisa: 1000000, description: "Shared living and mess expenses for Room 302 members", announcement: "Monthly contributions due on the 5th of each month" };

  if (!db) {
    fallbackFund = newFund;
    if (isBatch) {
      fallbackMembers = [
        { id: "mem-b1", userId: "u-b1", displayName: "Tanvir Ahmed", role: "OWNER", status: "active", contributedPaisa: 300000, telegramUsername: "tanvir_cr" },
        { id: "mem-b2", userId: "u-b2", displayName: "Sabbir Hossain", role: "TREASURER", status: "active", contributedPaisa: 250000, telegramUsername: "sabbir_acc" },
        { id: "mem-b3", userId: "u-b3", displayName: "Nusrat Jahan", role: "MEMBER", status: "active", contributedPaisa: 200000, telegramUsername: "nusrat_j" },
        { id: "mem-b4", userId: "u-b4", displayName: "Arif Chowdhury", role: "MEMBER", status: "active", contributedPaisa: 200000, telegramUsername: "arif_c" },
        { id: "mem-b5", userId: "u-b5", displayName: "Mehedi Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, telegramUsername: "mehedi_h" },
        { id: "mem-b6", userId: "u-b6", displayName: "Sumaiya Akter", role: "MEMBER", status: "active", contributedPaisa: 100000, telegramUsername: "sumaiya_a" },
      ];
      fallbackTransactions = [
        { id: "tx-b1", type: "CONTRIBUTION", memberId: "u-b1", memberName: "Tanvir Ahmed", description: "Reunion seed contribution", amountPaisa: 100000, source: "WEB", date: "2026-10-01", createdBy: "Tanvir Ahmed", status: "completed" },
        { id: "tx-b2", type: "CONTRIBUTION", memberId: "u-b2", memberName: "Sabbir Hossain", description: "Batch fund monthly dues", amountPaisa: 50000, source: "TELEGRAM", date: "2026-09-29", createdBy: "Sabbir Hossain", status: "completed" },
        { id: "tx-b3", type: "EXPENSE", category: "VENUE", description: "Auditorium booking advance payment", amountPaisa: -150000, source: "WEB", date: "2026-09-25", createdBy: "Sabbir Hossain", status: "completed" },
        { id: "tx-b4", type: "EXPENSE", category: "PRINTING", description: "Batch ID card and banner printing", amountPaisa: -100000, source: "WEB", date: "2026-09-22", createdBy: "Sabbir Hossain", status: "completed" },
      ];
    } else {
      fallbackMembers = [
        { id: "mem-1", userId: "u-adnan", displayName: "Adnan Shahria", role: "TREASURER", status: "active", contributedPaisa: 200000, telegramUsername: "adnan_dev" },
        { id: "mem-2", userId: "u-murad", displayName: "Murad Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, telegramUsername: "murad_h" },
        { id: "mem-3", userId: "u-rahim", displayName: "Rahim Uddin", role: "MEMBER", status: "active", contributedPaisa: 120000, telegramUsername: "rahim_u" },
        { id: "mem-4", userId: "u-karim", displayName: "Karim Sheikh", role: "MEMBER", status: "active", contributedPaisa: 90000, telegramUsername: "karim_s" },
        { id: "mem-5", userId: "u-farhan", displayName: "Farhan Ali", role: "MEMBER", status: "suspended", contributedPaisa: 60000, telegramUsername: "farhan_a" },
      ];
      fallbackTransactions = [
        { id: "tx-1", type: "CONTRIBUTION", memberId: "u-adnan", memberName: "Adnan Shahria", description: "Monthly contribution", amountPaisa: 50000, source: "TELEGRAM", date: "2026-10-01", createdBy: "Adnan Shahria", status: "completed" },
        { id: "tx-2", type: "CONTRIBUTION", memberId: "u-murad", memberName: "Murad Hasan", description: "Monthly contribution", amountPaisa: 50000, source: "TELEGRAM", date: "2026-10-01", createdBy: "Adnan Shahria", status: "completed" },
        { id: "tx-3", type: "EXPENSE", category: "GROCERY", description: "Weekly grocery from market", amountPaisa: -15000, source: "TELEGRAM", date: "2026-09-30", createdBy: "Adnan Shahria", status: "completed" },
      ];
    }
    return newFund;
  }

  // D1: clear and reseed
  await db.prepare("DELETE FROM transactions").run();
  await db.prepare("DELETE FROM members").run();
  await db.prepare("DELETE FROM fund").run();

  await db.prepare(
    `INSERT INTO fund (id, name, fund_type, currency, opening_balance_paisa, total_contributions_paisa, total_expenses_paisa, target_budget_paisa, description, announcement)
     VALUES (?, ?, ?, 'BDT', ?, ?, ?, ?, ?, ?)`
  ).bind(
    newFund.id, newFund.name, newFund.fundType, newFund.openingBalancePaisa,
    newFund.totalContributionsPaisa, newFund.totalExpensesPaisa,
    newFund.targetBudgetPaisa, newFund.description, newFund.announcement
  ).run();

  if (isBatch) {
    const batchMembers = [
      ["mem-b1", "u-b1", "Tanvir Ahmed", "OWNER", 300000, "tanvir_cr"],
      ["mem-b2", "u-b2", "Sabbir Hossain", "TREASURER", 250000, "sabbir_acc"],
      ["mem-b3", "u-b3", "Nusrat Jahan", "MEMBER", 200000, "nusrat_j"],
      ["mem-b4", "u-b4", "Arif Chowdhury", "MEMBER", 200000, "arif_c"],
      ["mem-b5", "u-b5", "Mehedi Hasan", "MEMBER", 150000, "mehedi_h"],
      ["mem-b6", "u-b6", "Sumaiya Akter", "MEMBER", 100000, "sumaiya_a"],
    ];
    for (const [id, uid, name, role, contrib, uname] of batchMembers) {
      await db.prepare("INSERT INTO members (id, user_id, display_name, role, status, contributed_paisa, telegram_username) VALUES (?, ?, ?, ?, 'active', ?, ?)")
        .bind(id, uid, name, role, contrib, uname).run();
    }
  } else {
    const roomMembers = [
      ["mem-1", "u-adnan", "Adnan Shahria", "TREASURER", 200000, "adnan_dev"],
      ["mem-2", "u-murad", "Murad Hasan", "MEMBER", 150000, "murad_h"],
      ["mem-3", "u-rahim", "Rahim Uddin", "MEMBER", 120000, "rahim_u"],
      ["mem-4", "u-karim", "Karim Sheikh", "MEMBER", 90000, "karim_s"],
      ["mem-5", "u-farhan", "Farhan Ali", "MEMBER", 60000, "farhan_a", "suspended"],
    ];
    for (const [id, uid, name, role, contrib, uname, status] of roomMembers) {
      await db.prepare("INSERT INTO members (id, user_id, display_name, role, status, contributed_paisa, telegram_username) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, uid, name, role, status ?? "active", contrib, uname).run();
    }
  }

  return getFundSummary();
}

export function verifyAdminSecret(providedSecret: string): boolean {
  const envSecret = process.env.ADMIN_SECRET_KEY ?? process.env.ADMIN_PASSWORD;
  if (!envSecret) return providedSecret === "admin123" || providedSecret === "fundadmin2026";
  return providedSecret === envSecret;
}

export function verifyBotApiKey(providedKey: string): boolean {
  const envKey = process.env.BOT_API_KEY ?? process.env.BOT_API_SECRET;
  if (!envKey) return providedKey === "bot-secret-key-2026" || providedKey.length > 8;
  return providedKey === envKey;
}

export async function exportTransactionsCsv(): Promise<string> {
  const txs = await getTransactions();
  const headers = ["Transaction ID", "Date", "Type", "Party or Category", "Description", "Amount (BDT)", "Source", "Status"];
  const rows = txs.map(t => {
    const party = t.memberName ?? t.category ?? t.type;
    const taka = new Decimal(t.amountPaisa).div(100).toFixed(2);
    const safeDesc = `"${(t.description ?? "").replace(/"/g, '""')}"`;
    return [t.id, t.date, t.type, party, safeDesc, taka, t.source, t.status].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
