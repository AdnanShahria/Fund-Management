# Cloudflare Deployment Guide

This guide walks you through deploying FundBot and the Room Fund Manager to Cloudflare.

The architecture runs at zero monthly cost on Cloudflare free tiers:
1. Cloudflare Workers for the Telegram Bot backend
2. Cloudflare D1 for the serverless SQL ledger
3. Cloudflare Pages for the Next.js web dashboard and Telegram Mini App

---

## Prerequisites

1. Cloudflare account and Wrangler CLI installed
2. Telegram Bot Token from @BotFather on Telegram

---

## Step 1: Create the Cloudflare D1 Database

Run this command inside the project root:

```bash
cd bot
npx wrangler d1 create fund-db
```

Wrangler prints your database details, including your `database_id`.
Copy the `database_id` and paste it into `bot/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "fund-db"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

---

## Step 2: Apply the Database Migration

Run the migration script to create all 8 tables and indexes in your D1 database:

```bash
npx wrangler d1 execute fund-db --file=migrations/0001_room_fund_schema.sql
```

Optional: To load initial demonstration data for Room 302, run:

```bash
npx wrangler d1 execute fund-db --file=migrations/seed.sql
```

---

## Step 3: Set Secrets

Store your Telegram Bot token securely using Wrangler:

```bash
npx wrangler secret put BOT_TOKEN
```

When prompted, paste your bot token from @BotFather.

Optional: To use NVIDIA NIM for high accuracy Bengali and natural language message parsing:

```bash
npx wrangler secret put NVIDIA_API_KEY
```

When prompted, paste your NVIDIA NIM API key.

Optional: If you want to use the Gemini API fallback parser for conversational messages:

```bash
npx wrangler secret put GEMINI_API_KEY
```

---

## Step 4: Deploy the Telegram Bot Worker

Deploy the bot worker to Cloudflare:

```bash
npx wrangler deploy
```

Wrangler gives you your worker URL, such as:
`https://fund-bot.<your-subdomain>.workers.dev`

---

## Step 5: Register the Telegram Webhook

Point Telegram to your newly deployed worker webhook endpoint:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://fund-bot.<your-subdomain>.workers.dev/webhook"
```

Telegram will respond with:

```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

Your bot is now live! Send `/start` or `/balance` in any Telegram group to test it.

---

## Step 6: Deploy the Web Dashboard & Telegram Mini App

The web dashboard is ready to deploy to Cloudflare Pages or Vercel:

```bash
cd ../web
npm run build
```

To connect the web dashboard inside Telegram as a Mini App button:
1. Set `DASHBOARD_URL = "https://your-dashboard.pages.dev"` in `bot/wrangler.toml` under `[vars]`.
2. Redeploy the bot with `npx wrangler deploy`.
3. In Telegram, `/start`, `/balance`, and `/summary` will now include an inline button labeled `Open Room Dashboard` that opens the dashboard right inside Telegram.
