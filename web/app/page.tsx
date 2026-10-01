"use client";

import React, { useState, useEffect } from "react";
import Decimal from "decimal.js";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  RotateCcw,
  Download,
  Eye,
  Target,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useTelegramWebApp } from "@/lib/telegram/useTelegramWebApp";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Types
type TransactionType = "CONTRIBUTION" | "EXPENSE" | "REFUND" | "CORRECTION" | "REVERSAL";

interface Member {
  id: string;
  name: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  totalContributedPaisa: number;
  status: "active" | "suspended";
  telegramUsername?: string;
}

interface Transaction {
  id: string;
  type: TransactionType;
  memberName?: string;
  description: string;
  category?: string;
  amountPaisa: number;
  source: "TELEGRAM" | "WEB";
  date: string;
  createdBy: string;
  status: "completed" | "pending" | "reversed";
}

interface FundInfo {
  id: string;
  name: string;
  fundType: "ROOM" | "BATCH";
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

// Helpers
function paisa(taka: number): number {
  return Math.round(taka * 100);
}

function formatTaka(amountPaisa: number): string {
  const taka = new Decimal(amountPaisa).div(100);
  const abs = taka.abs();
  const formatted = abs
    .toNumber()
    .toLocaleString("en-BD", { minimumFractionDigits: 2 });
  return `৳${formatted}`;
}

// Fallback seed data
const initialFund: FundInfo = {
  id: "fund-main",
  name: "Room 302 General Fund",
  fundType: "ROOM",
  currency: "BDT",
  openingBalancePaisa: paisa(1000),
  totalBalancePaisa: paisa(3670),
  totalContributionsPaisa: paisa(6300),
  totalExpensesPaisa: paisa(3630),
  memberCount: 5,
  targetBudgetPaisa: paisa(10000),
  description: "Shared living and mess expenses for Room 302 members",
  announcement: "Monthly contributions due on the 5th of each month",
};

const seedMembers: Member[] = [
  { id: "m-1", name: "Adnan Shahria", role: "TREASURER", totalContributedPaisa: paisa(2000), status: "active", telegramUsername: "adnan_dev" },
  { id: "m-2", name: "Murad Hasan", role: "MEMBER", totalContributedPaisa: paisa(1500), status: "active", telegramUsername: "murad_h" },
  { id: "m-3", name: "Rahim Uddin", role: "MEMBER", totalContributedPaisa: paisa(1200), status: "active", telegramUsername: "rahim_u" },
  { id: "m-4", name: "Karim Sheikh", role: "MEMBER", totalContributedPaisa: paisa(900), status: "active", telegramUsername: "karim_s" },
  { id: "m-5", name: "Farhan Ali", role: "MEMBER", totalContributedPaisa: paisa(600), status: "suspended", telegramUsername: "farhan_a" },
];

const seedTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "CONTRIBUTION",
    memberName: "Adnan Shahria",
    description: "Monthly contribution",
    amountPaisa: paisa(500),
    source: "TELEGRAM",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-2",
    type: "CONTRIBUTION",
    memberName: "Murad Hasan",
    description: "Monthly contribution",
    amountPaisa: paisa(500),
    source: "TELEGRAM",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-3",
    type: "EXPENSE",
    description: "Weekly groceries from bazaar",
    category: "GROCERY",
    amountPaisa: -paisa(150),
    source: "TELEGRAM",
    date: "2026-09-30",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-4",
    type: "CONTRIBUTION",
    memberName: "Rahim Uddin",
    description: "Monthly contribution",
    amountPaisa: paisa(300),
    source: "WEB",
    date: "2026-09-30",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-5",
    type: "EXPENSE",
    description: "Electricity bill share",
    category: "ELECTRICITY",
    amountPaisa: -paisa(400),
    source: "TELEGRAM",
    date: "2026-09-28",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-6",
    type: "CONTRIBUTION",
    memberName: "Karim Sheikh",
    description: "Monthly contribution",
    amountPaisa: paisa(300),
    source: "TELEGRAM",
    date: "2026-09-27",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-7",
    type: "EXPENSE",
    description: "Cleaning supplies",
    category: "CLEANING",
    amountPaisa: -paisa(120),
    source: "WEB",
    date: "2026-09-25",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-8",
    type: "REFUND",
    memberName: "Farhan Ali",
    description: "Refund for overpayment",
    amountPaisa: paisa(100),
    source: "WEB",
    date: "2026-09-20",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
];

function RoleBadge({ role }: { role: Member["role"] }) {
  const map: Record<Member["role"], { label: string; className: string }> = {
    OWNER: {
      label: "Owner",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    TREASURER: {
      label: "Treasurer",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    MEMBER: {
      label: "Member",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    VIEWER: {
      label: "Viewer",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
  };
  const { label, className } = map[role];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function TxTypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, { label: string; className: string; icon: React.ReactNode }> = {
    CONTRIBUTION: {
      label: "Contribution",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      icon: <ArrowUpRight className="h-3 w-3" />,
    },
    EXPENSE: {
      label: "Expense",
      className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      icon: <ArrowDownRight className="h-3 w-3" />,
    },
    REFUND: {
      label: "Refund",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      icon: <RotateCcw className="h-3 w-3" />,
    },
    CORRECTION: {
      label: "Correction",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      icon: <Activity className="h-3 w-3" />,
    },
    REVERSAL: {
      label: "Reversal",
      className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
      icon: <RotateCcw className="h-3 w-3" />,
    },
  };
  const { label, className, icon } = map[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const { user: tgUser, isInsideTelegram } = useTelegramWebApp();

  const [fund, setFund] = useState<FundInfo>(initialFund);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "members">("overview");
  const [txFilter, setTxFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const [fundRes, membersRes, txRes] = await Promise.all([
          fetch("/api/fund"),
          fetch("/api/members"),
          fetch("/api/transactions"),
        ]);

        if (fundRes.ok) {
          const fundData = (await fundRes.json()) as { ok?: boolean; fund?: FundInfo };
          if (fundData.ok && fundData.fund) setFund(fundData.fund);
        }

        if (membersRes.ok) {
          const membersData = (await membersRes.json()) as {
            ok?: boolean;
            members?: Array<{
              id: string;
              displayName: string;
              role: Member["role"];
              contributedPaisa: number;
              status: Member["status"];
              telegramUsername?: string;
            }>;
          };
          if (membersData.ok && Array.isArray(membersData.members)) {
            setMembers(
              membersData.members.map((m) => ({
                id: m.id,
                name: m.displayName,
                role: m.role,
                totalContributedPaisa: m.contributedPaisa,
                status: m.status,
                telegramUsername: m.telegramUsername,
              }))
            );
          }
        }

        if (txRes.ok) {
          const txData = (await txRes.json()) as { ok?: boolean; transactions?: Transaction[] };
          if (txData.ok && Array.isArray(txData.transactions)) {
            setTransactions(txData.transactions);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live API data, using seed state:", err);
      }
    }
    loadData();
  }, []);

  // Ledger totals
  const totalContributionsPaisa = transactions
    .filter((t) => t.type === "CONTRIBUTION" && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0);

  const totalRefundsPaisa = transactions
    .filter((t) => t.type === "REFUND" && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0);

  const totalExpensesPaisa = transactions
    .filter((t) => (t.type === "EXPENSE" || t.type === "REVERSAL") && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0);

  const currentBalancePaisa =
    fund.openingBalancePaisa +
    totalContributionsPaisa +
    totalRefundsPaisa +
    totalExpensesPaisa;

  // Expense breakdown
  const expenseCategories: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "EXPENSE" && t.status !== "reversed")
    .forEach((t) => {
      const cat = t.category || "OTHER";
      expenseCategories[cat] = (expenseCategories[cat] ?? 0) + Math.abs(t.amountPaisa);
    });

  const filteredTransactions = transactions.filter((t) => {
    if (txFilter === "ALL") return true;
    return t.type === txFilter;
  });

  const progressPercent = fund.targetBudgetPaisa > 0
    ? Math.min(100, Math.round((currentBalancePaisa / fund.targetBudgetPaisa) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">

        {/* Telegram Mini App indicator */}
        {isInsideTelegram && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-sky-400" />
              <span>
                Telegram Mini App active{tgUser ? ` (Connected as ${tgUser.first_name}${tgUser.username ? ` @${tgUser.username}` : ""})` : ""}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-sky-500/20 px-2 py-0.5 rounded text-sky-300">
              Synced
            </span>
          </div>
        )}

        {/* User side read only notice */}
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 dark:bg-slate-900/50 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
          <Eye className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Public Ledger View (Read Only)
            </p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              This dashboard provides complete financial transparency for all fund members.
              To record contributions or report expenses, talk directly to the Telegram bot in your group chat using commands like{" "}
              <code className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/add Murad 200</code> or{" "}
              <code className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/expense 90 grocery</code>.
            </p>
          </div>
        </div>

        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/70 p-8 text-white shadow-xl ring-1 ring-white/10">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-widest text-[11px] py-1 font-semibold bg-emerald-950/70 text-emerald-300 border-emerald-700/50">
                  {fund.fundType === "BATCH" ? "Batch Fund" : "Room Fund"}
                </Badge>
                <span className="text-xs text-emerald-300/80 font-mono">
                  Cloudflare Ledger · Zero Discrepancy
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {fund.name}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {fund.description}
              </p>
              {fund.announcement && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Notice: {fund.announcement}</span>
                </div>
              )}
            </div>

            {/* Export CSV action */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                id="btn-export-hero"
                href="/api/export"
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition shadow"
              >
                <Download className="h-4 w-4" />
                Export CSV Ledger
              </a>
            </div>
          </div>

          {/* Stats overview */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Current Net Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold tabular-nums ${currentBalancePaisa >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatTaka(currentBalancePaisa)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Collected
              </p>
              <p className="text-2xl font-bold tabular-nums text-slate-200">
                {formatTaka(totalContributionsPaisa)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Spent
              </p>
              <p className="text-2xl font-bold tabular-nums text-red-400">
                {formatTaka(Math.abs(totalExpensesPaisa))}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Active Members
              </p>
              <p className="text-2xl font-bold tabular-nums text-slate-200">
                {members.filter((m) => m.status === "active").length}
              </p>
            </div>
          </div>

          {/* Target budget progress */}
          {fund.targetBudgetPaisa > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  Target Budget Goal: {formatTaka(fund.targetBudgetPaisa)}
                </span>
                <span className="font-mono text-emerald-300">
                  {progressPercent}% Achieved
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Navigation tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "overview"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Overview & Breakdown
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "transactions"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Transaction History ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "members"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Member Directory ({members.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Expense category breakdown */}
              <Card className="lg:col-span-1 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">
                    Spending by Category
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Distribution of all verified expenditures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(expenseCategories).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No expenses recorded yet.
                    </p>
                  ) : (
                    Object.entries(expenseCategories).map(([cat, paisaVal]) => {
                      const totalExp = Math.abs(totalExpensesPaisa) || 1;
                      const percent = Math.round((paisaVal / totalExp) * 100);
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {cat}
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {formatTaka(paisaVal)} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-red-500 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Recent activity summary */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold">
                      Latest Activity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Recent transactions recorded via Telegram or administrative audit
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View All →
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.slice(0, 6).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                        <div className="flex items-center gap-3">
                          <TxTypeBadge type={tx.type} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {tx.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.memberName || tx.category || "General"} · {tx.date} · via {tx.source}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            tx.amountPaisa > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {tx.amountPaisa > 0 ? "+" : ""}
                          {formatTaka(tx.amountPaisa)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Member contribution leaders */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  Member Contribution Standings
                </CardTitle>
                <CardDescription className="text-xs">
                  Summary of member share and participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {m.name}
                          </p>
                          {m.telegramUsername && (
                            <p className="text-xs text-sky-500 font-mono">
                              @{m.telegramUsername}
                            </p>
                          )}
                        </div>
                        <RoleBadge role={m.role} />
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground">Contributed</span>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatTaka(m.totalContributedPaisa)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === "transactions" && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold">
                  Immutable Transaction History
                </CardTitle>
                <CardDescription className="text-xs">
                  Every entry is cryptographically verifiable and logged with timestamp and author
                </CardDescription>
              </div>

              {/* Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "CONTRIBUTION", "EXPENSE", "REFUND", "REVERSAL"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      txFilter === filter
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Party or Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Recorded By</th>
                      <th className="px-6 py-3 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition ${
                          tx.status === "reversed" ? "opacity-50 line-through" : ""
                        }`}
                      >
                        <td className="px-6 py-3.5">
                          <TxTypeBadge type={tx.type} />
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {tx.memberName || tx.category || "General"}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                          {tx.description}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">
                          {tx.date}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">
                          {tx.createdBy}
                        </td>
                        <td
                          className={`px-6 py-3.5 text-right font-mono font-bold tabular-nums ${
                            tx.amountPaisa > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {tx.amountPaisa > 0 ? "+" : ""}
                          {formatTaka(tx.amountPaisa)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Members */}
        {activeTab === "members" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Registered Members
              </h2>
              <p className="text-xs text-muted-foreground">
                All members in this fund with assigned roles and total contributions
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => (
                <Card key={m.id} className="shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </p>
                        {m.telegramUsername ? (
                          <p className="text-xs text-sky-500 font-mono">
                            @{m.telegramUsername}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {m.id}
                          </p>
                        )}
                      </div>
                      <RoleBadge role={m.role} />
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Contributed</p>
                        <p className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatTaka(m.totalContributedPaisa)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          m.status === "active"
                            ? "text-emerald-600 border-emerald-300"
                            : "text-amber-600 border-amber-300"
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
