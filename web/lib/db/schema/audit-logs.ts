import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  groupId: text("group_id"),
  fundId: text("fund_id"),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(), // e.g. CREATE_TRANSACTION, REVERSE_TRANSACTION, ADD_MEMBER
  entityType: text("entity_type").notNull(), // e.g. transaction, membership, fund
  entityId: text("entity_id"),
  metadata: text("metadata"), // JSON string with additional context
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
