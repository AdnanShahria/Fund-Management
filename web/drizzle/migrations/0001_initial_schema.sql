-- Orbit Fund Management: initial D1 schema
-- Run via: npx wrangler d1 execute orbit-fund-management-db --remote --file=drizzle/migrations/0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS fund (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT 'Room 302 General Fund',
  fund_type TEXT NOT NULL DEFAULT 'ROOM' CHECK (fund_type IN ('ROOM', 'BATCH')),
  currency TEXT NOT NULL DEFAULT 'BDT',
  opening_balance_paisa INTEGER NOT NULL DEFAULT 0,
  total_contributions_paisa INTEGER NOT NULL DEFAULT 0,
  total_expenses_paisa INTEGER NOT NULL DEFAULT 0,
  target_budget_paisa INTEGER NOT NULL DEFAULT 1000000,
  description TEXT NOT NULL DEFAULT '',
  announcement TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'TREASURER', 'MEMBER', 'VIEWER')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  contributed_paisa INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  telegram_username TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CONTRIBUTION', 'EXPENSE', 'REFUND', 'CORRECTION', 'REVERSAL')),
  member_id TEXT,
  member_name TEXT,
  category TEXT,
  description TEXT NOT NULL DEFAULT '',
  amount_paisa INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'WEB' CHECK (source IN ('TELEGRAM', 'WEB')),
  date TEXT NOT NULL DEFAULT (date('now')),
  created_by TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed')),
  reversed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the default fund record
INSERT OR IGNORE INTO fund (id, name, fund_type, opening_balance_paisa, total_contributions_paisa, total_expenses_paisa, target_budget_paisa, description, announcement)
VALUES (
  'fund-room-302',
  'Room 302 General Fund',
  'ROOM',
  100000,
  630000,
  363000,
  1000000,
  'Shared living and mess expenses for Room 302 members',
  'Monthly contributions due on the 5th of each month'
);

-- Seed default members
INSERT OR IGNORE INTO members (id, user_id, display_name, role, status, contributed_paisa, telegram_username)
VALUES
  ('mem-1', 'u-adnan', 'Adnan Shahria', 'TREASURER', 'active', 200000, 'adnan_dev'),
  ('mem-2', 'u-murad', 'Murad Hasan', 'MEMBER', 'active', 150000, 'murad_h'),
  ('mem-3', 'u-rahim', 'Rahim Uddin', 'MEMBER', 'active', 120000, 'rahim_u'),
  ('mem-4', 'u-karim', 'Karim Sheikh', 'MEMBER', 'active', 90000, 'karim_s'),
  ('mem-5', 'u-farhan', 'Farhan Ali', 'MEMBER', 'suspended', 60000, 'farhan_a');

-- Seed a few sample transactions
INSERT OR IGNORE INTO transactions (id, type, member_id, member_name, description, amount_paisa, source, date, created_by, status)
VALUES
  ('tx-1', 'CONTRIBUTION', 'u-adnan', 'Adnan Shahria', 'Monthly contribution', 50000, 'TELEGRAM', '2026-10-01', 'Adnan Shahria', 'completed'),
  ('tx-2', 'CONTRIBUTION', 'u-murad', 'Murad Hasan', 'Monthly contribution', 50000, 'TELEGRAM', '2026-10-01', 'Adnan Shahria', 'completed'),
  ('tx-3', 'EXPENSE', NULL, NULL, 'Weekly grocery from market', -15000, 'TELEGRAM', '2026-09-30', 'Adnan Shahria', 'completed'),
  ('tx-4', 'EXPENSE', NULL, NULL, 'September electricity bill share', -8000, 'WEB', '2026-09-28', 'Adnan Shahria', 'completed');
