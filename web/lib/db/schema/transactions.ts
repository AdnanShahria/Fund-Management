import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// All financial mutations live here. This table is the authoritative ledger.
// Amounts stored as paisa (integer) to avoid floating point issues.
// +paisa = inflow (CONTRIBUTION, REFUND), -paisa = outflow (EXPENSE, REVERSAL correction).
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  groupId: text("group_id").notNull(),
  fundId: text("fund_id").notNull(),
  type: text("type", {
    enum: ["CONTRIBUTION", "EXPENSE", "REFUND", "CORRECTION", "REVERSAL"],
  }).notNull(),
  // memberId: the user this transaction is attributed to (e.g., who contributed).
  // Null for expense entries (category based, not member based).
  memberId: text("member_id"),
  amountPaisa: integer("amount_paisa").notNull(), // positive = credit, negative = debit
  currency: text("currency").notNull().default("BDT"),
  category: text("category"), // e.g. GROCERY, ELECTRICITY, CLEANING, OTHER
  description: text("description"),
  transactionDate: integer("transaction_date", { mode: "timestamp" }).notNull(),
  createdBy: text("created_by").notNull(), // user_id of the treasurer who recorded it
  source: text("source", { enum: ["TELEGRAM", "WEB", "API"] })
    .notNull()
    .default("TELEGRAM"),
  // Telegram source reference for deduplication
  sourceTelegramChatId: text("source_telegram_chat_id"),
  sourceTelegramMessageId: text("source_telegram_message_id"),
  // If this reverses another transaction, link it here
  reversesTransactionId: text("reverses_transaction_id"),
  status: text("status", { enum: ["pending", "completed", "reversed", "cancelled"] })
    .notNull()
    .default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
