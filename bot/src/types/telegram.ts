/**
 * Telegram Bot API types (minimal subset needed for this bot).
 * Full type reference: https://core.telegram.org/bots/api
 */

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// ── Outgoing API response types ────────────────────────────────────────────

export interface SendMessagePayload {
  chat_id: number;
  text: string;
  parse_mode?: "Markdown" | "HTML" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}
