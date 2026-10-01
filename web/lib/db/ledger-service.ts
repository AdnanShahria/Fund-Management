import Decimal from "decimal.js";

export interface FundSummary {
  id: string;
  name: string;
  currency: string;
  openingBalancePaisa: number;
  totalBalancePaisa: number;
  totalContributionsPaisa: number;
  totalExpensesPaisa: number;
  memberCount: number;
}

export interface MemberRecord {
  id: string;
  userId: string;
  displayName: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  status: "active" | "suspended";
  contributedPaisa: number;
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

// ── In-Memory Store for Local Dev and Fast SSR ───────────────────────────────
// Initialized with Room 302 seed data matching seed.sql

let fundRecord: FundSummary = {
  id: "fund-room-302",
  name: "Room 302 General Fund",
  currency: "BDT",
  openingBalancePaisa: 100000, // ৳1,000.00
  totalBalancePaisa: 367000,
  totalContributionsPaisa: 630000,
  totalExpensesPaisa: 363000,
  memberCount: 5,
};

const membersStore: MemberRecord[] = [
  { id: "mem-1", userId: "u-adnan", displayName: "Adnan Shahria", role: "TREASURER", status: "active", contributedPaisa: 200000 },
  { id: "mem-2", userId: "u-murad", displayName: "Murad Hasan", role: "MEMBER", status: "active", contributedPaisa: 150000 },
  { id: "mem-3", userId: "u-rahim", displayName: "Rahim Uddin", role: "MEMBER", status: "active", contributedPaisa: 120000 },
  { id: "mem-4", userId: "u-karim", displayName: "Karim Sheikh", role: "MEMBER", status: "active", contributedPaisa: 90000 },
  { id: "mem-5", userId: "u-farhan", displayName: "Farhan Ali", role: "MEMBER", status: "suspended", contributedPaisa: 60000 },
];

const transactionsStore: TransactionRecord[] = [
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
    description: "Room floor cleaning liquids and supplies",
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

// ── Service Methods ──────────────────────────────────────────────────────────

export async function getFundSummary(fundId?: string): Promise<FundSummary> {
  recalculateSummary();
  if (fundId && fundId !== fundRecord.id) {
    return { ...fundRecord, id: fundId };
  }
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

  // Sort descending by date
  result.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (params?.limit) {
    result = result.slice(0, params.limit);
  }

  return result;
}

export async function createTransaction(input: {
  type: "CONTRIBUTION" | "EXPENSE";
  memberId?: string;
  memberName?: string;
  category?: string;
  description: string;
  amountPaisa: number;
  source?: "TELEGRAM" | "WEB";
  createdBy?: string;
}): Promise<TransactionRecord> {
  const isExpense = input.type === "EXPENSE";
  const signedAmount = isExpense ? -Math.abs(input.amountPaisa) : Math.abs(input.amountPaisa);
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0] ?? "2026-10-01";

  // Resolve member display name if memberId was given
  let resolvedMemberName = input.memberName;
  if (input.memberId && !resolvedMemberName) {
    const foundMember = membersStore.find((m) => m.id === input.memberId || m.userId === input.memberId);
    if (foundMember) {
      resolvedMemberName = foundMember.displayName;
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
    createdBy: input.createdBy ?? "Adnan Shahria",
    status: "completed",
  };

  transactionsStore.unshift(newTx);

  // If contribution, update member total
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

export async function getMembers(): Promise<MemberRecord[]> {
  return [...membersStore];
}

export async function addMember(input: {
  displayName: string;
  role: "MEMBER" | "TREASURER" | "VIEWER";
}): Promise<MemberRecord> {
  const newMember: MemberRecord = {
    id: `mem-${Date.now().toString(36)}`,
    userId: `u-${Date.now().toString(36)}`,
    displayName: input.displayName.trim(),
    role: input.role,
    status: "active",
    contributedPaisa: 0,
  };

  membersStore.push(newMember);
  recalculateSummary();
  return newMember;
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
