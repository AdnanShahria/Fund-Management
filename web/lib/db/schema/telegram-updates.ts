import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Stores processed Telegram update IDs to guarantee idempotent webhook processing.
// Before processing any update, check this table first.
// If the (chat_id, message_id) pair exists, the update was already processed — skip it.
export const telegramUpdates = sqliteTable("telegram_updates", {
  id: text("id").primaryKey(),
  telegramChatId: text("telegram_chat_id").notNull(),
  telegramMessageId: text("telegram_message_id").notNull(),
  telegramUpdateId: text("telegram_update_id").notNull().unique(),
  processedAt: integer("processed_at", { mode: "timestamp" }).notNull(),
});
