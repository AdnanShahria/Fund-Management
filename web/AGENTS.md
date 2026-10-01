# Web Dashboard and Telegram Mini App

Next.js web application providing the room fund dashboard, real time ledger, member management, and CSV export. Functions standalone or embedded as a Telegram Mini App.

## Stack
- Next.js 14 App Router
- React 18
- Tailwind CSS
- Drizzle ORM
- Decimal.js for exact financial math

## Commands
- `npm run dev`: start Next.js dev server on http://localhost:3002
- `npm run build`: compile production build
- `npx tsc --noEmit`: verify TypeScript types

## Key files
- `app/page.tsx`: primary interactive room fund dashboard with ledger table, summary metrics, and record modal
- `app/layout.tsx`: root layout with Inter font and Telegram WebApp SDK script
- `app/api/funds/[id]/route.ts`: fund balance and reserve metrics endpoint
- `app/api/transactions/route.ts`: ledger transactions listing and creation endpoint
- `app/api/members/route.ts`: member roster and registration endpoint
- `app/api/export/route.ts`: CSV ledger download endpoint
- `lib/db/schema/`: Drizzle ORM schema for users, groups, funds, memberships, transactions, audit logs
- `lib/telegram/useTelegramWebApp.ts`: client hook for Telegram Mini App detection, user profile, and haptics
