# Cloudflare Deployment Guide

This guide walks you through deploying FundBot and the Fund Management web application to Cloudflare.

The complete architecture runs at zero monthly cost on Cloudflare free tiers:
1. Cloudflare Workers for the Telegram Bot backend
2. Cloudflare D1 for the serverless SQL ledger
3. Cloudflare Pages for the Next.js web application (public user side dashboard and hidden admin panel)

## Prerequisites

1. Cloudflare account and Wrangler CLI installed
2. Telegram Bot Token from @BotFather on Telegram

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

## Step 2: Apply the Database Migration

Run the migration script to create all 8 tables and indexes in your D1 database:

```bash
npx wrangler d1 execute fund-db --file=migrations/0001_room_fund_schema.sql
```

Optional: To load initial demonstration data for Room 302, run:

```bash
npx wrangler d1 execute fund-db --file=migrations/seed.sql
```

## Step 3: Set Secrets from Environment

Store your secrets securely using Wrangler:

```bash
npx wrangler secret put BOT_TOKEN
```

When prompted, paste your bot token from @BotFather.

Set the web synchronization key so the bot can securely talk to the web API endpoints:

```bash
npx wrangler secret put BOT_API_KEY
```

Set the web application URL (once deployed on Cloudflare Pages):

```bash
npx wrangler secret put WEB_API_URL
```

When prompted, paste your Cloudflare Pages URL, for example `https://orbit-fund-management.pages.dev`.

Optional: To use NVIDIA NIM for high accuracy Bengali and natural language message parsing:

```bash
npx wrangler secret put NVIDIA_API_KEY
```

When prompted, paste your NVIDIA NIM API key.

Optional: If you want to use the Gemini API fallback parser for conversational messages:

```bash
npx wrangler secret put GEMINI_API_KEY
```

## Step 4: Deploy the Telegram Bot Worker

Deploy the bot worker to Cloudflare:

```bash
npx wrangler deploy
```

Wrangler gives you your worker URL, such as:
`https://fund-bot.<your-subdomain>.workers.dev`

## Step 5: Register the Telegram Webhook

Point Telegram to your newly deployed worker webhook endpoint:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://fund-bot.<your-subdomain>.workers.dev/webhook"
```

Telegram will respond with:

```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

Your bot is now live. Send `/start` or `/balance` in any Telegram group to test it.

## Step 6: Deploy the Web Application on Cloudflare Pages

The web application contains two surfaces:
1. Public User Side (`/`): A read only financial dashboard for room members and batch participants.
2. Hidden Admin Panel (`/admin`): A password protected administrative control center to toggle between Room Fund and Batch Fund, configure budgets, record entries, manage members, and reverse mistakes.

### Option A: Deploy via Cloudflare Dashboard (GitHub Integration)

1. Log in to your Cloudflare dashboard and go to Workers & Pages.
2. Click Create application, select the Pages tab, and choose Connect to Git.
3. Select your repository.
4. Configure Build settings:
   Root directory: `web`
   Framework preset: `Next.js`
   Build command: `npm run build`
   Build output directory: `.next`
5. Configure Environment Variables in the Cloudflare Pages settings:
   `ADMIN_SECRET_KEY`: Set your secret passkey used to unlock `/admin`.
   `BOT_API_KEY`: Set your shared secret key for the bot synchronization endpoints.
   `NEXT_PUBLIC_APP_NAME`: `Orbit Fund Management`
6. Click Save and Deploy.

### Option B: Deploy via Wrangler CLI

From the `web` directory, build and deploy directly:

```bash
cd web
npm run build
npx wrangler pages deploy .next
```

## Step 7: Access the Hidden Admin Panel

Once deployed, visit your Cloudflare Pages URL with `/admin`:

`https://your-app.pages.dev/admin`

1. Enter your `ADMIN_SECRET_KEY` passkey.
2. You can switch operating modes between Room Fund Management and Batch Fund Management with one click.
3. You can record manual contributions or expenditures directly, enroll members, and manage permissions.
4. The public at `https://your-app.pages.dev/` will only see the read only dashboard without administrative actions or mutation controls.
