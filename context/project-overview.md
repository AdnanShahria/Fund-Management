# Project Overview: Fund Management

> [!NOTE]
> This is the north star document for the project. Read this first before working on any feature.

---

## Product Vision

Fund Management is a Telegram-first group fund management platform for rooms, batches, clubs, departments, and other organized communities. It gives any group a transparent, shared financial ledger without needing spreadsheets or accounting software.

**Primary interface:** Telegram Bot
**Secondary interface:** Web Dashboard (Next.js) and Telegram Mini App

**Primary currency:** BDT (Bangladeshi Taka, ৳)

**Target Users:**
- Room / group Treasurer (records contributions and expenses)
- Group Owner (administers the fund and assigns roles)
- Members (read only: view balance, history, reports)
- Viewers (same as member, no group membership required)

---

## Problem Statement

Small groups (rooms, batches, clubs) manage shared money through Telegram messages, Google Sheets, and paper notebooks. This causes:

1. Missing transactions and duplicate entries
2. Calculation errors and no audit trail
3. Lack of accountability between members
4. Difficult historical lookup and reporting
5. No access control to prevent unauthorized edits

---

## Solution

A Telegram bot that accepts natural language and commands to record contributions and expenses, backed by a Cloudflare D1 ledger. A web dashboard handles complex administration, filtering, charts, and bulk actions where a graphical interface is more efficient.

---

## Business Context

| Attribute | Value |
|-----------|-------|
| Product Name | Fund Management |
| Primary Interface | Telegram Bot |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Frontend | Next.js (web dashboard) |
| Currency | BDT (Bangladeshi Taka) |
| Target Cost | $0/month for MVP |
| Primary Market | University rooms, batches, clubs (Bangladesh) |

---

## Product Hierarchy

```
Organization
    ↓
Group (batch, room, department, club)
    ↓
Fund (general, room, tour, event, emergency)
```

A group may contain multiple funds. The same user can have different roles across funds.

---

## Core Modules

| Module | Description | Priority |
|--------|-------------|----------|
| **Telegram Bot** | Commands, natural language, confirmations | P0 |
| **Rule-Based Parser** | Parses /add, /expense, NL messages | P0 |
| **Transaction Ledger** | CONTRIBUTION, EXPENSE, REFUND, REVERSAL | P0 |
| **Web Dashboard** | Balance, ledger table, member list, charts | P0 |
| **Role-Based Access** | Owner, Treasurer, Member, Viewer | P0 |
| **Idempotency** | Telegram webhook deduplication | P0 |
| **AI Parser** | Fallback when rule-based parser fails | P1 |
| **Reporting** | Monthly reports, member breakdown, export | P1 |
| **Audit Logs** | Immutable record of every financial mutation | P1 |
| **Telegram Mini App** | Dashboard embedded in Telegram | P2 |
| **Notifications** | Monthly reminders, contribution requests | P2 |

---

## Key Engineering Rules

1. Cloudflare D1 is the single authoritative financial source. Never two writable stores.
2. All financial amounts stored as integer paisa (BDT cents) to avoid floating point.
3. Balance is always computed from the ledger. Never stored as a materialized field.
4. Every financial mutation produces an audit record.
5. Telegram webhook processing is idempotent. Check `telegram_updates` before inserting.
6. Authorization is server-side always. Roles are contextual: `User × Group × Fund × Role`.
7. AI is an interpretation layer only. It must not write to the DB directly.
8. The system must remain functional without AI for basic operations.

---

## Data Model (Summary)

| Table | Purpose |
|-------|---------|
| `users` | Telegram identity, display name |
| `organizations` | Top-level institution |
| `groups` | Batch, room, club, etc. Linked to Telegram chat via `telegram_chat_id` |
| `funds` | Financial ledger per group |
| `memberships` | User × group × fund × role |
| `transactions` | All financial entries. Amount in paisa (integer). |
| `audit_logs` | Immutable log of every write operation |
| `telegram_updates` | Processed update IDs for idempotency |

---

## Bot Commands

**General (any member):**
- `/start` — onboarding
- `/balance` — current balance
- `/summary` — full fund summary
- `/history` — recent transactions
- `/members` — member list with contributions

**Treasurer / Owner only:**
- `/add <name> <amount>` — record contribution
- `/expense <amount> <category>` — record expense
- `/reverse <tx-id>` — reverse a transaction
- `/addmember`, `/removemember` — membership management
- `/export` — export records

**Natural language also works:**
- `Murad gave 300 tk`
- `We spent 150 on grocery`
- `Adnan contributed 200, Rahim contributed 300`

---

## Related Documents

| Document | Location |
|----------|----------|
| PRD | [`/prd.md`](../prd.md) |
| Code Standards | [`/context/codestandard.md`](./codestandard.md) |

---

*Last updated: 2026-10-01*
