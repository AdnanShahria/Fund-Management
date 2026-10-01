# Project Overview: Fund Management Platform

> [!NOTE]
> This is the north star document for the project. Read this first before working on any feature.

---

## Product Vision

Orbit Fund Management is a next generation SaaS platform for alternative investment fund managers. It provides a unified workspace for managing fund operations, from investor onboarding and capital account tracking to NAV calculations, transaction processing, and regulatory reporting.

**Target Users:**
- Fund Managers (primary operators)
- Fund Analysts (data entry and reporting)
- Investors (self service portal, read only)
- Compliance Officers (reporting and audit)
- Platform Admins (super admin operations)

---

## Problem Statement

Fund managers today rely on a fragmented mix of Excel spreadsheets, generic CRM tools, and expensive legacy fund administration software. This creates:

1. **Operational risk**: Manual data entry errors in NAV calculations
2. **Compliance risk**: Inconsistent investor reporting and audit trails
3. **Scalability limits**: Spreadsheets break down beyond 50 investors per fund
4. **Poor investor experience**: No self service portal for capital account statements

---

## Solution

A multi tenant, cloud native fund administration platform that:
- Automates NAV calculations and capital account updates
- Provides real time fund dashboards for managers and analysts
- Delivers a branded investor portal with statement downloads
- Generates regulatory grade reports (CSV, PDF, XML)
- Maintains a complete, immutable audit trail of all transactions

---

## Business Context

| Attribute | Value |
|-----------|-------|
| Product Name | Orbit Fund Management |
| Project Code | FM-001 |
| Product Stage | Pre MVP |
| Business Model | SaaS (per seat plus AUM based pricing) |
| Primary Market | Southeast Asia (SG, MY, ID) |
| Target ARR | TBD |

---

## Core Modules

| Module | Description | Priority |
|--------|-------------|----------|
| **Fund Management** | Fund CRUD, share classes, NAV | P0 |
| **Investor Management** | Profiles, KYC, capital accounts | P0 |
| **Transaction Engine** | Subscriptions, redemptions, transfers | P0 |
| **Reporting** | Statements, performance reports, exports | P1 |
| **Document Vault** | Upload, storage, versioning | P1 |
| **Investor Portal** | Self service investor dashboard | P1 |
| **Admin Console** | Tenant and platform config | P2 |
| **Notifications** | Email, in app, webhooks | P2 |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Onboard first fund | Week 4 |
| Process first subscription transaction | Week 6 |
| Generate first investor statement | Week 8 |
| 99.9% uptime SLA | Launch |
| Less than 2s page load (P95) | Launch |
| WCAG 2.1 AA compliance | Launch |

---

## Team & Contacts

| Role | Name | Contact |
|------|------|---------|
| Product Owner | TBD | Unassigned |
| Lead Engineer | TBD | Unassigned |
| Designer | TBD | Unassigned |
| QA | TBD | Unassigned |

---

## Related Documents

| Document | Location |
|----------|----------|
| PRD | [`/prd.md`](../prd.md) |
| Architecture | [`/context/architecture.md`](./architecture.md) |
| Build Plan | [`/context/build-plan.md`](./build-plan.md) |
| Code Standards | [`/context/codestandard.md`](./codestandard.md) |
| UI Rules | [`/context/ui-rules.md`](./ui-rules.md) |
| UI Tokens | [`/context/ui-tokens.md`](./ui-tokens.md) |
| Progress | [`/context/progress-tracker.md`](./progress-tracker.md) |

---

## Key Assumptions

1. Users are professionals, so prioritize power user features over simplicity
2. Data accuracy is critical, so all financial calculations use `Decimal.js`
3. Multi tenancy is a core requirement, so every database query must scope by `orgId`
4. The platform will undergo SOC 2 Type II audits in the future, so build with audit trails from day one
5. Regulatory requirements vary by jurisdiction, so the system must stay configurable

---

*Last updated: 2026-10-01*
