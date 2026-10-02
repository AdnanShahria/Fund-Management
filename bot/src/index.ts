import { Hono } from "hono";
import type { Env } from "./types/env";
import type { TelegramUpdate } from "./types/telegram";
import { handleMessage } from "./handlers/message";
import { ruleBasedParse } from "./lib/parser";
import { aiParse } from "./lib/ai-parser";

const app = new Hono<{ Bindings: Env }>();

/**
 * Health check to confirm the worker is alive.
 */
app.get("/", (c) => c.json({ ok: true, service: "FundBot", version: "0.1.0" }));

/**
 * Diagnostic query endpoint to verify rule parser and AI parser output.
 */
app.get("/test-query", async (c) => {
  const q = c.req.query("q") || "dashboard link?";
  const rule = ruleBasedParse(q);
  let aiError: string | null = null;
  let rawAi: any = null;
  let modelOutput: string | null = null;

  if (c.env.AI) {
    try {
      rawAi = await c.env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
        messages: [
          { role: "system", content: "You are OrbitFundBot. Reply warmly in plain text." },
          { role: "user", content: q },
        ],
        max_tokens: 150,
      });
      modelOutput = rawAi?.response || rawAi?.choices?.[0]?.message?.content || null;
    } catch (e: any) {
      aiError = e?.message || String(e);
    }
  }

  const ai = rule ? null : await aiParse(q, c.env);
  return c.json({ q, rule, ai, hasAI: !!c.env.AI, aiError, modelOutput });
});

/**
 * Telegram webhook endpoint.
 *
 * Telegram sends a POST to this URL for every incoming update.
 * Register it once with:
 *
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.workers.dev/webhook"
 *
 * Idempotency: we record processed (chat_id, message_id) pairs in D1
 * before processing so duplicate webhook deliveries are ignored.
 */
app.post("/webhook", async (c) => {
  const env = c.env;

  // Respond 200 immediately — Telegram will retry if we are slow.
  // We process asynchronously using waitUntil so the response is not blocked.
  const update: TelegramUpdate = await c.req.json();

  c.executionCtx.waitUntil(processUpdate(update, env));

  return c.json({ ok: true });
});

async function processUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  try {
    if (update.message) {
      const msg = update.message;

      // ── Idempotency check ─────────────────────────────────────────────
      const chatId = String(msg.chat.id);
      const messageId = String(msg.message_id);

      const existing = await env.DB.prepare(
        `SELECT id FROM telegram_updates
         WHERE telegram_chat_id = ? AND telegram_message_id = ?`
      )
        .bind(chatId, messageId)
        .first<{ id: string }>();

      if (existing) {
        console.log(`Duplicate update skipped: chat=${chatId} msg=${messageId}`);
        return;
      }

      // Mark as seen before processing to prevent concurrent duplicates
      await env.DB.prepare(
        `INSERT INTO telegram_updates (id, telegram_chat_id, telegram_message_id, telegram_update_id, processed_at)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(
          crypto.randomUUID(),
          chatId,
          messageId,
          String(update.update_id),
          Math.floor(Date.now() / 1000)
        )
        .run();

      await handleMessage(msg, env);
    }

    // TODO: handle callback_query for inline button responses (confirmations)
  } catch (err) {
    console.error("processUpdate error:", err);
  }
}

export default app;
