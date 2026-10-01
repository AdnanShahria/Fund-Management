/**
 * Cloudflare Worker environment bindings.
 * Each binding declared in wrangler.toml gets a typed property here.
 */
export interface Env {
  // D1 database — authoritative financial ledger
  DB: D1Database;

  // Telegram Bot token from @BotFather, stored as a secret
  BOT_TOKEN: string;

  // Optional Cloudflare Workers AI binding
  AI?: any;

  // Optional Gemini API Key for natural language understanding
  GEMINI_API_KEY?: string;

  // Environment mode
  ENVIRONMENT: string;
}
