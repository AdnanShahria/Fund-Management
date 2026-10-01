import Decimal from "decimal.js";

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

export interface MemberRecord {
  id: string;
  userId: string;
  displayName: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  status: "active" | "suspended";
  contributedPaisa: number;
  phone?: string;
  telegramUsername?: string;
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
}

// Default in memory store with Room 302 initial state
let fundRecord: FundSummary = {
  id: "fund-room-302",
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

let membersStore: MemberRecord[] = [
  { id: "mem-1", userId: "u-adnan", displayName: "Adnan Shahria", role: "TREASURER", status: "active", contributedPaisa: 200000, telegramUsername: "adnan_dev" },
  { id: "mem-2", userId: "u-murad", displayName: "Murad Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, telegramUsername: "murad_h" },
  { id: "mem-3", userId: "u-rahim", displayName: "Rahim Uddin", role: "MEMBER", status: "active", contributedPaisa: 120000, telegramUsername: "rahim_u" },
  { id: "mem-4", userId: "u-karim", displayName: "Karim Sheikh", role: "MEMBER", status: "active", contributedPaisa: 90000, telegramUsername: "karim_s" },
  { id: "mem-5", userId: "u-farhan", displayName: "Farhan Ali", role: "MEMBER", status: "suspended", contributedPaisa: 60000, telegramUsername: "farhan_a" },
];

let transactionsStore: TransactionRecord[] = [
  {
    id: "tx-1",
    type: "CONTRIBUTION",
    memberId: "u-adnan",
    memberName: "Adnan Shahria",
    description: "Monthly contribution",
    amountPaisa: 50000,
    source: "TELEGRAM",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-2",
    type: "CONTRIBUTION",
    memberId: "u-murad",
    memberName: "Murad Hasan",
    description: "Monthly contribution",
    amountPaisa: 50000,
    source: "TELEGRAM",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-3",
    type: "EXPENSE",
    category: "GROCERY",
    description: "Weekly grocery from market",
    amountPaisa: -15000,
    source: "TELEGRAM",
    date: "2026-09-30",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-4",
    type: "EXPENSE",
    category: "ELECTRICITY",
    description: "September electricity bill share",
    amountPaisa: -8000,
    source: "WEB",
    date: "2026-09-28",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-5",
    type: "CONTRIBUTION",
    memberId: "u-rahim",
    memberName: "Rahim Uddin",
    description: "Contribution for grocery and utilities",
    amountPaisa: 40000,
    source: "TELEGRAM",
    date: "2026-09-26",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-6",
    type: "EXPENSE",
    category: "CLEANING",
    description: "Room floor cleaning supplies",
    amountPaisa: -3500,
    source: "TELEGRAM",
    date: "2026-09-24",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
];

function recalculateSummary(): void {
  let totalContributions = 0;
  let totalExpenses = 0;

  for (const tx of transactionsStore) {
    if (tx.status === "completed") {
      if (tx.amountPaisa > 0) {
        totalContributions += tx.amountPaisa;
      } else {
        totalExpenses += Math.abs(tx.amountPaisa);
      }
    }
  }

  const netBalance = fundRecord.openingBalancePaisa + totalContributions - totalExpenses;

  fundRecord = {
    ...fundRecord,
    totalBalancePaisa: netBalance,
    totalContributionsPaisa: totalContributions,
    totalExpensesPaisa: totalExpenses,
    memberCount: membersStore.length,
  };
}

export async function getFundSummary(fundId?: string): Promise<FundSummary> {
  recalculateSummary();
  if (fundId && fundId !== fundRecord.id) {
    return { ...fundRecord, id: fundId };
  }
  return { ...fundRecord };
}

export async function updateFundSettings(input: {
  name?: string;
  fundType?: FundType;
  targetBudgetPaisa?: number;
  description?: string;
  announcement?: string;
  openingBalancePaisa?: number;
}): Promise<FundSummary> {
  if (input.name !== undefined) fundRecord.name = input.name.trim();
  if (input.fundType !== undefined) fundRecord.fundType = input.fundType;
  if (input.targetBudgetPaisa !== undefined) fundRecord.targetBudgetPaisa = input.targetBudgetPaisa;
  if (input.description !== undefined) fundRecord.description = input.description.trim();
  if (input.announcement !== undefined) fundRecord.announcement = input.announcement.trim();
  if (input.openingBalancePaisa !== undefined) fundRecord.openingBalancePaisa = input.openingBalancePaisa;

  recalculateSummary();
  return { ...fundRecord };
}

export async function getTransactions(params?: {
  type?: string;
  limit?: number;
}): Promise<TransactionRecord[]> {
  let result = [...transactionsStore];

  if (params?.type && params.type !== "ALL") {
    result = result.filter((t) => t.type === params.type);
  }

  result.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (params?.limit) {
    result = result.slice(0, params.limit);
  }

  return result;
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
}): Promise<TransactionRecord> {
  const isExpense = input.type === "EXPENSE" || input.type === "REVERSAL";
  const signedAmount = isExpense ? -Math.abs(input.amountPaisa) : Math.abs(input.amountPaisa);
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0] ?? "2026-10-01";

  let resolvedMemberName = input.memberName;
  if (input.memberId && !resolvedMemberName) {
    const found = membersStore.find((m) => m.id === input.memberId || m.userId === input.memberId);
    if (found) {
      resolvedMemberName = found.displayName;
    }
  }

  const newTx: TransactionRecord = {
    id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    memberId: input.memberId,
    memberName: resolvedMemberName,
    category: input.category,
    description: input.description,
    amountPaisa: signedAmount,
    source: input.source ?? "WEB",
    date: dateStr,
    createdBy: input.createdBy ?? "Admin",
    status: "completed",
  };

  transactionsStore.unshift(newTx);

  if (input.type === "CONTRIBUTION" && resolvedMemberName) {
    const memIndex = membersStore.findIndex(
      (m) => m.displayName.toLowerCase() === resolvedMemberName?.toLowerCase() || m.id === input.memberId
    );
    if (memIndex >= 0) {
      const existing = membersStore[memIndex];
      if (existing) {
        membersStore[memIndex] = {
          ...existing,
          contributedPaisa: existing.contributedPaisa + Math.abs(input.amountPaisa),
        };
      }
    }
  }

  recalculateSummary();
  return newTx;
}

export async function reverseTransaction(
  txId: string,
  reversedBy: string = "Admin"
): Promise<{ success: boolean; reversedTx?: TransactionRecord; correctionTx?: TransactionRecord }> {
  const txIndex = transactionsStore.findIndex((t) => t.id === txId);
  if (txIndex === -1) {
    return { success: false };
  }

  const targetTx = transactionsStore[txIndex];
  if (!targetTx || targetTx.status === "reversed") {
    return { success: false };
  }

  // Mark original as reversed
  targetTx.status = "reversed";

  // Deduct from member if contribution
  if (targetTx.type === "CONTRIBUTION" && targetTx.memberName) {
    const mem = membersStore.find((m) => m.displayName === targetTx.memberName || m.id === targetTx.memberId);
    if (mem) {
      mem.contributedPaisa = Math.max(0, mem.contributedPaisa - Math.abs(targetTx.amountPaisa));
    }
  }

  // Create compensating reversal transaction record
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0] ?? "2026-10-01";
  const correctionTx: TransactionRecord = {
    id: `tx-rev-${Date.now().toString(36)}`,
    type: "REVERSAL",
    memberId: targetTx.memberId,
    memberName: targetTx.memberName,
    category: targetTx.category ?? "CORRECTION",
    description: `Reversal of transaction ${targetTx.id} (${targetTx.description})`,
    amountPaisa: -targetTx.amountPaisa,
    source: "WEB",
    date: dateStr,
    createdBy: reversedBy,
    status: "completed",
  };

  transactionsStore.unshift(correctionTx);
  recalculateSummary();

  return { success: true, reversedTx: targetTx, correctionTx };
}

export async function getMembers(): Promise<MemberRecord[]> {
  return [...membersStore];
}

export async function addMember(input: {
  displayName: string;
  role: "MEMBER" | "TREASURER" | "VIEWER" | "OWNER";
  phone?: string;
  telegramUsername?: string;
}): Promise<MemberRecord> {
  const newMember: MemberRecord = {
    id: `mem-${Date.now().toString(36)}`,
    userId: `u-${Date.now().toString(36)}`,
    displayName: input.displayName.trim(),
    role: input.role,
    status: "active",
    contributedPaisa: 0,
    phone: input.phone?.trim(),
    telegramUsername: input.telegramUsername?.trim().replace(/^@/, ""),
  };

  membersStore.push(newMember);
  recalculateSummary();
  return newMember;
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
  const index = membersStore.findIndex((m) => m.id === id || m.userId === id);
  if (index === -1) return null;

  const current = membersStore[index];
  if (!current) return null;

  const updated: MemberRecord = {
    ...current,
    displayName: updates.displayName !== undefined ? updates.displayName.trim() : current.displayName,
    role: updates.role !== undefined ? updates.role : current.role,
    status: updates.status !== undefined ? updates.status : current.status,
    phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
    telegramUsername: updates.telegramUsername !== undefined ? updates.telegramUsername.trim().replace(/^@/, "") : current.telegramUsername,
  };

  membersStore[index] = updated;
  return updated;
}

export async function deleteMember(id: string): Promise<boolean> {
  const initialLength = membersStore.length;
  membersStore = membersStore.filter((m) => m.id !== id && m.userId !== id);
  const removed = membersStore.length < initialLength;
  if (removed) recalculateSummary();
  return removed;
}

export async function resetLedger(preset: FundType): Promise<FundSummary> {
  if (preset === "BATCH") {
    fundRecord = {
      id: "fund-batch-2024",
      name: "CSE Batch 2024 Central Fund",
      fundType: "BATCH",
      currency: "BDT",
      openingBalancePaisa: 500000,
      totalBalancePaisa: 1450000,
      totalContributionsPaisa: 1200000,
      totalExpensesPaisa: 250000,
      memberCount: 6,
      targetBudgetPaisa: 3000000,
      description: "Batch fund for reunion, events, student support and welfare",
      announcement: "Batch reunion registration is ongoing. Please clear dues.",
    };

    membersStore = [
      { id: "mem-b1", userId: "u-b1", displayName: "Tanvir Ahmed", role: "OWNER", status: "active", contributedPaisa: 300000, telegramUsername: "tanvir_cr" },
      { id: "mem-b2", userId: "u-b2", displayName: "Sabbir Hossain", role: "TREASURER", status: "active", contributedPaisa: 250000, telegramUsername: "sabbir_acc" },
      { id: "mem-b3", userId: "u-b3", displayName: "Nusrat Jahan", role: "MEMBER", status: "active", contributedPaisa: 200000, telegramUsername: "nusrat_j" },
      { id: "mem-b4", userId: "u-b4", displayName: "Arif Chowdhury", role: "MEMBER", status: "active", contributedPaisa: 200000, telegramUsername: "arif_c" },
      { id: "mem-b5", userId: "u-b5", displayName: "Mehedi Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, telegramUsername: "mehedi_h" },
      { id: "mem-b6", userId: "u-b6", displayName: "Sumaiya Akter", role: "MEMBER", status: "active", contributedPaisa: 100000, telegramUsername: "sumaiya_a" },
    ];

    transactionsStore = [
      {
        id: "tx-b1",
        type: "CONTRIBUTION",
        memberId: "u-b1",
        memberName: "Tanvir Ahmed",
        description: "Reunion seed contribution",
        amountPaisa: 100000,
        source: "WEB",
        date: "2026-10-01",
        createdBy: "Tanvir Ahmed",
        status: "completed",
      },
      {
        id: "tx-b2",
        type: "CONTRIBUTION",
        memberId: "u-b2",
        memberName: "Sabbir Hossain",
        description: "Batch fund monthly dues",
        amountPaisa: 50000,
        source: "TELEGRAM",
        date: "2026-09-29",
        createdBy: "Sabbir Hossain",
        status: "completed",
      },
      {
        id: "tx-b3",
        type: "EXPENSE",
        category: "VENUE",
        description: "Auditorium booking advance payment",
        amountPaisa: -150000,
        source: "WEB",
        date: "2026-09-25",
        createdBy: "Sabbir Hossain",
        status: "completed",
      },
      {
        id: "tx-b4",
        type: "EXPENSE",
        category: "PRINTING",
        description: "Batch ID card and banner printing",
        amountPaisa: -100000,
        source: "WEB",
        date: "2026-09-22",
        createdBy: "Sabbir Hossain",
        status: "completed",
      },
    ];
  } else {
    // ROOM PRESET
    fundRecord = {
      id: "fund-room-302",
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

    membersStore = [
      { id: "mem-1", userId: "u-adnan", displayName: "Adnan Shahria", role: "TREASURER", status: "active", contributedPaisa: 200000, telegramUsername: "adnan_dev" },
      { id: "mem-2", userId: "u-murad", displayName: "Murad Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000, telegramUsername: "murad_h" },
      { id: "mem-3", userId: "u-rahim", displayName: "Rahim Uddin", role: "MEMBER", status: "active", contributedPaisa: 120000, telegramUsername: "rahim_u" },
      { id: "mem-4", userId: "u-karim", displayName: "Karim Sheikh", role: "MEMBER", status: "active", contributedPaisa: 90000, telegramUsername: "karim_s" },
      { id: "mem-5", userId: "u-farhan", displayName: "Farhan Ali", role: "MEMBER", status: "suspended", contributedPaisa: 60000, telegramUsername: "farhan_a" },
    ];

    transactionsStore = [
      {
        id: "tx-1",
        type: "CONTRIBUTION",
        memberId: "u-adnan",
        memberName: "Adnan Shahria",
        description: "Monthly contribution",
        amountPaisa: 50000,
        source: "TELEGRAM",
        date: "2026-10-01",
        createdBy: "Adnan Shahria",
        status: "completed",
      },
      {
        id: "tx-2",
        type: "CONTRIBUTION",
        memberId: "u-murad",
        memberName: "Murad Hasan",
        description: "Monthly contribution",
        amountPaisa: 50000,
        source: "TELEGRAM",
        date: "2026-10-01",
        createdBy: "Adnan Shahria",
        status: "completed",
      },
      {
        id: "tx-3",
        type: "EXPENSE",
        category: "GROCERY",
        description: "Weekly grocery from market",
        amountPaisa: -15000,
        source: "TELEGRAM",
        date: "2026-09-30",
        createdBy: "Adnan Shahria",
        status: "completed",
      },
    ];
  }

  recalculateSummary();
  return { ...fundRecord };
}

export function verifyAdminSecret(providedSecret: string): boolean {
  const envSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD;
  if (!envSecret) {
    // In local development when not yet configured, allow a standard key
    return providedSecret === "admin123" || providedSecret === "fundadmin2026";
  }
  return providedSecret === envSecret;
}

export function verifyBotApiKey(providedKey: string): boolean {
  const envKey = process.env.BOT_API_KEY || process.env.BOT_API_SECRET;
  if (!envKey) {
    return providedKey === "bot-secret-key-2026" || providedKey.length > 8;
  }
  return providedKey === envKey;
}

export async function exportTransactionsCsv(): Promise<string> {
  const txs = await getTransactions();

  const headers = ["Transaction ID", "Date", "Type", "Party or Category", "Description", "Amount (BDT)", "Source", "Status"];
  const rows = txs.map((t) => {
    const party = t.memberName || t.category || t.type;
    const taka = new Decimal(t.amountPaisa).div(100).toFixed(2);
    const safeDesc = `"${(t.description || "").replace(/"/g, '""')}"`;
    return [t.id, t.date, t.type, party, safeDesc, taka, t.source, t.status].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
