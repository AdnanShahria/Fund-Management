import type { Env } from "../types/env";
import type { SendMessagePayload } from "../types/telegram";

/**
 * Send a message back to a Telegram chat using the Bot API.
 *
 * @param chatId  The Telegram chat ID to send to.
 * @param text    The message text. Supports Markdown.
 * @param env     The worker environment (holds BOT_TOKEN).
 */
export async function sendMessage(
  chatId: number,
  text: string,
  env: Env,
  options: Partial<SendMessagePayload> = {}
): Promise<void> {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  const payload: SendMessagePayload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    ...options,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

/**
 * Format a paisa integer as a human readable taka string.
 * Amounts are stored as paisa (integer) throughout the system.
 *
 * Example: formatTaka(150000) → "৳1,500.00"
 */
export function formatTaka(paisa: number): string {
  const taka = paisa / 100;
  return `৳${taka.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse a taka string entered by the user into paisa.
 * Handles both integer and decimal input (e.g. "100", "100.50", "1000").
 * Returns null if the input is not a valid positive number.
 *
 * Note: We use string manipulation instead of floating point to avoid
 * rounding errors. The PRD requires integer paisa storage.
 */
export function parsePaisa(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [intPart, decPart = "0"] = cleaned.split(".");
  const paisa =
    parseInt(intPart ?? "0", 10) * 100 +
    parseInt(decPart.padEnd(2, "0").slice(0, 2), 10);

  return paisa > 0 ? paisa : null;
}
