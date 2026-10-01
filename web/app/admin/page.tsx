"use client";

import React, { useState, useEffect } from "react";
import Decimal from "decimal.js";
import {
  ShieldAlert,
  KeyRound,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  UserPlus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Radio,
  Home,
  GraduationCap,
  Users,
  LogOut,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FundData {
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

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  role: "OWNER" | "TREASURER" | "MEMBER" | "VIEWER";
  status: "active" | "suspended";
  contributedPaisa: number;
  phone?: string;
  telegramUsername?: string;
}

interface TransactionData {
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

function formatTaka(amountPaisa: number): string {
  const taka = new Decimal(amountPaisa).div(100);
  const abs = taka.abs();
  const formatted = abs
    .toNumber()
    .toLocaleString("en-BD", { minimumFractionDigits: 2 });
  return `৳${formatted}`;
}

export default function AdminPage() {
  const [passkey, setPasskey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fund state
  const [fund, setFund] = useState<FundData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  // Active section
  const [activeSection, setActiveSection] = useState<"fund" | "transactions" | "members" | "bot">("fund");

  // Form states
  const [fundName, setFundName] = useState<string>("");
  const [fundType, setFundType] = useState<"ROOM" | "BATCH">("ROOM");
  const [targetBudgetTaka, setTargetBudgetTaka] = useState<string>("");
  const [fundDescription, setFundDescription] = useState<string>("");
  const [fundAnnouncement, setFundAnnouncement] = useState<string>("");

  // Record Contribution Modal
  const [isContributionModalOpen, setIsContributionModalOpen] = useState<boolean>(false);
  const [contribMemberName, setContribMemberName] = useState<string>("");
  const [contribAmountTaka, setContribAmountTaka] = useState<string>("");
  const [contribDesc, setContribDesc] = useState<string>("");

  // Record Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>("GROCERY");
  const [expenseAmountTaka, setExpenseAmountTaka] = useState<string>("");
  const [expenseDesc, setExpenseDesc] = useState<string>("");

  // Add Member Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<"MEMBER" | "TREASURER" | "VIEWER" | "OWNER">("MEMBER");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberTelegram, setNewMemberTelegram] = useState<string>("");

  // Check stored auth on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("fund_admin_key");
    const queryParams = new URLSearchParams(window.location.search);
    const urlKey = queryParams.get("key");

    const keyToTry = urlKey || savedKey;
    if (keyToTry) {
      verifyAndLogin(keyToTry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyAndLogin(key: string) {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: key }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setIsAuthenticated(true);
        localStorage.setItem("fund_admin_key", key);
        loadLedgerData();
      } else {
        setAuthError(data.error || "Invalid secret key");
      }
    } catch {
      setAuthError("Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  }

  async function loadLedgerData() {
    try {
      const [fundRes, membersRes, txRes] = await Promise.all([
        fetch("/api/fund"),
        fetch("/api/members"),
        fetch("/api/transactions"),
      ]);

      if (fundRes.ok) {
        const fundData = (await fundRes.json()) as { ok?: boolean; fund?: FundData };
        if (fundData.ok && fundData.fund) {
          setFund(fundData.fund);
          setFundName(fundData.fund.name);
          setFundType(fundData.fund.fundType);
          setTargetBudgetTaka(String(fundData.fund.targetBudgetPaisa / 100));
          setFundDescription(fundData.fund.description || "");
          setFundAnnouncement(fundData.fund.announcement || "");
        }
      }

      if (membersRes.ok) {
        const membersData = (await membersRes.json()) as { ok?: boolean; members?: MemberData[] };
        if (membersData.ok && Array.isArray(membersData.members)) {
          setMembers(membersData.members);
          if (membersData.members.length > 0 && !contribMemberName) {
            setContribMemberName(membersData.members[0].displayName);
          }
        }
      }

      if (txRes.ok) {
        const txData = (await txRes.json()) as { ok?: boolean; transactions?: TransactionData[] };
        if (txData.ok && Array.isArray(txData.transactions)) {
          setTransactions(txData.transactions);
        }
      }
    } catch (err) {
      console.error("Failed to load ledger data:", err);
    }
  }

  function handleLogout() {
    localStorage.removeItem("fund_admin_key");
    setIsAuthenticated(false);
    setPasskey("");
  }

  async function handleSaveFundSettings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fundName,
          fundType,
          targetBudgetTaka: Number(targetBudgetTaka) || 0,
          description: fundDescription,
          announcement: fundAnnouncement,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; fund?: FundData; error?: string };
      if (res.ok && data.ok && data.fund) {
        setFund(data.fund);
        setMessage({ text: "Fund configuration updated successfully", type: "success" });
      } else {
        setMessage({ text: data.error || "Update failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Error saving fund settings", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contribAmountTaka || Number(contribAmountTaka) <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONTRIBUTION",
          memberName: contribMemberName,
          amountTaka: Number(contribAmountTaka),
          description: contribDesc || "Contribution via Admin Panel",
          createdBy: "Admin",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setMessage({ text: "Contribution recorded successfully", type: "success" });
        setIsContributionModalOpen(false);
        setContribAmountTaka("");
        setContribDesc("");
        loadLedgerData();
      } else {
        setMessage({ text: data.error || "Could not record contribution", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error recording contribution", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseAmountTaka || Number(expenseAmountTaka) <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          category: expenseCategory,
          amountTaka: Number(expenseAmountTaka),
          description: expenseDesc || "Expense via Admin Panel",
          createdBy: "Admin",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setMessage({ text: "Expense recorded successfully", type: "success" });
        setIsExpenseModalOpen(false);
        setExpenseAmountTaka("");
        setExpenseDesc("");
        loadLedgerData();
      } else {
        setMessage({ text: data.error || "Could not record expense", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error recording expense", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newMemberName.trim(),
          role: newMemberRole,
          phone: newMemberPhone.trim(),
          telegramUsername: newMemberTelegram.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setMessage({ text: `Member ${newMemberName} added successfully`, type: "success" });
        setIsMemberModalOpen(false);
        setNewMemberName("");
        setNewMemberPhone("");
        setNewMemberTelegram("");
        loadLedgerData();
      } else {
        setMessage({ text: data.error || "Failed to add member", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error adding member", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleMemberStatus(member: MemberData) {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setMessage({ text: `Member marked as ${nextStatus}`, type: "success" });
        loadLedgerData();
      }
    } catch {
      setMessage({ text: "Failed to update member status", type: "error" });
    }
  }

  async function handleDeleteMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ text: "Member removed", type: "success" });
        loadLedgerData();
      }
    } catch {
      setMessage({ text: "Failed to remove member", type: "error" });
    }
  }

  async function handleReverseTransaction(txId: string) {
    if (!confirm("Are you sure you want to reverse this transaction? A compensating reversal entry will be created.")) return;
    try {
      const res = await fetch("/api/transactions/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, reversedBy: "Admin" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setMessage({ text: "Transaction successfully reversed", type: "success" });
        loadLedgerData();
      } else {
        setMessage({ text: data.error || "Failed to reverse transaction", type: "error" });
      }
    } catch {
      setMessage({ text: "Error connecting to reversal endpoint", type: "error" });
    }
  }

  async function handlePresetReset(preset: "ROOM" | "BATCH") {
    if (!confirm(`Reset and switch demo ledger data to ${preset} mode?`)) return;
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setMessage({ text: `Switched preset to ${preset}`, type: "success" });
        loadLedgerData();
      }
    } catch {
      setMessage({ text: "Error resetting preset", type: "error" });
    }
  }

  // Categories based on fund type
  const roomCategories = [
    "GROCERY",
    "ELECTRICITY",
    "CLEANING",
    "INTERNET",
    "GAS",
    "RENT",
    "OTHER",
  ];

  const batchCategories = [
    "VENUE",
    "FOOD",
    "PRINTING",
    "MERCHANDISE",
    "EVENT",
    "CHARITY",
    "TRANSPORT",
    "OTHER",
  ];

  const activeCategories = fundType === "BATCH" ? batchCategories : roomCategories;

  // Unauthenticated screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Hidden Admin Control Panel
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your administration secret passkey to access financial controls, fund configurations, and ledger mutations.
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/80 shadow-2xl">
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passkey.trim()) verifyAndLogin(passkey.trim());
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="passkey-input"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Admin Secret Key
                  </label>
                  <div className="relative">
                    <input
                      id="passkey-input"
                      type="password"
                      placeholder="Enter passkey"
                      required
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <KeyRound className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/50 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <Button
                  id="btn-admin-login"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 shadow-lg"
                >
                  {loading ? "Verifying..." : "Authenticate & Open Control Panel"}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center leading-normal">
                Secret is verified against the environment variable <code className="text-slate-400 font-mono">ADMIN_SECRET_KEY</code>.
                In local development default fallback keys are accepted.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-6">

        {/* Top header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-mono text-[10px] uppercase tracking-wider">
                Admin Panel Active
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {fund ? fund.name : "Loading fund..."}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Master Fund Control Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsContributionModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Record Contribution
            </Button>
            <Button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <MinusCircle className="h-4 w-4" />
              Record Expense
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              Lock
            </Button>
          </div>
        </div>

        {/* Status notification toast */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-red-950/60 border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveSection("fund")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
              activeSection === "fund"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Fund Configuration & Presets
          </button>
          <button
            onClick={() => setActiveSection("transactions")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
              activeSection === "transactions"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ledger & Reversals ({transactions.length})
          </button>
          <button
            onClick={() => setActiveSection("members")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
              activeSection === "members"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Member Access & Roles ({members.length})
          </button>
          <button
            onClick={() => setActiveSection("bot")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
              activeSection === "bot"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Bot API & Webhook Bridge
          </button>
        </div>

        {/* Section 1: Fund Configuration & Presets */}
        {activeSection === "fund" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Fund Profile Form */}
            <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">
                  Fund Profile & Operating Mode
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Switch between room fund management and batch fund management or modify targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFundSettings} className="space-y-4">

                  {/* Fund Type Switcher */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Management Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFundType("ROOM");
                          if (fundName.includes("Batch")) setFundName("Room 302 General Fund");
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                          fundType === "ROOM"
                            ? "bg-emerald-950/50 border-emerald-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Home className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-xs text-white">Room Fund Management</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tailored for hostel rooms, shared apartments, flats, and mess groceries
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFundType("BATCH");
                          if (fundName.includes("Room")) setFundName("CSE Batch 2024 Central Fund");
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                          fundType === "BATCH"
                            ? "bg-emerald-950/50 border-emerald-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <GraduationCap className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-xs text-white">Batch Fund Management</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tailored for university batches, alumni, events, student dues, and projects
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Fund Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fundName}
                        onChange={(e) => setFundName(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Target Budget Goal (৳ Taka)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={targetBudgetTaka}
                        onChange={(e) => setTargetBudgetTaka(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Fund Description
                    </label>
                    <input
                      type="text"
                      value={fundDescription}
                      onChange={(e) => setFundDescription(e.target.value)}
                      placeholder="Purpose of this fund"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Public Notice Announcement
                    </label>
                    <input
                      type="text"
                      value={fundAnnouncement}
                      onChange={(e) => setFundAnnouncement(e.target.value)}
                      placeholder="e.g. Contributions due on the 5th of each month"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save Configuration
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Presets & Actions sidebar */}
            <div className="space-y-6">
              <Card className="border-slate-800 bg-slate-900/60 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white">
                    Quick Demo Presets
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Switch sample data sets to inspect or demonstrate both formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handlePresetReset("ROOM")}
                    variant="outline"
                    className="w-full justify-start text-xs border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Home className="h-4 w-4 mr-2 text-emerald-400" />
                    Load Room Fund Preset (Room 302)
                  </Button>

                  <Button
                    onClick={() => handlePresetReset("BATCH")}
                    variant="outline"
                    className="w-full justify-start text-xs border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <GraduationCap className="h-4 w-4 mr-2 text-emerald-400" />
                    Load Batch Fund Preset (CSE Batch 2024)
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/60 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white">
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Net Ledger Balance</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {fund ? formatTaka(fund.totalBalancePaisa) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Collected</span>
                    <span className="font-mono font-bold text-slate-200">
                      {fund ? formatTaka(fund.totalContributionsPaisa) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="font-mono font-bold text-red-400">
                      {fund ? formatTaka(Math.abs(fund.totalExpensesPaisa)) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opening Deposit</span>
                    <span className="font-mono font-bold text-slate-300">
                      {fund ? formatTaka(fund.openingBalancePaisa) : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Section 2: Ledger & Reversals */}
        {activeSection === "transactions" && (
          <Card className="border-slate-800 bg-slate-900/60 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Ledger Transactions & Compensating Reversals
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Every transaction is immutable. Erroneous records are reversed by creating equal and opposite correcting entries.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsContributionModalOpen(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Add Contribution
                </Button>
                <Button
                  onClick={() => setIsExpenseModalOpen(true)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  <MinusCircle className="h-3.5 w-3.5 mr-1" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-y border-slate-800">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Party or Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Source</th>
                      <th className="px-6 py-3 text-right">Amount (BDT)</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-900/80 transition ${
                          tx.status === "reversed" ? "opacity-40 line-through" : ""
                        }`}
                      >
                        <td className="px-6 py-3 font-mono text-[11px] text-slate-500">
                          {tx.id}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              tx.type === "CONTRIBUTION"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : tx.type === "EXPENSE"
                                ? "bg-red-950 text-red-400 border border-red-800"
                                : "bg-purple-950 text-purple-400 border border-purple-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-200">
                          {tx.memberName || tx.category || "General"}
                        </td>
                        <td className="px-6 py-3 text-slate-400">
                          {tx.description}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-500">
                          {tx.date}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {tx.source}
                        </td>
                        <td
                          className={`px-6 py-3 text-right font-mono font-bold tabular-nums ${
                            tx.amountPaisa > 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {tx.amountPaisa > 0 ? "+" : ""}
                          {formatTaka(tx.amountPaisa)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {tx.status !== "reversed" && tx.type !== "REVERSAL" && (
                            <button
                              onClick={() => handleReverseTransaction(tx.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-[11px] font-semibold transition"
                            >
                              Reverse
                            </button>
                          )}
                          {tx.status === "reversed" && (
                            <span className="text-[10px] text-slate-500 italic">
                              Reversed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Members */}
        {activeSection === "members" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Fund Membership Directory
                </h2>
                <p className="text-xs text-slate-400">
                  Manage members, modify permissions, assign roles, or suspend memberships
                </p>
              </div>
              <Button
                onClick={() => setIsMemberModalOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => (
                <Card key={m.id} className="border-slate-800 bg-slate-900/60 shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">
                          {m.displayName}
                        </p>
                        {m.telegramUsername ? (
                          <p className="text-xs text-sky-400 font-mono">
                            @{m.telegramUsername}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 font-mono">
                            {m.phone || m.id}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-[10px] font-semibold ${
                          m.role === "TREASURER"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : m.role === "OWNER"
                            ? "bg-amber-950 text-amber-400 border-amber-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {m.role}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Contributed</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {formatTaka(m.contributedPaisa)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleMemberStatus(m)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                          m.status === "active"
                            ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                            : "bg-amber-950 text-amber-400 hover:bg-amber-900"
                        }`}
                      >
                        Status: {m.status}
                      </button>

                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Bot API & Webhook Bridge */}
        {activeSection === "bot" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-800 bg-slate-900/60 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  Bot API Synchronization Bridge
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  How the Telegram bot queries live balances and records entries through API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-slate-300">
                <p>
                  The Telegram bot connects to this dashboard via secure HTTP API endpoints:
                </p>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                    <p className="text-emerald-400 font-bold">GET /api/bot/sync</p>
                    <p className="text-slate-400 mt-1">
                      Fetches current fund balance, active members, and latest transactions.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                    <p className="text-emerald-400 font-bold">POST /api/bot/sync</p>
                    <p className="text-slate-400 mt-1">
                      Records a contribution or expense initiated by group chat members.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="font-semibold text-white">Environment Configuration</p>
                  <p className="text-slate-400">
                    In your Telegram bot worker settings, set these environment variables:
                  </p>
                  <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto">
{`WEB_API_URL=https://your-dashboard.pages.dev
BOT_API_KEY=your_secure_bot_api_key_from_env`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">
                  Cloudflare Pages Hosting Guide
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Deploy this repository with zero monthly cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  This Next.js web application is built for Cloudflare Pages.
                </p>

                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>
                    Connect your GitHub repository to Cloudflare Pages in the Cloudflare dashboard.
                  </li>
                  <li>
                    Select the Next.js framework preset or run build command:
                    <br />
                    <code className="bg-slate-950 px-2 py-1 rounded text-emerald-400 font-mono text-[11px] inline-block mt-1">
                      npm run build
                    </code>
                  </li>
                  <li>
                    Configure Environment Variables in Cloudflare Pages:
                    <br />
                    <code className="text-slate-300 font-mono">ADMIN_SECRET_KEY</code>: Your chosen passkey for this hidden admin panel.
                  </li>
                  <li>
                    Deploy! Your user side dashboard is public at the root, and the admin panel remains secured under <code className="text-slate-300 font-mono">/admin</code>.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal 1: Record Contribution */}
        {isContributionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Record Contribution</h3>
                  <p className="text-xs text-slate-400">Credit the fund and attribute it to a member</p>
                </div>
                <button
                  onClick={() => setIsContributionModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordContribution} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Member
                  </label>
                  <select
                    value={contribMemberName}
                    onChange={(e) => setContribMemberName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {members
                      .filter((m) => m.status === "active")
                      .map((m) => (
                        <option key={m.id} value={m.displayName}>
                          {m.displayName} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Amount (৳ Taka)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={contribAmountTaka}
                    onChange={(e) => setContribAmountTaka(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly contribution for October"
                    value={contribDesc}
                    onChange={(e) => setContribDesc(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsContributionModalOpen(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {loading ? "Recording..." : "Record Contribution"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Record Expense */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Record Expense</h3>
                  <p className="text-xs text-slate-400">Debit the fund and log category expenditure</p>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Expense Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {activeCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Amount (৳ Taka)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 250"
                    value={expenseAmountTaka}
                    onChange={(e) => setExpenseAmountTaka(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Description / Item Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rice, oil and spices for dinner"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold"
                  >
                    {loading ? "Recording..." : "Record Expense"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Add Member */}
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Enroll New Member</h3>
                  <p className="text-xs text-slate-400">Add a member to participate in this fund</p>
                </div>
                <button
                  onClick={() => setIsMemberModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakib Al Hasan"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as MemberData["role"])}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="MEMBER">Member (Standard participant)</option>
                    <option value="TREASURER">Treasurer (Can record on Telegram)</option>
                    <option value="OWNER">Owner (Full admin rights)</option>
                    <option value="VIEWER">Viewer (Audit only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Telegram Username (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={newMemberTelegram}
                      onChange={(e) => setNewMemberTelegram(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 pl-7 pr-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMemberModalOpen(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {loading ? "Adding..." : "Add Member"}
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
