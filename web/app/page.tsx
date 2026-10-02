"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Plus,
  Search,
  Receipt,
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  X,
  Copy,
  Check,
  Filter,
  Layers,
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
import { Button } from "@/components/ui/button";

// ─── Financial Types ─────────────────────────────────────────────────────────

export type TransactionType = "CONTRIBUTION" | "EXPENSE" | "REFUND" | "CORRECTION" | "REVERSAL";
export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "CARD" | "OTHER";

export interface Member {
  id: string;
  name: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  totalContributedPaisa: number;
  targetQuotaPaisa: number;
  status: "active" | "suspended";
  dueStatus?: "paid" | "partial" | "overdue" | "exempt";
  telegramUsername?: string;
  phone?: string;
}

export interface Transaction {
  id: string;
  voucherNo?: string;
  type: TransactionType;
  memberName?: string;
  payeeName?: string;
  description: string;
  category?: string;
  amountPaisa: number;
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  receiptUrl?: string;
  source: "TELEGRAM" | "WEB" | "API";
  date: string;
  createdBy: string;
  status: "completed" | "pending" | "reversed";
}

export interface FundInfo {
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
  monthlyQuotaPaisa?: number;
}

// ─── Currency Helpers ───────────────────────────────────────────────────────

function paisa(taka: number): number {
  return Math.round(taka * 100);
}

function formatTaka(amountPaisa: number): string {
  const taka = new Decimal(amountPaisa).div(100);
  const abs = taka.abs();
  const formatted = abs
    .toNumber()
    .toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `৳${formatted}`;
}

// ─── Seed Data ──────────────────────────────────────────────────────────────

const initialFund: FundInfo = {
  id: "fund-room-302",
  name: "Room 302 General Fund",
  fundType: "ROOM",
  currency: "BDT",
  openingBalancePaisa: paisa(1000),
  totalBalancePaisa: paisa(3670),
  totalContributionsPaisa: paisa(6300),
  totalExpensesPaisa: paisa(3630),
  memberCount: 5,
  targetBudgetPaisa: paisa(10000),
  monthlyQuotaPaisa: paisa(2000),
  description: "Shared living, meals, and utility expenses for Room 302 members",
  announcement: "Monthly dues of ৳2,000 are due on the 5th of every month",
};

const initialMembers: Member[] = [
  { id: "mem-1", name: "Adnan Shahria", role: "TREASURER", totalContributedPaisa: paisa(2000), targetQuotaPaisa: paisa(2000), status: "active", dueStatus: "paid", telegramUsername: "adnan_dev" },
  { id: "mem-2", name: "Murad Hasan", role: "MEMBER", totalContributedPaisa: paisa(1500), targetQuotaPaisa: paisa(2000), status: "active", dueStatus: "partial", telegramUsername: "murad_h" },
  { id: "mem-3", name: "Rahim Uddin", role: "MEMBER", totalContributedPaisa: paisa(2000), targetQuotaPaisa: paisa(2000), status: "active", dueStatus: "paid", telegramUsername: "rahim_u" },
  { id: "mem-4", name: "Karim Sheikh", role: "MEMBER", totalContributedPaisa: paisa(1000), targetQuotaPaisa: paisa(2000), status: "active", dueStatus: "partial", telegramUsername: "karim_s" },
  { id: "mem-5", name: "Farhan Ali", role: "MEMBER", totalContributedPaisa: paisa(0), targetQuotaPaisa: paisa(2000), status: "suspended", dueStatus: "overdue", telegramUsername: "farhan_a" },
];

const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    voucherNo: "VCH-2026-005",
    type: "CONTRIBUTION",
    memberName: "Adnan Shahria",
    description: "October room dues deposit",
    category: "DUES",
    amountPaisa: paisa(2000),
    paymentMethod: "BKASH",
    referenceId: "BK-892JK41",
    receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    source: "TELEGRAM",
    date: "2026-10-02",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-2",
    voucherNo: "VCH-2026-004",
    type: "EXPENSE",
    payeeName: "Shwapno Super Shop",
    description: "Monthly cooking essentials (Rice, Mustard Oil, Spices, Lentils)",
    category: "GROCERY",
    amountPaisa: -paisa(1250),
    paymentMethod: "CARD",
    referenceId: "POS-SHW-9912",
    receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    source: "WEB",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-3",
    voucherNo: "VCH-2026-003",
    type: "CONTRIBUTION",
    memberName: "Murad Hasan",
    description: "October partial room dues",
    category: "DUES",
    amountPaisa: paisa(1500),
    paymentMethod: "NAGAD",
    referenceId: "NG-7731BA",
    source: "TELEGRAM",
    date: "2026-10-01",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-4",
    voucherNo: "VCH-2026-002",
    type: "EXPENSE",
    payeeName: "DESCO Electricity Board",
    description: "September electricity utility bill share",
    category: "ELECTRICITY",
    amountPaisa: -paisa(800),
    paymentMethod: "BKASH",
    referenceId: "BK-BILL-5510",
    receiptUrl: "https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=600&auto=format&fit=crop&q=80",
    source: "WEB",
    date: "2026-09-28",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-5",
    voucherNo: "VCH-2026-001",
    type: "EXPENSE",
    payeeName: "Karwan Market General Store",
    description: "Floor disinfectant, broom, and heavy duty trash bags",
    category: "CLEANING",
    amountPaisa: -paisa(350),
    paymentMethod: "CASH",
    referenceId: "CSH-MEMO-12",
    source: "TELEGRAM",
    date: "2026-09-25",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
  {
    id: "tx-6",
    voucherNo: "VCH-2026-000",
    type: "CONTRIBUTION",
    memberName: "Rahim Uddin",
    description: "October room dues deposit",
    category: "DUES",
    amountPaisa: paisa(2000),
    paymentMethod: "BKASH",
    referenceId: "BK-44109Z",
    source: "TELEGRAM",
    date: "2026-09-24",
    createdBy: "Adnan Shahria",
    status: "completed",
  },
];

// ─── Badges and Indicators ──────────────────────────────────────────────────

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
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      icon: <ArrowUpRight className="h-3 w-3" />,
    },
    EXPENSE: {
      label: "Expense",
      className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
      icon: <ArrowDownRight className="h-3 w-3" />,
    },
    REFUND: {
      label: "Refund",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      icon: <RotateCcw className="h-3 w-3" />,
    },
    CORRECTION: {
      label: "Correction",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      icon: <Activity className="h-3 w-3" />,
    },
    REVERSAL: {
      label: "Reversal",
      className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
      icon: <RotateCcw className="h-3 w-3" />,
    },
  };
  const { label, className, icon } = map[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>
      {icon}
      {label}
    </span>
  );
}

function PaymentMethodBadge({ method }: { method?: PaymentMethod }) {
  if (!method) return null;
  const map: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
    CASH: { label: "Cash", icon: <Wallet className="h-3 w-3" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" },
    BKASH: { label: "bKash", icon: <Smartphone className="h-3 w-3" />, color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300" },
    NAGAD: { label: "Nagad", icon: <Smartphone className="h-3 w-3" />, color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300" },
    ROCKET: { label: "Rocket", icon: <Smartphone className="h-3 w-3" />, color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300" },
    BANK_TRANSFER: { label: "Bank", icon: <Building2 className="h-3 w-3" />, color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300" },
    CARD: { label: "Card", icon: <CreditCard className="h-3 w-3" />, color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300" },
    OTHER: { label: "Other", icon: <Wallet className="h-3 w-3" />, color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300" },
  };
  const item = map[method] || map.OTHER;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${item.color}`}>
      {item.icon}
      {item.label}
    </span>
  );
}

// ─── Main Web Dashboard ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user: tgUser, isInsideTelegram } = useTelegramWebApp();

  const [fund, setFund] = useState<FundInfo>(initialFund);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // View state
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "members">("overview");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<"CONTRIBUTION" | "EXPENSE">("CONTRIBUTION");
  const [formAmountTaka, setFormAmountTaka] = useState<string>("");
  const [formMemberName, setFormMemberName] = useState<string>("Adnan Shahria");
  const [formPayeeName, setFormPayeeName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("DUES");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>("BKASH");
  const [formReferenceId, setFormReferenceId] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formReceiptUrl, setFormReceiptUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync data from server
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
              targetQuotaPaisa?: number;
              status: Member["status"];
              dueStatus?: Member["dueStatus"];
              telegramUsername?: string;
              phone?: string;
            }>;
          };
          if (membersData.ok && Array.isArray(membersData.members)) {
            setMembers(
              membersData.members.map((m) => {
                const target = m.targetQuotaPaisa ?? paisa(2000);
                const contrib = m.contributedPaisa;
                let calculatedStatus: Member["dueStatus"] = "overdue";
                if (contrib >= target) calculatedStatus = "paid";
                else if (contrib > 0) calculatedStatus = "partial";

                return {
                  id: m.id,
                  name: m.displayName,
                  role: m.role,
                  totalContributedPaisa: contrib,
                  targetQuotaPaisa: target,
                  status: m.status,
                  dueStatus: m.dueStatus ?? calculatedStatus,
                  telegramUsername: m.telegramUsername,
                  phone: m.phone,
                };
              })
            );
          }
        }

        if (txRes.ok) {
          const txData = (await txRes.json()) as { ok?: boolean; transactions?: Transaction[] };
          if (txData.ok && Array.isArray(txData.transactions) && txData.transactions.length > 0) {
            setTransactions(txData.transactions);
          }
        }
      } catch (err) {
        console.warn("Could not fetch server API data, running in offline ledger mode:", err);
      }
    }
    loadData();
  }, []);

  // Compute live ledger metrics
  const totalContributionsPaisa = useMemo(() => {
    return transactions
      .filter((t) => t.type === "CONTRIBUTION" && t.status !== "reversed")
      .reduce((acc, t) => acc + Math.abs(t.amountPaisa), 0);
  }, [transactions]);

  const totalExpensesPaisa = useMemo(() => {
    return transactions
      .filter((t) => (t.type === "EXPENSE" || t.type === "REVERSAL") && t.status !== "reversed")
      .reduce((acc, t) => acc + Math.abs(t.amountPaisa), 0);
  }, [transactions]);

  const currentBalancePaisa = useMemo(() => {
    return fund.openingBalancePaisa + totalContributionsPaisa - totalExpensesPaisa;
  }, [fund.openingBalancePaisa, totalContributionsPaisa, totalExpensesPaisa]);

  // Cash in hand versus digital wallet breakdown
  const cashInHandPaisa = useMemo(() => {
    return transactions
      .filter((t) => t.paymentMethod === "CASH" && t.status !== "reversed")
      .reduce((acc, t) => acc + t.amountPaisa, 0);
  }, [transactions]);

  const digitalWalletPaisa = useMemo(() => {
    return transactions
      .filter((t) => t.paymentMethod !== "CASH" && t.status !== "reversed")
      .reduce((acc, t) => acc + t.amountPaisa, 0);
  }, [transactions]);

  // Category breakdown calculation
  const expenseCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "EXPENSE" && t.status !== "reversed")
      .forEach((t) => {
        const cat = t.category || "OTHER";
        cats[cat] = (cats[cat] ?? 0) + Math.abs(t.amountPaisa);
      });
    return cats;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (txTypeFilter !== "ALL" && t.type !== txTypeFilter) return false;
      if (paymentMethodFilter !== "ALL" && t.paymentMethod !== paymentMethodFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const party = (t.memberName || t.payeeName || "").toLowerCase();
        const desc = t.description.toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const voucher = (t.voucherNo || "").toLowerCase();
        const ref = (t.referenceId || "").toLowerCase();
        return (
          party.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          voucher.includes(query) ||
          ref.includes(query)
        );
      }
      return true;
    });
  }, [transactions, txTypeFilter, paymentMethodFilter, searchQuery]);

  // Member dues completion progress
  const targetMonthlyDuesPaisa = members.length * (fund.monthlyQuotaPaisa ?? paisa(2000));
  const duesProgressPercent = targetMonthlyDuesPaisa > 0
    ? Math.min(100, Math.round((totalContributionsPaisa / targetMonthlyDuesPaisa) * 100))
    : 0;

  // Handle transaction creation
  async function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = parseFloat(formAmountTaka);
    if (isNaN(amountVal) || amountVal <= 0) return;

    setIsSubmitting(true);
    const amountPaisaVal = paisa(amountVal);
    const dateStr = new Date().toISOString().split("T")[0] ?? "2026-10-02";
    const voucherSeq = `VCH-2026-${String(transactions.length + 1).padStart(3, "0")}`;

    const newTx: Transaction = {
      id: `tx-${Date.now().toString(36)}`,
      voucherNo: voucherSeq,
      type: formType,
      memberName: formType === "CONTRIBUTION" ? formMemberName : undefined,
      payeeName: formType === "EXPENSE" ? (formPayeeName || "Vendor") : undefined,
      category: formCategory,
      description: formDescription.trim() || (formType === "CONTRIBUTION" ? "Member Contribution" : "Fund Expense"),
      amountPaisa: formType === "CONTRIBUTION" ? amountPaisaVal : -amountPaisaVal,
      paymentMethod: formPaymentMethod,
      referenceId: formReferenceId.trim() || undefined,
      receiptUrl: formReceiptUrl.trim() || undefined,
      source: "WEB",
      date: dateStr,
      createdBy: "Adnan Shahria (Treasurer)",
      status: "completed",
    };

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);

    if (formType === "CONTRIBUTION") {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.name.toLowerCase() === formMemberName.toLowerCase()) {
            const updatedTotal = m.totalContributedPaisa + amountPaisaVal;
            const updatedStatus = updatedTotal >= m.targetQuotaPaisa ? "paid" : "partial";
            return {
              ...m,
              totalContributedPaisa: updatedTotal,
              dueStatus: updatedStatus,
            };
          }
          return m;
        })
      );
    }

    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          memberName: newTx.memberName,
          payeeName: newTx.payeeName,
          category: newTx.category,
          amountTaka: amountVal,
          paymentMethod: newTx.paymentMethod,
          referenceId: newTx.referenceId,
          receiptUrl: newTx.receiptUrl,
          description: newTx.description,
          createdBy: "Treasurer",
        }),
      });
    } catch (err) {
      console.warn("Could not sync to remote API, local ledger updated:", err);
    }

    setIsSubmitting(false);
    setIsRecordModalOpen(false);
    setFormAmountTaka("");
    setFormDescription("");
    setFormReferenceId("");
    setFormReceiptUrl("");
    setFormPayeeName("");
  }

  // Copy Telegram reminder text
  function handleCopyReminder(member: Member) {
    const remainingPaisa = Math.max(0, member.targetQuotaPaisa - member.totalContributedPaisa);
    const text = `Assalamu Alaikum ${member.name}, this is a gentle reminder from Room 302 Fund. Your monthly room contribution for this cycle has a pending balance of ${formatTaka(remainingPaisa)}. Please send via bKash or Nagad to the treasurer when convenient. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedMemberId(member.id);
    setTimeout(() => setCopiedMemberId(null), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">

        {/* Telegram Mini App indicator */}
        {isInsideTelegram && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-medium">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>
                Telegram Mini App active (Connected as {tgUser?.first_name}{tgUser?.username ? ` @${tgUser.username}` : ""})
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-sky-500/20 px-2 py-0.5 rounded text-sky-400">
              Synced
            </span>
          </div>
        )}

        {/* Transparency Banner */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 dark:bg-slate-900/60 dark:border-slate-800 p-4 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Audited Public Ledger (Complete Transparency)
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every member has real time visibility into receipts, vouchers, and member dues.
                Record deposits or expenses through this dashboard or directly in your Telegram group chat using commands like <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/add Murad 2000</code> or <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/expense 450 grocery</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Record Entry
            </Button>
          </div>
        </div>

        {/* Hero Financial Summary Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-2xl ring-1 ring-white/10">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-widest text-[11px] py-1 font-bold bg-emerald-950/80 text-emerald-300 border-emerald-700/60">
                  {fund.fundType === "BATCH" ? "Batch Central Fund" : "Room Collective Fund"}
                </Badge>
                <span className="text-xs text-emerald-300/80 font-mono">
                  Cloudflare D1 Ledger · Exact Paisa Math
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {fund.name}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {fund.description}
              </p>
              {fund.announcement && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Cycle Notice: {fund.announcement}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/api/export"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-semibold hover:bg-slate-700 transition shadow"
              >
                <Download className="h-4 w-4" />
                Export CSV Ledger
              </a>
              <Button
                onClick={() => setIsRecordModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                Record Transaction
              </Button>
            </div>
          </div>

          {/* Metric Snapshot Cards */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available Fund Balance
              </p>
              <p className={`text-3xl font-extrabold tabular-nums tracking-tight ${currentBalancePaisa >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatTaka(currentBalancePaisa)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Cash Box: {formatTaka(cashInHandPaisa)} · Digital: {formatTaka(digitalWalletPaisa)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Inflows (Dues)
              </p>
              <p className="text-2xl font-bold tabular-nums text-emerald-300">
                {formatTaka(totalContributionsPaisa)}
              </p>
              <p className="text-[11px] text-slate-400">
                Verified member deposits
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Outflows (Spent)
              </p>
              <p className="text-2xl font-bold tabular-nums text-rose-400">
                {formatTaka(totalExpensesPaisa)}
              </p>
              <p className="text-[11px] text-slate-400">
                Groceries, bills, and items
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Member Quotas
              </p>
              <p className="text-2xl font-bold tabular-nums text-slate-100">
                {duesProgressPercent}% Collected
              </p>
              <p className="text-[11px] text-slate-400">
                {members.filter((m) => m.dueStatus === "paid").length} of {members.length} members paid
              </p>
            </div>
          </div>

          {/* Dues Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                Monthly Target Budget: {formatTaka(fund.targetBudgetPaisa)}
              </span>
              <span className="font-mono text-emerald-300">
                {duesProgressPercent}% of dues collected
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden ring-1 ring-white/5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, duesProgressPercent))}%` }}
              />
            </div>
          </div>
        </section>

        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "overview"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Overview and Analytics
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "transactions"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Master Ledger ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "members"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Member Accounts ({members.length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search party, voucher, TrxID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        </div>

        {/* ─── Tab 1: Overview and Analytics ─────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Spending Breakdown by Category */}
              <Card className="lg:col-span-1 shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Category Expenditures
                    </CardTitle>
                    <Layers className="h-4 w-4 text-slate-400" />
                  </div>
                  <CardDescription className="text-xs">
                    Verified breakdown across expenditure categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(expenseCategories).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      No expenditures recorded yet.
                    </p>
                  ) : (
                    Object.entries(expenseCategories).map(([cat, paisaVal]) => {
                      const totalExp = totalExpensesPaisa || 1;
                      const percent = Math.round((paisaVal / totalExp) * 100);
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {cat}
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {formatTaka(paisaVal)} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Latest Verified Activity */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Recent Ledger Transactions
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chronological ledger events recorded via Telegram or Web
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View All Master Entries →
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <TxTypeBadge type={tx.type} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {tx.description}
                              </p>
                              {tx.receiptUrl && (
                                <button
                                  onClick={() => setSelectedReceipt(tx)}
                                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 text-[10px] font-medium flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded"
                                >
                                  <Receipt className="h-3 w-3" />
                                  Receipt
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono text-slate-600 dark:text-slate-400">
                                {tx.voucherNo || tx.id}
                              </span>
                              <span>·</span>
                              <span>{tx.memberName || tx.payeeName || "General"}</span>
                              <span>·</span>
                              <PaymentMethodBadge method={tx.paymentMethod} />
                              {tx.referenceId && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  Trx: {tx.referenceId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            tx.amountPaisa > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
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

            {/* Member Dues Progress Snapshot */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Member Contribution and Dues Summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Individual standing toward the current monthly quota of {formatTaka(fund.monthlyQuotaPaisa ?? paisa(2000))}
                  </CardDescription>
                </div>
                <button
                  onClick={() => setActiveTab("members")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Manage Roster →
                </button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((m) => {
                    const quota = m.targetQuotaPaisa || paisa(2000);
                    const percent = Math.min(100, Math.round((m.totalContributedPaisa / quota) * 100));
                    const remainingPaisa = Math.max(0, quota - m.totalContributedPaisa);

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {m.name}
                            </p>
                            {m.telegramUsername ? (
                              <p className="text-xs text-sky-500 font-mono">
                                @{m.telegramUsername}
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {m.id}
                              </p>
                            )}
                          </div>
                          <RoleBadge role={m.role} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Contributed</span>
                            <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100 font-mono">
                              {formatTaka(m.totalContributedPaisa)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                percent >= 100 ? "bg-emerald-500" : percent > 0 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.dueStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : m.dueStatus === "partial"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            }`}
                          >
                            {m.dueStatus === "paid" && <CheckCircle2 className="h-3 w-3" />}
                            {m.dueStatus === "partial" && <Clock className="h-3 w-3" />}
                            {m.dueStatus === "overdue" && <AlertCircle className="h-3 w-3" />}
                            {m.dueStatus === "paid" ? "Fully Paid" : m.dueStatus === "partial" ? `Due ${formatTaka(remainingPaisa)}` : "Dues Overdue"}
                          </span>

                          {remainingPaisa > 0 && (
                            <button
                              onClick={() => handleCopyReminder(m)}
                              className="text-[11px] text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium flex items-center gap-1"
                            >
                              {copiedMemberId === m.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Remind</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Tab 2: Master Financial Ledger Table ────────────────────────── */}
        {activeTab === "transactions" && (
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Authoritative Financial Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Every mutation carries a voucher number, payment method, reference ID, and audit proof
                </CardDescription>
              </div>

              {/* Multi dimensional filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                  {["ALL", "CONTRIBUTION", "EXPENSE"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTxTypeFilter(filter)}
                      className={`px-2.5 py-1 font-semibold rounded-lg transition ${
                        txTypeFilter === filter
                          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      {filter === "ALL" ? "All Types" : filter === "CONTRIBUTION" ? "Inflows" : "Outflows"}
                    </button>
                  ))}
                </div>

                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 font-medium"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Voucher / Date</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Party / Beneficiary</th>
                      <th className="px-6 py-3.5">Category & Purpose</th>
                      <th className="px-6 py-3.5">Payment Rail & TrxID</th>
                      <th className="px-6 py-3.5 text-center">Receipt</th>
                      <th className="px-6 py-3.5 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-xs text-muted-foreground">
                          No transactions found matching your active search or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition ${
                            tx.status === "reversed" ? "opacity-50 line-through" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              {tx.voucherNo || tx.id}
                            </span>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {tx.date}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <TxTypeBadge type={tx.type} />
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                            {tx.memberName || tx.payeeName || "General Fund"}
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {tx.description}
                            </span>
                            {tx.category && (
                              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-0.5">
                                {tx.category}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <PaymentMethodBadge method={tx.paymentMethod} />
                              {tx.referenceId && (
                                <span className="font-mono text-[11px] text-slate-500">
                                  {tx.referenceId}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            {tx.receiptUrl ? (
                              <button
                                onClick={() => setSelectedReceipt(tx)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">None</span>
                            )}
                          </td>

                          <td
                            className={`px-6 py-4 text-right font-mono font-extrabold text-sm tabular-nums ${
                              tx.amountPaisa > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                            }`}
                          >
                            {tx.amountPaisa > 0 ? "+" : ""}
                            {formatTaka(tx.amountPaisa)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Tab 3: Member Directory & Accountability ───────────────────── */}
        {activeTab === "members" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Member Accounts and Dues Roster
                </h2>
                <p className="text-xs text-muted-foreground">
                  Individual quotas, participation status, and one click Telegram reminder generator
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  Cycle Quota: {formatTaka(fund.monthlyQuotaPaisa ?? paisa(2000))} / member
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map((m) => {
                const quota = m.targetQuotaPaisa || paisa(2000);
                const percent = Math.min(100, Math.round((m.totalContributedPaisa / quota) * 100));
                const remainingPaisa = Math.max(0, quota - m.totalContributedPaisa);

                return (
                  <Card key={m.id} className="shadow-sm border-slate-200/80 dark:border-slate-800">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-base">
                            {m.name}
                          </p>
                          {m.telegramUsername ? (
                            <p className="text-xs text-sky-500 font-mono">
                              @{m.telegramUsername}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 font-mono">
                              ID: {m.id}
                            </p>
                          )}
                        </div>
                        <RoleBadge role={m.role} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Current Cycle Contributed</span>
                          <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100 font-mono">
                            {formatTaka(m.totalContributedPaisa)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              percent >= 100 ? "bg-emerald-500" : percent > 0 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Standing Status
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold ${
                              m.dueStatus === "paid"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : m.dueStatus === "partial"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {m.dueStatus === "paid" ? "Fully Paid (Clear)" : m.dueStatus === "partial" ? `Due: ${formatTaka(remainingPaisa)}` : "Pending Full Payment"}
                          </span>
                        </div>

                        {remainingPaisa > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyReminder(m)}
                            className="text-xs h-8 flex items-center gap-1"
                          >
                            {copiedMemberId === m.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Reminder</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* ─── Modal 1: Comprehensive Record Transaction Modal ─────────────── */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Record Financial Transaction
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Authoritative entry with voucher sequence and payment rail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="mt-5 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("CONTRIBUTION");
                    setFormCategory("DUES");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    formType === "CONTRIBUTION"
                      ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  + Member Inflow (Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("EXPENSE");
                    setFormCategory("GROCERY");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    formType === "EXPENSE"
                      ? "bg-white text-rose-700 shadow-xs dark:bg-slate-700 dark:text-rose-300"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  - Fund Outflow (Expense)
                </button>
              </div>

              {/* Amount in Taka */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount in BDT (৳ Taka)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 2000"
                  required
                  value={formAmountTaka}
                  onChange={(e) => setFormAmountTaka(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Member or Payee */}
              {formType === "CONTRIBUTION" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contributing Member
                  </label>
                  <select
                    value={formMemberName}
                    onChange={(e) => setFormMemberName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payee or Merchant Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shwapno Super Shop, DESCO, Landlord"
                    value={formPayeeName}
                    onChange={(e) => setFormPayeeName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              )}

              {/* Category & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    {formType === "CONTRIBUTION" ? (
                      <>
                        <option value="DUES">Monthly Dues</option>
                        <option value="EXTRA">Emergency Contribution</option>
                        <option value="FEAST">Room Feast Share</option>
                        <option value="TOUR">Tour Fund Deposit</option>
                      </>
                    ) : (
                      <>
                        <option value="GROCERY">Food and Bazaar</option>
                        <option value="ELECTRICITY">Electricity Bill</option>
                        <option value="WIFI">Wi-Fi Internet</option>
                        <option value="CLEANING">Cleaning Supplies</option>
                        <option value="RENT">Room Rent / Cook</option>
                        <option value="MAINTENANCE">Room Maintenance</option>
                        <option value="MEDICAL">Medical Emergency</option>
                        <option value="OTHER">Miscellaneous</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Rail
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="CASH">Cash (Cash Box)</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Reference ID / TrxID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  MFS TrxID or Cash Memo Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK-892JK41 or Cash Memo 42"
                  value={formReferenceId}
                  onChange={(e) => setFormReferenceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly bazaar items (Onion, Potato, Cooking Oil)"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              {/* Receipt Image Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.example.com/receipt-memo.jpg"
                  value={formReceiptUrl}
                  onChange={(e) => setFormReceiptUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Recording..." : "Record to Ledger"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Receipt Preview Modal ──────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Transaction Voucher and Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Receipt image */}
              {selectedReceipt.receiptUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 max-h-72 flex items-center justify-center">
                  <img
                    src={selectedReceipt.receiptUrl}
                    alt="Transaction receipt or voucher"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-muted-foreground">
                  No image attached to this voucher.
                </div>
              )}

              {/* Voucher details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voucher Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selectedReceipt.voucherNo || selectedReceipt.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Party:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedReceipt.memberName || selectedReceipt.payeeName || "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedReceipt.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <PaymentMethodBadge method={selectedReceipt.paymentMethod} />
                </div>
                {selectedReceipt.referenceId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference / TrxID:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedReceipt.referenceId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Total Amount:</span>
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      selectedReceipt.amountPaisa > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {formatTaka(selectedReceipt.amountPaisa)}
                  </span>
                </div>
              </div>

              {selectedReceipt.receiptUrl && (
                <a
                  href={selectedReceipt.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Full Resolution Receipt
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
