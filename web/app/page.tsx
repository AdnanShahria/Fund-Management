"use client";

import React, { useState, useEffect } from "react";
import Decimal from "decimal.js";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Wallet,
  RotateCcw,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useTelegramWebApp } from "@/lib/telegram/useTelegramWebApp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionType = "CONTRIBUTION" | "EXPENSE" | "REFUND" | "CORRECTION" | "REVERSAL";

interface Member {
  id: string;
  name: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  totalContributedPaisa: number;
  status: "active" | "suspended";
}

interface Transaction {
  id: string;
  type: TransactionType;
  memberName?: string;
  description: string;
  category?: string;
  amountPaisa: number; // positive = credit, negative = debit
  source: "TELEGRAM" | "WEB";
  date: string;
  createdBy: string;
  status: "completed" | "pending" | "reversed";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Seed data ────────────────────────────────────────────────────────────────

const OPENING_BALANCE_PAISA = paisa(1000);

const seedMembers: Member[] = [
  { id: "m-1", name: "Adnan Shahria", role: "TREASURER", totalContributedPaisa: paisa(2000), status: "active" },
  { id: "m-2", name: "Murad Hasan", role: "MEMBER", totalContributedPaisa: paisa(1500), status: "active" },
  { id: "m-3", name: "Rahim Uddin", role: "MEMBER", totalContributedPaisa: paisa(1200), status: "active" },
  { id: "m-4", name: "Karim Sheikh", role: "MEMBER", totalContributedPaisa: paisa(900), status: "active" },
  { id: "m-5", name: "Farhan Ali", role: "MEMBER", totalContributedPaisa: paisa(600), status: "suspended" },
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
    description: "Grocery — vegetables and rice",
    category: "GROCERY",
    amountPaisa: -paisa(150),
    source: "TELEGRAM",
    date: "2026-10-01",
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
    description: "Electricity bill — September",
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
    description: "Refund — overpaid last month",
    amountPaisa: paisa(100),
    source: "WEB",
    date: "2026-09-20",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
];

// ─── Small components ─────────────────────────────────────────────────────────

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
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
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
      className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
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
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: Transaction["status"] }) {
  if (status === "completed")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "reversed")
    return <XCircle className="h-3.5 w-3.5 text-slate-400" />;
  return <Clock className="h-3.5 w-3.5 text-amber-400" />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isInsideTelegram, user: tgUser, triggerHaptic } = useTelegramWebApp();
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "members">("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"contribution" | "expense">("contribution");

  // Form state
  const [formMember, setFormMember] = useState(seedMembers[0].name);
  const [formAmountTaka, setFormAmountTaka] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("GROCERY");

  // Load live data from API routes on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [txRes, memRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/members"),
        ]);

        if (txRes.ok) {
          const txData = (await txRes.json()) as { ok: boolean; transactions?: Transaction[] };
          if (txData.transactions && Array.isArray(txData.transactions)) {
            setTransactions(txData.transactions);
          }
        }

        if (memRes.ok) {
          interface ApiMember {
            id: string;
            displayName: string;
            role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
            contributedPaisa: number;
            status: "active" | "suspended";
          }
          const memData = (await memRes.json()) as { ok: boolean; members?: ApiMember[] };
          if (memData.members && Array.isArray(memData.members)) {
            setMembers(
              memData.members.map((m: ApiMember) => ({
                id: m.id,
                name: m.displayName,
                role: m.role,
                totalContributedPaisa: m.contributedPaisa,
                status: m.status,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch live API data, using seed state:", err);
      }
    }
    loadData();
  }, []);

  // ── Derived ledger ─────────────────────────────────────────────────────────

  const totalContributionsPaisa = transactions
    .filter((t) => t.type === "CONTRIBUTION" && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0);

  const totalRefundsPaisa = transactions
    .filter((t) => t.type === "REFUND" && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0);

  const totalExpensesPaisa = transactions
    .filter((t) => (t.type === "EXPENSE" || t.type === "REVERSAL") && t.status !== "reversed")
    .reduce((acc, t) => acc + t.amountPaisa, 0); // amountPaisa is negative for expenses

  const currentBalancePaisa =
    OPENING_BALANCE_PAISA +
    totalContributionsPaisa +
    totalRefundsPaisa +
    totalExpensesPaisa;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openModal(mode: "contribution" | "expense") {
    setModalMode(mode);
    setFormAmountTaka("");
    setFormDescription("");
    setFormMember(members[0]?.name || "Adnan Shahria");
    setFormCategory("GROCERY");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountTaka = parseFloat(formAmountTaka);
    if (isNaN(amountTaka) || amountTaka <= 0) return;

    const amountP = paisa(amountTaka);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: modalMode === "contribution" ? "CONTRIBUTION" : "EXPENSE",
      memberName: modalMode === "contribution" ? formMember : undefined,
      description: formDescription || (modalMode === "contribution" ? "Manual contribution" : "Manual expense"),
      category: modalMode === "expense" ? formCategory : undefined,
      amountPaisa: modalMode === "contribution" ? amountP : -amountP,
      source: "WEB",
      date: new Date().toISOString().split("T")[0],
      createdBy: "Adnan Shahria",
      status: "completed",
    };

    // Optimistically update client state
    setTransactions((prev) => [newTx, ...prev]);
    setIsModalOpen(false);
    triggerHaptic("medium");

    // Persist to backend API
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newTx.type,
          memberName: newTx.memberName,
          category: newTx.category,
          amountPaisa: Math.abs(newTx.amountPaisa),
          description: newTx.description,
          createdBy: newTx.createdBy,
        }),
      });
    } catch (err) {
      console.error("Failed to persist transaction to API:", err);
    }
  }

  // ── Expense breakdown ──────────────────────────────────────────────────────

  const expenseCategories: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "EXPENSE" && t.status !== "reversed")
    .forEach((t) => {
      const cat = t.category || "OTHER";
      expenseCategories[cat] = (expenseCategories[cat] ?? 0) + Math.abs(t.amountPaisa);
    });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">
        {/* ── Telegram Mini App banner ── */}
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

        {/* ── Hero banner ── */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/70 p-8 text-white shadow-xl ring-1 ring-white/10">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-widest text-[11px] py-1 font-semibold bg-emerald-950/60 text-emerald-300 border-emerald-700/40">
                  FVMAS-16 · Room 302 Fund
                </Badge>
                <span className="text-xs text-emerald-300/80 font-mono">
                  Cloudflare D1 · Telegram Bot Active
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Room Fund Dashboard
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Centralized ledger for your room. Record contributions and expenses through
                Telegram or here. Balance is calculated from every transaction.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="btn-add-contribution"
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                onClick={() => openModal("contribution")}
              >
                <Plus className="h-4 w-4" />
                <span>Add Contribution</span>
              </Button>
              <Button
                id="btn-add-expense"
                variant="outline"
                className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 hover:text-red-300 gap-2"
                onClick={() => openModal("expense")}
              >
                <Minus className="h-4 w-4" />
                <span>Record Expense</span>
              </Button>
              <Button
                id="btn-export"
                variant="outline"
                className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 hover:text-emerald-300 gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Current Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold tabular-nums ${currentBalancePaisa >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatTaka(currentBalancePaisa)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Contributions
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-white">
                  {formatTaka(totalContributionsPaisa + totalRefundsPaisa)}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  Inflows
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Expenses
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-red-300">
                  {formatTaka(Math.abs(totalExpensesPaisa))}
                </span>
                <span className="text-xs font-semibold text-red-400 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  Outflows
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Active Members
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-white">
                  {members.filter((m) => m.status === "active").length}
                </span>
                <span className="text-xs text-slate-400">of {members.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Telegram reminder ── */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            You can also record transactions directly in Telegram. Try{" "}
            <code className="font-mono font-bold">/add Murad 200</code> or{" "}
            <code className="font-mono font-bold">/expense 90 grocery</code> in your group chat.
          </span>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Button
            id="tab-overview"
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("overview");
            }}
            className="gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span>Overview</span>
          </Button>

          <Button
            id="tab-transactions"
            variant={activeTab === "transactions" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("transactions");
            }}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            <span>Transactions</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
              {transactions.length}
            </Badge>
          </Button>

          <Button
            id="tab-members"
            variant={activeTab === "members" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("members");
            }}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Members</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
              {members.length}
            </Badge>
          </Button>
        </div>

        {/* ── Overview tab ── */}
        {activeTab === "overview" && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ledger summary */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <CardTitle>Ledger Summary</CardTitle>
                </div>
                <CardDescription>
                  Balance is computed from every transaction. The opening balance was{" "}
                  {formatTaka(OPENING_BALANCE_PAISA)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm text-emerald-300 space-y-2">
                  <p className="text-slate-400 text-xs"># Ledger Calculation</p>
                  <p>Opening Balance         {formatTaka(OPENING_BALANCE_PAISA)}</p>
                  <p>Total Contributions   + {formatTaka(totalContributionsPaisa)}</p>
                  {totalRefundsPaisa > 0 && (
                    <p>Refunds              + {formatTaka(totalRefundsPaisa)}</p>
                  )}
                  <p>Total Expenses        - {formatTaka(Math.abs(totalExpensesPaisa))}</p>
                  <p className="border-t border-slate-700 pt-2 text-white font-semibold">
                    Current Balance        = {formatTaka(currentBalancePaisa)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-muted-foreground">Data Source</p>
                    <p className="mt-1 font-semibold text-sm text-emerald-600">
                      Cloudflare D1 (authoritative)
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-muted-foreground">Primary Interface</p>
                    <p className="mt-1 font-semibold text-sm text-blue-600 dark:text-blue-400">
                      Telegram Bot
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-slate-500" />
                  <CardTitle>Expense Breakdown</CardTitle>
                </div>
                <CardDescription>By category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {Object.entries(expenseCategories).length === 0 && (
                  <p className="text-xs text-muted-foreground">No expenses recorded yet.</p>
                )}
                {Object.entries(expenseCategories).map(([cat, amtPaisa]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span className="text-muted-foreground capitalize">{cat.toLowerCase()}</span>
                    <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                      {formatTaka(amtPaisa)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Member contributions */}
            <Card className="col-span-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-500" />
                  <CardTitle>Member Contributions</CardTitle>
                </div>
                <CardDescription>Total contributed per member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...members]
                    .sort((a, b) => b.totalContributedPaisa - a.totalContributedPaisa)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                            {m.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            <RoleBadge role={m.role} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatTaka(m.totalContributedPaisa)}
                          </p>
                          {m.status === "suspended" && (
                            <p className="text-[10px] text-red-500">Suspended</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── Transactions tab ── */}
        {activeTab === "transactions" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Transaction Ledger</h2>
                <p className="text-xs text-muted-foreground">
                  Immutable financial record. Corrections use reversals, not deletions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  id="btn-export-csv"
                  href="/api/export"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  Export CSV
                </a>
                <Button id="btn-filter" variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
                <Button
                  id="btn-add-tx"
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  onClick={() => openModal("contribution")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Source
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors last:border-0"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {tx.date}
                      </td>
                      <td className="px-4 py-3">
                        <TxTypeBadge type={tx.type} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {tx.memberName ? tx.memberName : tx.description}
                        </p>
                        {tx.memberName && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {tx.source === "TELEGRAM" ? (
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Activity className="h-3 w-3 text-slate-400" />
                          )}
                          {tx.source === "TELEGRAM" ? "Telegram" : "Web"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        <span
                          className={
                            tx.amountPaisa >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {tx.amountPaisa >= 0 ? "+" : ""}
                          {formatTaka(tx.amountPaisa)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex justify-center">
                          <StatusDot status={tx.status} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Members tab ── */}
        {activeTab === "members" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Members</h2>
                <p className="text-xs text-muted-foreground">
                  Roles determine what each member can do in Telegram and the dashboard.
                </p>
              </div>
              <Button
                id="btn-add-member"
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => (
                <Card key={m.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200">
                          {m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <RoleBadge role={m.role} />
                        </div>
                      </div>
                      {m.status === "suspended" && (
                        <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                          Suspended
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total contributed</p>
                        <p className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatTaka(m.totalContributedPaisa)}
                        </p>
                      </div>
                      <Button
                        id={`btn-member-actions-${m.id}`}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Actions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Permission matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permission Matrix</CardTitle>
                <CardDescription>What each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Action</th>
                        <th className="text-center py-2 px-3 font-medium">Owner</th>
                        <th className="text-center py-2 px-3 font-medium">Treasurer</th>
                        <th className="text-center py-2 px-3 font-medium">Member</th>
                        <th className="text-center py-2 px-3 font-medium">Viewer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {[
                        { action: "View balance", owner: true, treasurer: true, member: true, viewer: true },
                        { action: "View transactions", owner: true, treasurer: true, member: true, viewer: true },
                        { action: "Add contribution", owner: true, treasurer: true, member: false, viewer: false },
                        { action: "Add expense", owner: true, treasurer: true, member: false, viewer: false },
                        { action: "Reverse transaction", owner: true, treasurer: true, member: false, viewer: false },
                        { action: "Add member", owner: true, treasurer: true, member: false, viewer: false },
                        { action: "Assign Treasurer", owner: true, treasurer: false, member: false, viewer: false },
                        { action: "View audit log", owner: true, treasurer: true, member: false, viewer: false },
                        { action: "Export records", owner: true, treasurer: true, member: false, viewer: false },
                      ].map((row) => (
                        <tr key={row.action}>
                          <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{row.action}</td>
                          {(["owner", "treasurer", "member", "viewer"] as const).map((role) => (
                            <td key={role} className="text-center py-2 px-3">
                              {row[role] ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {modalMode === "contribution" ? "Record Contribution" : "Record Expense"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {modalMode === "contribution"
                      ? "Credit the fund. Specify the member and the amount in taka."
                      : "Debit the fund. Specify the category and the amount in taka."}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {modalMode === "contribution" && (
                  <div>
                    <label
                      htmlFor="modal-member"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Member
                    </label>
                    <select
                      id="modal-member"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={formMember}
                      onChange={(e) => setFormMember(e.target.value)}
                    >
                      {members
                        .filter((m) => m.status === "active")
                        .map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {modalMode === "expense" && (
                  <div>
                    <label
                      htmlFor="modal-category"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="modal-category"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="GROCERY">Grocery</option>
                      <option value="ELECTRICITY">Electricity</option>
                      <option value="CLEANING">Cleaning</option>
                      <option value="INTERNET">Internet</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="modal-amount"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Amount (৳ Taka)
                  </label>
                  <input
                    id="modal-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 300"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    value={formAmountTaka}
                    onChange={(e) => setFormAmountTaka(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal-description"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Description{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="modal-description"
                    type="text"
                    placeholder={
                      modalMode === "contribution"
                        ? "e.g. Monthly contribution for October"
                        : "e.g. Vegetables and rice"
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    id="btn-modal-confirm"
                    type="submit"
                    className={
                      modalMode === "contribution"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }
                  >
                    {modalMode === "contribution" ? "Record Contribution" : "Record Expense"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
