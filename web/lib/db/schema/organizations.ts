import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["UNIVERSITY", "SCHOOL", "COMPANY", "CLUB", "COMMUNITY", "OTHER"],
  })
    .notNull()
    .default("OTHER"),
  country: text("country"),
  currency: text("currency").notNull().default("BDT"),
  ownerUserId: text("owner_user_id").notNull(),
  status: text("status", { enum: ["active", "suspended", "deleted"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
