/**
 * Cloudflare Worker environment bindings.
 * Every binding declared in wrangler.toml gets a typed property here.
 */
export interface Env {
  // D1 database (authoritative financial ledger)
  DB: D1Database;

  // Telegram Bot token from @BotFather, stored as a secret in env
  BOT_TOKEN: string;

  // Web API endpoint URL for remote fund ledger synchronization
  WEB_API_URL?: string;

  // Bot API Secret Key for authenticating against the Web API endpoints
  BOT_API_KEY?: string;

  // Optional Cloudflare Workers AI binding
  AI?: any;

  // Optional Gemini API Key for natural language understanding
  GEMINI_API_KEY?: string;

  // Optional NVIDIA NIM API Key for natural language understanding
  NVIDIA_API_KEY?: string;

  // Optional NVIDIA model override, defaults to meta/llama-3.2-11b-vision-instruct
  NVIDIA_MODEL?: string;

  // Optional Dashboard URL for Telegram Mini App button
  DASHBOARD_URL?: string;

  // Environment mode
  ENVIRONMENT: string;
}
