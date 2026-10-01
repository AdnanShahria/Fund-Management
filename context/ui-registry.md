# UI Registry: Fund Management Platform

> [!NOTE]
> This is the canonical registry of all UI components. Before building a new component, check if it exists here. Every new component must be registered here upon creation.

---

## Registry Status

| Symbol | Meaning |
|--------|---------|
| ✅ Built | Component exists and is production ready |
| 🔄 WIP | Currently being built |
| 📋 Planned | In design and planning phase |
| 🔲 Not Started | Identified but not started |

---

## shadcn/ui Primitives (Base Layer)

These live in `components/ui/`, installed via shadcn CLI. **Never modify directly.**

| Component | Status | Import Path |
|-----------|--------|-------------|
| `Button` | 🔲 | `@/components/ui/button` |
| `Card` | 🔲 | `@/components/ui/card` |
| `Dialog` | 🔲 | `@/components/ui/dialog` |
| `DropdownMenu` | 🔲 | `@/components/ui/dropdown-menu` |
| `Form` | 🔲 | `@/components/ui/form` |
| `Input` | 🔲 | `@/components/ui/input` |
| `Label` | 🔲 | `@/components/ui/label` |
| `Select` | 🔲 | `@/components/ui/select` |
| `Sheet` | 🔲 | `@/components/ui/sheet` |
| `Table` | 🔲 | `@/components/ui/table` |
| `Tabs` | 🔲 | `@/components/ui/tabs` |
| `Toast` | 🔲 | `@/components/ui/toast` |
| `Tooltip` | 🔲 | `@/components/ui/tooltip` |
| `Badge` | 🔲 | `@/components/ui/badge` |
| `Separator` | 🔲 | `@/components/ui/separator` |
| `Skeleton` | 🔲 | `@/components/ui/skeleton` |
| `Avatar` | 🔲 | `@/components/ui/avatar` |
| `Command` | 🔲 | `@/components/ui/command` |
| `Popover` | 🔲 | `@/components/ui/popover` |
| `Calendar` | 🔲 | `@/components/ui/calendar` |

---

## Layout Components

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `AppShell` | `components/layout/AppShell.tsx` | Root app layout with sidebar and topbar | 🔲 |
| `Sidebar` | `components/layout/Sidebar.tsx` | Main navigation sidebar | 🔲 |
| `TopBar` | `components/layout/TopBar.tsx` | Top navigation with org switcher | 🔲 |
| `PageHeader` | `components/layout/PageHeader.tsx` | Page title, breadcrumb, and actions | 🔲 |
| `EmptyState` | `components/layout/EmptyState.tsx` | Zero state illustration plus CTA | 🔲 |
| `DataContainer` | `components/layout/DataContainer.tsx` | Loading, error, and empty wrapper | 🔲 |

---

## Fund Components

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `FundCard` | `components/funds/FundCard.tsx` | Fund summary card for grid view | 🔲 |
| `FundTable` | `components/funds/FundTable.tsx` | Sortable fund list table | 🔲 |
| `FundStatusBadge` | `components/funds/FundStatusBadge.tsx` | Active, Closed, or Suspended badge | 🔲 |
| `FundMetricsBar` | `components/funds/FundMetricsBar.tsx` | AUM, NAV, and investor count bar | 🔲 |
| `CreateFundDialog` | `components/funds/CreateFundDialog.tsx` | Fund creation modal or sheet | 🔲 |
| `NAVHistoryChart` | `components/funds/NAVHistoryChart.tsx` | Recharts line chart for NAV history | 🔲 |
| `ShareClassTable` | `components/funds/ShareClassTable.tsx` | Share class breakdown table | 🔲 |

---

## Investor Components

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `InvestorCard` | `components/investors/InvestorCard.tsx` | Investor profile summary card | 🔲 |
| `InvestorTable` | `components/investors/InvestorTable.tsx` | Investor list with search and filter | 🔲 |
| `KYCStatusBadge` | `components/investors/KYCStatusBadge.tsx` | KYC status indicator | 🔲 |
| `CapitalAccountTable` | `components/investors/CapitalAccountTable.tsx` | Capital positions per fund | 🔲 |
| `InviteInvestorDialog` | `components/investors/InviteInvestorDialog.tsx` | Investor invitation flow | 🔲 |

---

## Transaction Components

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `TransactionTable` | `components/transactions/TransactionTable.tsx` | Filterable transaction ledger | 🔲 |
| `TransactionTypeBadge` | `components/transactions/TransactionTypeBadge.tsx` | Subscription, Redemption, or Transfer badge | 🔲 |
| `SubscriptionForm` | `components/transactions/SubscriptionForm.tsx` | Subscription entry form | 🔲 |
| `RedemptionForm` | `components/transactions/RedemptionForm.tsx` | Redemption entry form | 🔲 |
| `ApprovalWorkflow` | `components/transactions/ApprovalWorkflow.tsx` | Maker checker approval UI | 🔲 |

---

## Reporting & Charts

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `PerformanceChart` | `components/reporting/PerformanceChart.tsx` | Fund performance line chart | 🔲 |
| `AUMBreakdownChart` | `components/reporting/AUMBreakdownChart.tsx` | Pie or donut chart for AUM distribution | 🔲 |
| `StatementCard` | `components/reporting/StatementCard.tsx` | Statement download card | 🔲 |
| `ReportExportButton` | `components/reporting/ReportExportButton.tsx` | Export to PDF, CSV, or XML | 🔲 |

---

## Common & Shared

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `CurrencyDisplay` | `components/common/CurrencyDisplay.tsx` | Formatted currency amount | 🔲 |
| `PercentageDisplay` | `components/common/PercentageDisplay.tsx` | Formatted percentage | 🔲 |
| `DateDisplay` | `components/common/DateDisplay.tsx` | Formatted date with timezone | 🔲 |
| `SearchInput` | `components/common/SearchInput.tsx` | Debounced search input | 🔲 |
| `DataTable` | `components/common/DataTable.tsx` | Reusable TanStack Table wrapper | 🔲 |
| `ConfirmDialog` | `components/common/ConfirmDialog.tsx` | Confirmation dialog with action | 🔲 |
| `FileUploadZone` | `components/common/FileUploadZone.tsx` | Drag and drop file uploader | 🔲 |
| `LoadingSpinner` | `components/common/LoadingSpinner.tsx` | Branded loading indicator | 🔲 |

---

*Last updated: 2026-10-01*
