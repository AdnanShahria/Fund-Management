# Financial Records Blueprint and Web Dashboard Data Specifications

## Executive Summary

Proper financial record keeping demands exactness, transparency, traceability, and consistency. When examining leading financial platforms across personal finance, small business accounting, and shared group funds, universal standards emerge. Money must be tracked from source to destination with zero ambiguity. Every entry must record who, what, when, where, how, and why.

This document records the core data requirements gathered from industry platforms. It maps them directly to the Fund Management web dashboard architecture.

---

## 1. Industry Platforms Analyzed

We analyzed four distinct categories of financial record keeping systems:

1. Small business accounting and general ledgers (QuickBooks, Xero, Wave Accounting, Zoho Books, FreshBooks, GNU Cash)
   Key focus: Double entry integrity, Chart of Accounts, audit trails, payment reconciliations, invoice and receipt tracking, vendor records.

2. Group funds and shared living platforms (Splitwise, Tricount, OpenCollective, Expensify)
   Key focus: Member quotas, split allocations, group transparency, fair share calculations, reimbursement tracking, public ledger views.

3. Modern personal and wealth tracking applications (Monarch Money, YNAB, Copilot, Quicken)
   Key focus: Category budgets, cash flow trends, burn rate, account balances, monthly cycle reporting.

4. Regional digital payment systems in Bangladesh (bKash, Nagad, Rocket, Bank Transfers via BEFTN and NPSB)
   Key focus: Mobile Financial Service transaction IDs, cash out fee deductions, sender and receiver account numbers, counter cash slips.

---

## 2. Essential Financial Record Data Points

From this analysis, every proper financial record system relies on eight core data clusters:

### Cluster A: Identification and Ledger Sequence
Every transaction requires an immutable fingerprint:
- Transaction Unique ID: Global UUID for database indexing.
- Voucher or Sequence Number: Human readable sequential reference, such as VCH-2026-0042 or TX-302-0105.
- Idempotency Key: Telegram message identifier or client request token to block accidental duplicate submissions.
- Ledger Sequence Number: Monotonically increasing number within a fund to guarantee strict ordering.

### Cluster B: Temporal Data (Dates and Times)
- Transaction Date: The calendar date and time when the economic activity actually occurred.
- Accounting Date: The date when the record is officially recognized in the ledger.
- Creation Timestamp: System clock timestamp when the record was written to the database.
- Last Modified Timestamp: System clock timestamp when any metadata was amended.

### Cluster C: Quantitative and Monetary Values
Financial precision is non negotiable:
- Direction: Inflow (credit to fund) versus Outflow (debit from fund).
- Gross Amount: Total face value of the transaction.
- Fee and Surcharge: Payment gateway fees, MFS cash out charges (such as the 1.85 percent bKash charge), or bank fees.
- Net Amount: The actual balance change applied to the fund cash box or account.
- Currency Code: Standard ISO-4217 code (BDT for Bangladeshi Taka, with symbol ৳).
- Precision Storage: Represented strictly as integer paisa (1 Taka equals 100 paisa) to eliminate floating point rounding drift.

### Cluster D: Counterparties and Attribution
- Transaction Type:
  - CONTRIBUTION: Member deposit or dues payment.
  - EXPENSE: Fund disbursement for bills, groceries, or services.
  - REFUND: Money returned to the fund or back to a member.
  - TRANSFER: Movement of funds between two accounts or two funds (for example, General Fund to Tour Fund).
  - ADJUSTMENT: Reconciled correction of cash box variance.
  - REVERSAL: Formal voiding of an erroneous entry.
- Payer or Contributor: The individual member who deposited the money.
- Payee or Vendor: The store, merchant, utility board, or person receiving the payment.
- Recorded By: The authenticated treasurer or admin who logged the transaction.
- Approved or Verified By: Optional secondary approval for high value disbursements.

### Cluster E: Payment Method and Settlement Rails
- Payment Method:
  - CASH: Physical currency in the room cash box or safe.
  - BKASH: Mobile financial service transfer.
  - NAGAD: Mobile financial service transfer.
  - ROCKET: Mobile financial service transfer.
  - BANK TRANSFER: Commercial bank account transfer.
  - CARD: Debit or credit card payment.
  - PETTY CASH: Emergency small cash fund.
- Payment Reference or TrxID: MFS transaction ID (for example, BLA892KJ12), bank cheque number, or bank deposit slip number.
- Account Identification: Target account (such as Room 302 Petty Cash Box versus Treasurer Personal bKash).

### Cluster F: Classification and Purpose
- Fund Allocation: The specific fund bucket (such as General Fund, Meal Fund, Tour Fund, Emergency Reserve).
- Primary Category:
  - Food and Groceries (bazaar, rice, oil, spices, snacks)
  - Utilities and Internet (electricity bill, gas, Wi-Fi broadband)
  - Housing and Rent (hostel fees, room rent, cook salary)
  - Cleaning and Maintenance (cleaning supplies, bulb replacement, repairs)
  - Transport and Logistics (rickshaw, bus, delivery fees)
  - Social and Events (room feast, sports, celebrations)
  - Medical and Emergency (first aid, medicine)
  - Miscellaneous (printing, photocopy, stationery)
- Subcategory: Specific item classification within the primary category.
- Description and Narrative: Plain language explanation of the transaction.
- Tags: Flexible grouping tags (such as #ramadan-2026, #tour-sylhet, #renovation).

### Cluster G: Evidence and Auditability
- Receipt Attachment: Secure URL to receipt photo, cash memo, or invoice.
- Receipt Number: Physical invoice or cash memo number printed on the paper receipt.
- Status Lifecycle:
  - COMPLETED: Settled and active in ledger calculations.
  - PENDING: Awaiting confirmation or bank settlement.
  - REVERSED: Voided by a subsequent compensating transaction.
- Reversal Link: Reference pointing to the original transaction ID if voided, plus recorded reason.
- Audit Log: Immutable history tracking who created, verified, or voided the record with timestamps.

### Cluster H: Member Quota and Settlement Accounts
For room, batch, and club funds, tracking aggregate money is only half the job. The system must also track individual member standings:
- Member Billing Cycle: Monthly, weekly, or event based cycle.
- Target Quota: Standard expected contribution per member (such as ৳2,500 per month).
- Actual Contributed: Cumulative amount paid by the member for the active period.
- Outstanding Balance: Dues owed or surplus prepaid credit.
- Payment Status: PAID, PARTIAL, OVERDUE, EXEMPT.

---

## 3. Comparison of Current Schema with Full Financial Standard

| Financial Capability | Current D1 Schema | Required Full Standard | Recommended Action |
| :--- | :--- | :--- | :--- |
| Monetary Storage | Integer paisa (`amountPaisa`) | Integer paisa (`amountPaisa`) | Maintain existing standard |
| Transaction Types | Contribution, Expense, Refund, Correction, Reversal | + Transfer between funds, Opening balance | Add TRANSFER to transaction types |
| Payment Method | Missing (only source: Telegram, Web) | Cash, bKash, Nagad, Bank, Card | Add paymentMethod column |
| Transaction Ref or TrxID | Missing | MFS TrxID, Bank ref, Cheque number | Add referenceId column |
| Vendor or Payee | Category only, payee string absent | Store, Merchant, Landlord name | Add payeeName column |
| Receipt Document | Missing | Image URL or Cloudflare R2 key | Add receiptUrl column |
| Payment Fees | Stored inside gross amount | Split into net amount and fee paisa | Add feePaisa column |
| Member Monthly Dues | Computed from sum of contributions | Target budget per member, due date | Add target quota to funds and memberships |
| Fund Transfers | Not represented | Two linked ledger entries | Support cross fund transfers |

---

## 4. Web Dashboard Functional Architecture

To deliver a finance grade experience that wows users and ensures clarity, the dashboard provides five primary interactive modules:

1. Fund Financial Health Header
   Real time available balance with instant cash flow indicator.
   Monthly burn rate and average daily expenditure.
   Reserve target comparison.

2. Visual Analytical Breakdowns
   Expense distribution breakdown by category (Groceries, Utilities, Rent, Dining, Transport).
   Monthly cash flow trajectory showing inflow versus outflow across preceding months.
   Budget burn gauge showing percentage of expected monthly budget consumed.

3. Member Financial Accountability Roster
   Each member card showing assigned monthly contribution goal.
   Clear status indicator: Fully Paid, Partially Paid, or Pending Dues.
   One click prompt to generate Telegram reminder messages.

4. High Density Master Ledger Table
   Searchable and filterable table of all financial events.
   Inline transaction receipt preview.
   Detailed voucher view showing payment method, MFS transaction ID, creator, and audit log.
   Export to CSV and printable financial report.

5. Comprehensive Record Entry Modal
   Supports both Contribution and Expense recording.
   Captures amount, date, member or vendor, category, payment method (Cash, bKash, Nagad, Bank), TrxID, note, and receipt.
