import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  telegramUserId: text("telegram_user_id").unique(),
  username: text("username"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status", { enum: ["active", "suspended", "deleted"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
