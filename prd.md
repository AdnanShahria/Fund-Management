# Fund Management
## Product Requirements Document (PRD)

**Product Name:** Fund Management  
**Document Version:** 1.0  
**Product Status:** Initial Product Specification  
**Primary Interface:** Telegram Bot  
**Secondary Interface:** Web Dashboard / Telegram Mini App  
**Primary Backend:** Cloudflare Workers  
**Primary Database:** Cloudflare D1  
**Secondary Database:** Turso, optional  
**Primary Currency:** BDT (৳)  
**Target Deployment:** Free / Near-Zero-Cost Infrastructure for MVP

---

# 1. Executive Summary

**Fund Management** is a centralized, AI-assisted fund and financial ledger management platform designed for groups, rooms, batches, clubs, organizations, departments, and eventually university-wide communities.

The system is designed around a simple principle:

> **Users communicate naturally. The system records money strictly.**

The primary user interface is a Telegram Bot. Authorized users can record contributions and expenses using normal language, while other members can view fund information without being able to modify financial records.

A lightweight web dashboard will complement the Telegram bot when visual reporting, filtering, administration, analytics, member management, exports, or other complex operations are more convenient than chat.

The initial use case may be a small room fund, but the platform must be architected as a multi-group, multi-fund system from the beginning.

---

# 2. Product Vision

Create a lightweight, secure, intelligent fund-management infrastructure that allows any organized community to maintain a transparent financial ledger without requiring spreadsheets or traditional accounting software.

The product should eventually support structures such as:

```text
University
├── Faculty
│   ├── Department
│   └── Batch
│       ├── General Fund
│       ├── Event Fund
│       └── Tour Fund
│
├── Hall
│   ├── Room
│   │   └── Room Fund
│   └── Hall Fund
│
├── Club
│   └── Club Fund
│
└── Organization
    └── Organization Fund
```

---

# 3. Problem Statement

Small and medium-sized groups commonly manage shared money through:

- Messenger or Telegram messages
- Google Sheets
- Excel
- Paper notebooks
- Manual calculations
- Informal chat history

This causes:

- Missing transactions
- Duplicate entries
- Calculation errors
- Lack of accountability
- Difficult historical lookup
- Poor visibility into member contributions
- Unauthorized edits
- Difficult monthly reporting
- No consistent audit trail

Fund Management provides a centralized ledger while preserving the simplicity of chat-based communication.

---

# 4. Product Goals

## 4.1 Primary Goals

The product must:

1. Provide a reliable digital ledger.
2. Support multiple organizations and groups.
3. Support multiple independent funds.
4. Use Telegram as the primary interaction layer.
5. Support natural-language financial input.
6. Enforce strict role-based access control.
7. Keep one authoritative financial source of truth.
8. Calculate balances deterministically.
9. Maintain immutable/auditable financial history.
10. Provide a web dashboard when visual or administrative workflows require it.
11. Remain extremely inexpensive to operate for small and medium deployments.
12. Scale conceptually from a room to an entire university.

---

# 5. Non-Goals for Initial MVP

The MVP will not initially focus on:

- Banking integrations
- Payment gateway integration
- Tax accounting
- Payroll
- Cryptocurrency
- Investment portfolio management
- Full double-entry accounting
- Automated bank reconciliation
- Public crowdfunding
- Personal banking

These may become future modules.

---

# 6. Target Users

## 6.1 Owner

Creates and controls the organization or fund-management workspace.

Responsibilities:

- Organization configuration
- Role assignment
- Fund administration
- High-level access control

---

## 6.2 Treasurer / Finance Admin

Primary financial operator.

Responsibilities:

- Add contributions
- Add expenses
- Correct records
- Reverse transactions
- Review reports
- Manage fund operations

---

## 6.3 Member

Can access information within permitted groups/funds but cannot directly modify financial records.

---

## 6.4 Viewer

Read-only access for users who need transparency but do not participate in fund administration.

---

# 7. Product Hierarchy

The data model must not be room-centric.

The foundational hierarchy is:

```text
Organization
    ↓
Group
    ↓
Fund
```

Examples:

```text
Gazipur Agricultural University
    ↓
FVMAS-16
    ↓
Batch General Fund
```

Or:

```text
Gazipur Agricultural University
    ↓
FVMAS-16
    ↓
Room 302
    ↓
Room Fund
```

Or:

```text
Gazipur Agricultural University
    ↓
Science Club
    ↓
Annual Event Fund
```

A group may contain multiple funds.

---

# 8. Core Concept Definitions

## Organization

A top-level institution or community.

Examples:

- University
- Company
- NGO
- Society
- School
- Informal community

---

## Group

A subdivision of an organization.

Examples:

- Batch
- Room
- Department
- Club
- Hall
- Team
- Committee

---

## Fund

A financial ledger belonging to a specific group.

Examples:

- General Fund
- Room Fund
- Tour Fund
- Event Fund
- Emergency Fund
- Picnic Fund

---

# 9. Multi-Tenant Architecture

The system must support multiple independent organizations.

```text
Organization A
├── Group A1
│   ├── Fund A1-1
│   └── Fund A1-2
│
└── Group A2
    └── Fund A2-1


Organization B
├── Group B1
└── Group B2
```

Data isolation must be enforced at the backend level.

A user belonging to Organization A must never be able to query or mutate data belonging to Organization B unless explicitly authorized.

---

# 10. Role-Based Access Control

Permissions are not global user properties.

Permissions are contextual:

> **User × Organization/Group/Fund × Role**

Example:

```text
Adnan
├── University → Student
├── FVMAS-16 → Member
├── Batch General Fund → Treasurer
├── Event Fund → Treasurer
└── Room 302 → Member
```

Another user may be:

```text
Murad
├── FVMAS-16 → Member
└── Room 302 → Treasurer
```

This allows the same user to have different roles in different funds.

---

# 11. Permission Matrix

| Action | Owner | Treasurer | Member | Viewer |
|---|---:|---:|---:|---:|
| View balance | ✅ | ✅ | ✅ | ✅ |
| View transactions | ✅ | ✅ | ✅ | ✅ |
| View reports | ✅ | ✅ | ✅ | ✅ |
| Add contribution | ✅ | ✅ | ❌ | ❌ |
| Add expense | ✅ | ✅ | ❌ | ❌ |
| Edit transaction | ✅ | ✅ | ❌ | ❌ |
| Reverse transaction | ✅ | ✅ | ❌ | ❌ |
| Delete transaction | Restricted | Restricted | ❌ | ❌ |
| Add member | ✅ | ✅ | ❌ | ❌ |
| Remove member | ✅ | Optional | ❌ | ❌ |
| Assign Treasurer | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| Export records | ✅ | ✅ | ❌ | ❌ |
| Configure fund | ✅ | Limited | ❌ | ❌ |

All permissions MUST be enforced server-side.

---

# 12. Primary Interface: Telegram Bot

Telegram will be the default interaction interface.

The bot should support:

- Commands
- Natural-language queries
- Natural-language transaction input
- Interactive buttons
- Confirmation dialogs
- Reports
- Notifications
- User onboarding
- Fund switching

---

# 13. Web Dashboard

The web dashboard is not required for every action.

It exists for workflows where a graphical interface is significantly more efficient.

### Dashboard use cases

- Large transaction history
- Advanced filtering
- Charts
- Financial reporting
- Member administration
- Fund administration
- Audit logs
- Data export
- Bulk actions
- Complex configuration

The system must remain functional without the dashboard for routine Telegram-based operations.

---

# 14. Dashboard Access Model

Preferred approach:

```text
Telegram
    ↓
Open Dashboard
    ↓
Telegram authentication / Mini App
    ↓
Backend verifies identity
```

The dashboard must respect the same permissions as Telegram.

A user must not receive additional privileges simply because they are accessing the web interface.

---

# 15. Transaction Types

MVP transaction types:

```text
CONTRIBUTION
EXPENSE
REFUND
CORRECTION
REVERSAL
```

Future:

```text
TRANSFER
ADVANCE
LOAN
SETTLEMENT
```

---

# 16. Natural-Language Transaction Input

The system should support natural input.

Example:

> Murad contributed 100 tk and Adnan contributed 300 tk today. We spent 90 tk for groceries.

The system must interpret this as:

```text
+৳100 Murad
+৳300 Adnan
-৳90 Grocery
```

Net change:

```text
+৳310
```

---

# 17. AI Responsibilities

AI is an interpretation layer only.

AI may:

- Identify intent
- Extract names
- Extract amounts
- Extract dates
- Identify categories
- Extract descriptions
- Interpret natural language
- Interpret multi-transaction messages
- Answer natural-language reporting queries

AI must NOT:

- Determine user permissions
- Directly execute SQL
- Directly mutate the database
- Invent users
- Invent funds
- Invent transaction IDs
- Generate financial balances independently

---

# 18. AI Processing Pipeline

```text
Telegram Message
      ↓
Identify Telegram User
      ↓
Check Room/Group/Fund Context
      ↓
Authorization
      ↓
Rule-Based Parser
      ↓
If unresolved
      ↓
AI Parser
      ↓
Structured JSON
      ↓
Schema Validation
      ↓
Business Validation
      ↓
Database Transaction
      ↓
Confirmation / Result
```

The backend remains the authority.

---

# 19. Structured AI Output

AI should produce structured output such as:

```json
{
  "intent": "CREATE_TRANSACTIONS",
  "actions": [
    {
      "type": "CONTRIBUTION",
      "member_name": "Murad",
      "amount": 100,
      "currency": "BDT",
      "date": "2026-10-01"
    },
    {
      "type": "CONTRIBUTION",
      "member_name": "Adnan",
      "amount": 300,
      "currency": "BDT",
      "date": "2026-10-01"
    },
    {
      "type": "EXPENSE",
      "amount": 90,
      "currency": "BDT",
      "category": "GROCERY",
      "date": "2026-10-01"
    }
  ]
}
```

This output must be validated against a strict schema before being accepted.

---

# 20. Ambiguity Handling

The system must never guess where ambiguity could change financial records.

Example:

> Murad gave 100.

If multiple members named Murad exist:

```text
I found multiple members named Murad.

1. Murad Hasan
2. Murad Rahman

Please select the correct member.
```

If amount is missing:

```text
I couldn't determine the amount.

How much did Murad contribute?
```

---

# 21. Authorization Before Financial Writes

The system must perform:

```text
User Identity
      ↓
Membership Check
      ↓
Role Check
      ↓
Permission Check
      ↓
Transaction Validation
      ↓
Commit
```

A member attempting:

> Add expense 500 tk.

must receive:

```text
❌ Permission denied.

Only authorized fund administrators can modify financial records.
```

No transaction should be inserted.

---

# 22. Financial Source of Truth

**Cloudflare D1 will be the authoritative primary data store.**

The system must not maintain two independently writable databases for financial records.

Architecture:

```text
Cloudflare D1
     ↓
Source of Truth
```

Turso is optional and secondary.

Possible uses:

- Analytics
- Archive
- Secondary workloads
- Data portability
- Future infrastructure migration
- Specialized read workloads

---

# 23. Database Strategy

## Primary

**Cloudflare D1**

Stores:

- Users
- Organizations
- Groups
- Funds
- Memberships
- Transactions
- Roles
- Permissions
- Audit records

## Secondary

**Turso**

Only when needed.

It must not become a co-authoritative financial ledger.

---

# 24. Proposed Data Model

## users

```text
id
telegram_user_id
username
display_name
avatar_url
status
created_at
updated_at
```

---

## organizations

```text
id
name
type
country
currency
owner_user_id
status
created_at
updated_at
```

Possible types:

```text
UNIVERSITY
SCHOOL
COMPANY
CLUB
COMMUNITY
OTHER
```

---

## groups

```text
id
organization_id
parent_group_id
name
type
status
created_at
updated_at
```

This allows hierarchical structures.

Example:

```text
University
  ↓
Faculty
  ↓
Batch
  ↓
Room
```

---

## funds

```text
id
organization_id
group_id
name
type
currency
status
opening_balance
created_at
updated_at
```

---

## memberships

```text
id
organization_id
group_id
fund_id
user_id
role
status
joined_at
```

The same user can have different roles across scopes.

---

## transactions

```text
id
organization_id
group_id
fund_id
type
member_id
amount
currency
category
description
transaction_date
created_by
source
source_message_id
status
created_at
updated_at
```

---

## audit_logs

```text
id
organization_id
group_id
fund_id
actor_user_id
action
entity_type
entity_id
metadata
created_at
```

---

## telegram_updates

```text
id
telegram_chat_id
telegram_message_id
telegram_update_id
processed_at
```

Used for duplicate protection and webhook idempotency.

---

# 25. Ledger Model

The transaction ledger is the financial source of truth.

Balance must be derived from transaction records.

Conceptual calculation:

```text
Balance
=
Inflows
-
Outflows
+
Opening Balance
```

Example:

```text
Opening Balance       ৳1,000
Murad contribution    +৳200
Adnan contribution    +৳300
Grocery expense       -৳150
--------------------------------
Current Balance       ৳1,350
```

AI must never provide the authoritative balance.

---

# 26. Transaction Integrity

Multiple operations from a single message should be atomic.

Example:

```text
Murad +100
Adnan +300
Grocery -90
```

Required behavior:

```text
Transaction A ┐
Transaction B ├── COMMIT ALL
Transaction C ┘
```

or:

```text
ROLLBACK ALL
```

Partial success must not occur for atomic transaction batches.

---

# 27. Duplicate Protection

Telegram webhook processing must be idempotent.

A repeated update must not create a duplicate transaction.

Recommended unique key:

```text
telegram_chat_id
+
telegram_message_id
```

Processing flow:

```text
Incoming Update
      ↓
Already Processed?
 ┌────┴────┐
Yes        No
 ↓          ↓
Ignore    Process
```

---

# 28. Transaction Correction

Financial records should preferably be corrected using reversal/correction rather than destructive deletion.

Example:

Original:

```text
Expense -৳500
```

Correction:

```text
Reversal +৳500
Corrected Expense -৳350
```

This preserves historical accountability.

---

# 29. Confirmation Workflow

For sensitive actions, especially AI-parsed batches:

```text
🧾 Transaction Preview

Murad        +৳100
Adnan        +৳300
Groceries    -৳90

Net Change: +৳310

[Confirm]
[Cancel]
```

The system commits only after confirmation when confirmation mode is enabled.

---

# 30. Commands

## General Commands

```text
/start
/help
/balance
/summary
/history
/members
/funds
```

## Treasurer Commands

```text
/add
/expense
/correct
/reverse
/addmember
/removemember
```

## Administration

```text
/settings
/roles
/audit
/export
```

Natural-language input should work alongside commands.

---

# 31. Natural-Language Queries

Users should be able to ask:

> How much is currently in the fund?

> How much did Murad contribute this month?

> Show today's expenses.

> How much did we spend on groceries?

> Show all transactions from September.

> What is the total contribution of the batch?

The AI may interpret the question, but the answer must be generated from actual database queries.

---

# 32. Reporting

MVP reporting must support:

### Current Balance

```text
৳3,420
```

### Total Contribution

```text
৳8,200
```

### Total Expense

```text
৳4,780
```

### Member Contribution

```text
Adnan   ৳2,000
Murad   ৳1,500
Rahim   ৳1,200
```

### Expense Breakdown

```text
Grocery      ৳2,100
Electricity  ৳1,200
Cleaning       ৳600
Other          ৳880
```

---

# 33. Dashboard Requirements

The dashboard should provide:

## Overview

- Current Balance
- Total Contributions
- Total Expenses
- Active Members
- Selected Date Range
- Selected Fund

## Transactions

- Search
- Sort
- Filter
- Pagination
- Transaction details
- Correction/reversal controls

## Members

- Members
- Roles
- Contribution totals
- Membership status

## Reports

- Contribution trends
- Expense trends
- Category breakdown
- Member contribution distribution
- Monthly reports

## Administration

- Fund settings
- Group settings
- Role management
- Export
- Audit log

---

# 34. Dashboard Principle

The dashboard is:

> **Optional for routine interaction, essential for complex administration and visualization.**

Examples:

### Telegram is better for:

```text
"Murad gave 100."
"/balance"
"Show today's expenses."
```

### Dashboard is better for:

```text
"Show all expenses from the last 6 months."
"Export 2,000 transactions."
"Change 10 members' roles."
"Review monthly analytics."
```

---

# 35. Telegram Mini App

The architecture should be compatible with Telegram Mini Apps.

A user may open:

```text
Telegram
   ↓
Fund Management
   ↓
Open Dashboard
   ↓
Mini App
```

The same backend APIs and authorization model should power both Telegram and the web interface.

---

# 36. Technology Stack

## Backend

```text
Cloudflare Workers
TypeScript
Hono
```

## Primary Database

```text
Cloudflare D1
```

## ORM / Query Layer

```text
Drizzle ORM
```

## Optional Secondary Database

```text
Turso / libSQL
```

## Frontend

```text
React
Vite
TypeScript
Tailwind CSS
```

## Charts

```text
Recharts
```

## Messaging

```text
Telegram Bot API
```

## File Storage

```text
Cloudflare R2
```

Potential file types:

- Receipts
- Invoices
- Documents
- Exported reports

## Async Processing

```text
Cloudflare Queues
```

Potential uses:

- AI jobs
- Report generation
- Notifications
- Secondary database synchronization
- Analytics aggregation

## Scheduling

```text
Cloudflare Cron Triggers
```

Potential uses:

- Monthly reports
- Scheduled reminders
- Recurring expenses
- Data maintenance

---

# 37. AI Provider Abstraction

The application should not hard-code itself to a single AI provider.

Use an abstraction:

```text
AIProvider
```

Possible implementations:

```text
Gemini
OpenRouter
Cloudflare Workers AI
```

The application can select a provider based on:

- Cost
- Availability
- Latency
- Model quality
- Rate limits

Basic accounting should continue working without AI.

---

# 38. Cost Strategy

The initial product should target:

> **$0/month infrastructure where practical.**

Basic operations should depend primarily on:

```text
Telegram
Cloudflare Workers
Cloudflare D1
Cloudflare R2
Open-source libraries
```

AI should be an optional augmentation layer.

Preferred processing order:

```text
Rule-Based Parser
       ↓
Successful?
 ├── YES → Continue
 └── NO
       ↓
AI Parser
```

This minimizes AI usage and preserves functionality during AI outages.

---

# 39. Security Requirements

Mandatory:

- Server-side authorization
- Strong tenant isolation
- Telegram identity verification
- Input validation
- SQL parameterization
- Secrets stored securely
- No frontend API secrets
- No direct client database access
- Rate limiting
- Webhook security
- Audit logging
- Idempotent transaction processing

---

# 40. Privacy Requirements

The system must minimize stored personal information.

Only necessary user information should be stored.

Financial information must not be exposed across unrelated:

```text
Organizations
Groups
Funds
```

Users should only access data permitted by their membership and role.

---

# 41. Audit System

Every financial mutation must produce an audit record.

Example:

```text
Actor:
Adnan

Action:
CREATE_TRANSACTION

Fund:
FVMAS-16 General Fund

Transaction:
TX-18291

Amount:
৳300

Source:
Telegram

Timestamp:
2026-10-01 16:30:21 +06:00
```

Audit records must be protected from ordinary member modification.

---

# 42. Error Handling

## Unauthorized action

```text
❌ Permission denied.

You do not have permission to modify this fund.
```

## Ambiguous transaction

```text
⚠️ I need more information.

Which Murad?
1. Murad Hasan
2. Murad Rahman
```

## AI failure

```text
⚠️ I couldn't reliably understand this transaction.

Try:
"Add 100 taka contribution from Murad."
```

## Database failure

```text
⚠️ The fund was not updated.

No transaction was recorded.
Please try again.
```

The bot must never claim success unless the database operation actually succeeds.

---

# 43. Multi-Fund Context

A user may belong to multiple funds.

Example:

```text
FVMAS-16
├── General Fund
├── Tour Fund
└── Event Fund
```

The bot must maintain an active context where appropriate.

Example:

```text
/currentfund
```

Response:

```text
Current Fund:
FVMAS-16 General Fund
```

Users can change context:

```text
/switchfund
```

This reduces accidental posting into the wrong fund.

---

# 44. Financial Safety Rules

The backend must validate:

- Amount is valid
- Currency is valid
- Member exists
- Fund exists
- Member belongs to the permitted scope
- Transaction type is valid
- User has permission
- Date is valid
- Transaction is not duplicated

The system must reject invalid data before commit.

---

# 45. Scalability Model

Initial deployment:

```text
1 Room
4–10 Members
1 Fund
```

Next:

```text
1 Batch
~75 Members
Multiple Funds
```

Later:

```text
University
Thousands of Users
Hundreds of Groups
Hundreds/Thousands of Funds
```

Architecture must allow this progression without replacing the fundamental data model.

---

# 46. Performance Requirements

Target MVP:

- Telegram response for normal commands: <2 seconds where practical
- Database transaction processing: near-real-time
- Dashboard initial load: <3 seconds under normal conditions
- Report generation must not block normal transaction processing
- Large exports should run asynchronously

AI latency must not compromise transaction integrity.

---

# 47. Reliability Model

The following must be guaranteed:

```text
If commit succeeds:
    report success

If commit fails:
    report failure

If processing is uncertain:
    do not invent success
```

For financial operations:

> **Consistency is more important than conversational speed.**

---

# 48. Notifications

Future features may include:

- Low balance alerts
- Contribution reminders
- Monthly summary
- Expense alerts
- Treasurer notifications
- Pending approvals
- Monthly closing notification

Notifications must be configurable per fund/group.

---

# 49. Export

Authorized users should be able to export:

- CSV
- XLSX
- PDF report

Exports may include:

```text
Date
Transaction Type
Member
Amount
Category
Description
Created By
```

Export generation may be asynchronous for large datasets.

---

# 50. Future Advanced Features

## 50.1 Budgeting

```text
Monthly Grocery Budget
৳5,000

Spent
৳4,200

Remaining
৳800
```

## 50.2 Recurring Expenses

```text
Internet
৳1,000
Every Month
```

## 50.3 Contribution Targets

```text
Expected Monthly Contribution
৳500/member
```

## 50.4 Receipt OCR

User uploads receipt:

```text
Receipt
 ↓
OCR
 ↓
AI extraction
 ↓
Expense preview
 ↓
Admin confirmation
```

## 50.5 Financial Analytics

Examples:

- Monthly spending
- Per-member contributions
- Expense category trends
- Fund growth
- Spending anomalies

## 50.6 Multiple Currency Support

Future implementation:

```text
BDT
USD
EUR
INR
```

Each fund should have a default currency.

---

# 51. University-Scale Example

Potential future structure:

```text
Gazipur Agricultural University
│
├── FVMAS
│   ├── FVMAS-16
│   │   ├── General Fund
│   │   ├── Tour Fund
│   │   └── Event Fund
│   │
│   └── FVMAS-17
│
├── Faculty of Agriculture
│
├── Science Club
│   └── Event Fund
│
└── Hall Administration
    ├── Hall Fund
    ├── Room Groups
    └── Event Funds
```

The same platform can manage all of these independently.

---

# 52. Example End-to-End Flow

User:

> আজ Murad 100 টাকা দিল, Adnan 300 টাকা দিল। বাজারে 90 টাকা খরচ হয়েছে।

System:

```text
1. Identify Telegram user
2. Identify active fund
3. Verify user is Treasurer
4. Parse message
5. Resolve Murad
6. Resolve Adnan
7. Validate amounts
8. Create three ledger records atomically
9. Calculate updated balance
10. Write audit log
11. Return result
```

Bot:

```text
✅ Fund Updated

Contributions
• Murad     +৳100
• Adnan     +৳300

Expense
• Grocery   -৳90

Net Change: +৳310

Current Balance: ৳2,410
```

---

# 53. MVP Release Scope

## P0

- Telegram Bot
- User identity
- Organization
- Group
- Fund
- Membership
- Role-based permissions
- Contribution
- Expense
- Balance
- Transaction history
- AI natural-language parsing
- Deterministic calculations
- Audit logging
- Duplicate protection
- Atomic transaction processing

## P1

- Web Dashboard
- Charts
- Advanced filters
- Export
- Fund switching
- Transaction reversal
- Member management UI
- Telegram Mini App

## P2

- Scheduled reports
- Recurring expenses
- Budgeting
- Receipt OCR
- Multiple currencies
- Advanced analytics
- Notification engine

---

# 54. MVP Acceptance Criteria

### AC-01: Create Fund

An authorized user can create a fund under a group.

### AC-02: Member Access

A member can view permitted fund data but cannot modify transactions.

### AC-03: Authorized Contribution

A Treasurer can record a contribution through Telegram.

### AC-04: Natural Language

The system understands supported natural-language transaction messages.

### AC-05: Multiple Transactions

One message can generate multiple transactions atomically.

### AC-06: Accurate Balance

Balance is calculated from ledger records, never from AI output.

### AC-07: Duplicate Protection

Repeated Telegram updates cannot duplicate transactions.

### AC-08: Auditability

Every financial mutation has an associated audit record.

### AC-09: Tenant Isolation

Users cannot access unauthorized organizations/groups/funds.

### AC-10: AI Failure Safety

AI failure never creates an unvalidated transaction.

### AC-11: Database Failure Safety

A failed database transaction must never produce a successful transaction message.

### AC-12: Dashboard Consistency

Dashboard and Telegram must show the same authoritative financial data.

---

# 55. Definition of Done

The initial release is complete when:

- [ ] Telegram bot is deployed
- [ ] Organization model works
- [ ] Group model works
- [ ] Fund model works
- [ ] User membership works
- [ ] Role-based authorization works
- [ ] Contribution works
- [ ] Expense works
- [ ] Natural-language parsing works
- [ ] Database calculations are deterministic
- [ ] Audit logging works
- [ ] Duplicate updates are prevented
- [ ] Transactions are atomic
- [ ] Member read-only restrictions work
- [ ] Basic reporting works
- [ ] Web dashboard architecture is supported
- [ ] Secrets are secured
- [ ] AI cannot directly modify the database
- [ ] Cross-organization data leakage is prevented

---

# 56. Architectural Principles

The following principles are mandatory.

### Principle 1
**D1 is the authoritative financial source of truth.**

### Principle 2
**Turso is optional and secondary, never co-authoritative.**

### Principle 3
**AI interprets; backend authorizes and decides; database records.**

### Principle 4
**Room is a use-case, not the foundational data model.**

### Principle 5
**Users may have different roles in different groups and funds.**

### Principle 6
**Financial records should be auditable rather than destructively editable.**

### Principle 7
**Telegram is the default interface; Dashboard is the power interface.**

### Principle 8
**Routine financial operations should remain possible even when AI is unavailable.**

### Principle 9
**The architecture must support one room today and a university tomorrow.**

---

# 57. Product Definition

Fund Management is not merely a "room expense bot".

It is a:

> **Multi-tenant, AI-assisted financial ledger and fund-management platform for organized communities.**

The first implementation may manage:

```text
Room Fund
```

The same infrastructure should later support:

```text
Batch Fund
Club Fund
Department Fund
Hall Fund
Event Fund
Organization Fund
University Fund
```

The product should therefore be designed from day one around:

```text
Organization
     ↓
Group
     ↓
Fund
     ↓
Members
     ↓
Transactions
     ↓
Reports
```

with Telegram as the primary interface and the Web Dashboard as an optional but fully supported management layer.

---

# 58. Product Mantra

> **Simple to use. Strict with money. Transparent by design.**