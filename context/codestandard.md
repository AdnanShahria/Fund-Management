# Code Standards: Fund Management Platform

> [!IMPORTANT]
> Please follow these standards whenever you write code in this repository. Keeping code consistent helps everyone review and maintain the codebase.

---

## Language & Tooling

| Tool | Version | Config File |
|------|---------|------------|
| TypeScript | `5.x` (strict) | `tsconfig.json` |
| Node.js | `20.x LTS` | `.nvmrc` |
| Next.js | `14.x` (App Router) | `next.config.ts` |
| ESLint | `8.x` | `.eslintrc.json` |
| Prettier | `3.x` | `.prettierrc` |
| Drizzle ORM | latest | `drizzle.config.ts` |

---

## TypeScript Rules

```typescript
// ✅ Always use explicit return types on exported functions
export async function getFundById(id: string): Promise<Fund | null> { ... }

// ✅ Use Zod for runtime validation
const CreateFundSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.enum(['USD', 'EUR', 'GBP']),
});

// ❌ Never use any, use unknown and narrow
function processData(data: unknown): string { ... }

// ✅ Prefer type over interface for unions, interface for objects
type FundStatus = 'active' | 'closed' | 'suspended';
interface Fund { id: string; name: string; status: FundStatus; }
```

---

## File & Folder Naming

```
app/                         # Next.js App Router pages
  (auth)/                    # Route groups (parentheses = no URL segment)
  (dashboard)/
    funds/
      [fundId]/
        page.tsx             # kebab case for folders, PascalCase for components
components/
  ui/                        # shadcn/ui primitives (never edit directly)
  funds/
    FundCard.tsx             # PascalCase component files
    fund-card.stories.tsx    # kebab case for non component files
lib/
  funds/
    fund.service.ts          # kebab case service files
    fund.schema.ts           # Drizzle schema definitions
    fund.types.ts            # TypeScript types
```

---

## Component Conventions

```tsx
// ✅ Server Components by default (no "use client")
// ✅ Add "use client" only when interactivity is required

// Component file structure:
import { type FC } from 'react'
import type { Fund } from '@/lib/funds/fund.types'

interface FundCardProps {
  fund: Fund
  className?: string
}

export const FundCard: FC<FundCardProps> = ({ fund, className }) => {
  return (
    <div className={cn('...', className)}>
      {/* ... */}
    </div>
  )
}
```

---

## API Route Conventions

```typescript
// app/api/funds/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Always scope queries by orgId
  const funds = await db.query.funds.findMany({ where: eq(funds.orgId, orgId) })
  return NextResponse.json(funds)
}
```

---

## Database Conventions (Drizzle)

```typescript
// lib/db/schema/funds.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core'

export const funds = pgTable('funds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: varchar('org_id', { length: 255 }).notNull(),       // Tenant isolation
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

Rules:
- All tables must have `id` (UUID), `orgId`, `createdAt`, `updatedAt`
- Use snake_case for column names
- Always add `orgId` as a filter in every query for multi tenant isolation
- Use migrations, never `db.push` in production

---

## Error Handling

```typescript
// ✅ Use a Result type pattern for service functions
type Result<T> = { success: true; data: T } | { success: false; error: string }

// ✅ Never throw in API routes, return error responses
return NextResponse.json({ error: 'Fund not found' }, { status: 404 })

// ✅ Log errors to Sentry in catch blocks
import * as Sentry from '@sentry/nextjs'
catch (error) {
  Sentry.captureException(error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

---

## Import Order (enforced by ESLint)

```typescript
// 1. React/Next
import { useState } from 'react'
import { NextRequest } from 'next/server'

// 2. Third party
import { z } from 'zod'
import { eq } from 'drizzle-orm'

// 3. Internal aliases (@/)
import { db } from '@/lib/db'
import type { Fund } from '@/lib/funds/fund.types'

// 4. Relative
import { FundCard } from './FundCard'
```

---

## Commit Message Format

Follow [Conventional Commits](https://conventionalcommits.org):

```
feat(funds): add NAV calculation engine
fix(auth): resolve session expiry on edge middleware
chore(deps): upgrade Next.js to 14.2.x
docs(context): update architecture.md
```

---

*Last updated: 2026-10-01*
