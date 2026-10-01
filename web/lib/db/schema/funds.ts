import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// A fund is a financial ledger belonging to a specific group.
// Examples: General Fund, Room Fund, Tour Fund, Event Fund.
export const funds = sqliteTable("funds", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  groupId: text("group_id").notNull(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["GENERAL", "ROOM", "TOUR", "EVENT", "EMERGENCY", "PICNIC", "OTHER"],
  })
    .notNull()
    .default("GENERAL"),
  currency: text("currency").notNull().default("BDT"),
  // Opening balance in the smallest integer unit (paisa) to avoid float issues.
  // Divide by 100 to get taka.
  openingBalancePaisa: integer("opening_balance_paisa").notNull().default(0),
  status: text("status", { enum: ["active", "closed", "archived"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
