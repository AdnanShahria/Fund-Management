import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// A group is a subdivision of an organization: batch, room, department, club, etc.
// parent_group_id enables a hierarchy (e.g. University → Faculty → Batch → Room).
export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  parentGroupId: text("parent_group_id"), // null = top level group
  name: text("name").notNull(),
  type: text("type", {
    enum: ["BATCH", "ROOM", "DEPARTMENT", "CLUB", "HALL", "TEAM", "COMMITTEE", "OTHER"],
  })
    .notNull()
    .default("OTHER"),
  telegramChatId: text("telegram_chat_id"), // Telegram group/supergroup chat ID
  status: text("status", { enum: ["active", "archived", "deleted"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
