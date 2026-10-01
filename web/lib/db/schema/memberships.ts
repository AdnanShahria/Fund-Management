import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// A membership joins a user to an organization, group, or fund with a specific role.
// The same user can have different roles in different scopes.
export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  groupId: text("group_id"), // null = org-level membership
  fundId: text("fund_id"),   // null = group-level or org-level
  userId: text("user_id").notNull(),
  role: text("role", { enum: ["OWNER", "TREASURER", "MEMBER", "VIEWER"] })
    .notNull()
    .default("MEMBER"),
  status: text("status", { enum: ["active", "suspended", "removed"] })
    .notNull()
    .default("active"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
});
