# Build Plan: Fund Management Platform

> [!IMPORTANT]
> This is the living build plan. Update status fields as features complete. Never delete rows, mark them ✅ Done.

---

## Phases Overview

| Phase | Name | Target | Status |
|-------|------|--------|--------|
| 0 | Foundation & Scaffold | Week 1 | 🔲 Not Started |
| 1 | Auth & Tenant Setup | Week 2 | 🔲 Not Started |
| 2 | Fund & Investor Core | Week 3 to 4 | 🔲 Not Started |
| 3 | Transactions Engine | Week 5 to 6 | 🔲 Not Started |
| 4 | Reporting & Documents | Week 7 to 8 | 🔲 Not Started |
| 5 | Admin & Configuration | Week 9 | 🔲 Not Started |
| 6 | Polish, QA & Launch | Week 10 | 🔲 Not Started |

---

## Phase 0: Foundation & Scaffold

- [ ] Initialize Next.js 14 project (App Router)
- [ ] Configure TypeScript strict mode
- [ ] Setup Tailwind CSS and shadcn/ui
- [ ] Configure ESLint and Prettier (code standards)
- [ ] Setup Cloudflare Pages deployment pipeline
- [ ] Configure environment variables (.env structure)
- [ ] Initialize PostgreSQL schema (Drizzle ORM)
- [ ] Setup Sentry error monitoring
- [ ] Create `/context` folder and all documentation files
- [ ] Configure `.agents` folder with plugins

---

## Phase 1: Auth & Tenant Setup

- [ ] Integrate Clerk authentication
- [ ] Implement organization (tenant) creation flow
- [ ] Configure RBAC roles: `super_admin`, `fund_manager`, `analyst`, `investor`, `read_only`
- [ ] Build sign in and sign up pages
- [ ] Implement middleware level auth guards
- [ ] Create user invitation flow
- [ ] Build user management UI (admin)

---

## Phase 2: Fund & Investor Core

- [ ] Fund CRUD (create, edit, archive)
- [ ] Fund detail page (overview, metrics, share classes)
- [ ] Share class management (A, B, C classes)
- [ ] NAV calculation engine
- [ ] Investor profile creation and KYC status tracking
- [ ] Capital account setup per investor per fund
- [ ] Fund dashboard with key metrics

---

## Phase 3: Transactions Engine

- [ ] Subscription flow (investor buys into fund)
- [ ] Redemption flow (investor exits fund)
- [ ] Internal transfer between share classes
- [ ] Transaction approval workflow (maker checker pattern)
- [ ] Transaction ledger and audit trail
- [ ] Batch processing for NAV update events

---

## Phase 4: Reporting & Documents

- [ ] Monthly statement generation (PDF)
- [ ] Capital account statement per investor
- [ ] Fund performance report
- [ ] Document upload and storage (R2)
- [ ] Document versioning and access control
- [ ] Regulatory export formats (CSV, XML)

---

## Phase 5: Admin & Configuration

- [ ] Platform admin dashboard
- [ ] Fee configuration (management fee, performance fee)
- [ ] Notification preferences
- [ ] Webhook configuration for integrations
- [ ] Audit log viewer
- [ ] System health monitoring dashboard

---

## Phase 6: Polish, QA & Launch

- [ ] End to end testing (Playwright)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Core Web Vitals)
- [ ] Security review and penetration testing
- [ ] Staging environment sign off
- [ ] Production deployment
- [ ] Runbook documentation

---

## Current Sprint

**Sprint:** Pre Sprint 0
**Focus:** Setup, scaffolding, and documentation

| Task | Owner | Status |
|------|-------|--------|
| Create context folder | Unassigned | 🔲 |
| Setup Next.js project | Unassigned | 🔲 |
| Configure Cloudflare Pages | Unassigned | 🔲 |

---

*Last updated: 2026-10-01*
