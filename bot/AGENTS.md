# Telegram Bot Worker

Cloudflare Worker handling Telegram webhooks, rule parsing, AI intent interpretation, and Cloudflare D1 ledger queries.

## Stack
- Cloudflare Workers
- Hono web framework
- Cloudflare D1 (SQLite) authoritative ledger
- Zod schema validation
- Workers AI and Gemini API natural language fallback

## Commands
- `npm run dev`: start local wrangler dev server
- `npm run type-check`: verify TypeScript types (tsc --noEmit)
- `npm run deploy`: deploy worker to Cloudflare

## Key files
- `src/index.ts`: Hono app, health check, webhook endpoint with idempotency checks
- `src/handlers/message.ts`: command routing, group bootstrap, treasurer authorization, ledger insertions, audit logging
- `src/lib/parser.ts`: zero cost rule parser for Telegram commands and natural language
- `src/lib/ai-parser.ts`: conversational AI fallback using Workers AI or Gemini API
- `src/lib/telegram.ts`: Telegram Bot API wrapper, currency formatting in Bangladeshi Taka
