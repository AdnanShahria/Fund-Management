import type { Env } from "../types/env";
import type { TelegramMessage, TelegramUser } from "../types/telegram";
import { sendMessage, formatTaka } from "../lib/telegram";
import { ruleBasedParse } from "../lib/parser";
import { aiParse } from "../lib/ai-parser";
import { fetchFundFromWebApi, postTransactionToWebApi } from "../lib/web-api";

/**
 * Group and fund context resolved from the Telegram chat ID.
 */
interface GroupFundContext {
  organizationId: string;
  groupId: string;
  fundId: string;
  groupName: string;
  fundName: string;
}

/**
 * Handle an incoming Telegram message.
 *
 * Flow per PRD:
 * 1. Parse intent using the rule parser (fast, zero AI cost)
 * 2. Resolve group and fund context from D1
 * 3. Verify user authorization if the action mutates ledger state
 * 4. Perform database mutations and write audit logs
 * 5. Return plain confirmation to the chat
 */
export async function handleMessage(msg: TelegramMessage, env: Env): Promise<void> {
  const chatId = msg.chat.id;
  const rawText = msg.text?.trim();

  if (!rawText) return;

  // In groups, Telegram sends commands as "/cmd@BotUsername".
  // Strip the @mention suffix so parsers receive clean text like "/cmd".
  // Also handle messages that start with @BotUsername (e.g. "@OrbitFundBot balance").
  const botUsername = env.BOT_USERNAME || "OrbitFundBot";
  const text = rawText
    .replace(new RegExp(`@${botUsername}`, "gi"), "")
    .trim();

  // In group/supergroup chats, only respond if:
  //   (a) the message begins with a / command, or
  //   (b) the original raw text mentioned @BotUsername
  //   (c) it is a private chat (DM)
  // This mirrors Telegram's group privacy mode behavior and prevents the bot
  // from cluttering groups by replying to every message.
  const isGroupChat = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const wasDirectlyAddressed =
    rawText.toLowerCase().includes(`@${botUsername.toLowerCase()}`) ||
    rawText.startsWith("/");

  if (isGroupChat && !wasDirectlyAddressed) {
    return; // Silently ignore — not addressed to this bot
  }

  if (!text) return;

  // 1. Parse intent: try fast rule parser first
  let intent = ruleBasedParse(text);

  // If rule parser fails, invoke the AI parser fallback
  if (!intent || intent.type === "UNKNOWN") {
    intent = await aiParse(text, env);
  }

  // Handle help, start, or conversational chat before group context lookup for instant response
  if (intent?.type === "START") {
    await handleStart(chatId, msg, env);
    return;
  }

  if (intent?.type === "HELP") {
    await handleHelp(chatId, env);
    return;
  }

  if (intent?.type === "CHAT") {
    let reply = intent.reply;
    if (/how many group/i.test(text) || /koyta group/i.test(text)) {
      try {
        const countRow = await env.DB.prepare(
          `SELECT COUNT(*) AS total FROM groups WHERE status = 'active'`
        ).first<{ total: number }>();
        const total = countRow?.total ?? 1;
        reply = `I am currently connected to ${total} group${total === 1 ? "" : "s"} in this ledger!\n\nYou can add me to any room, batch, or mess group to manage shared finances and view reports live on the web dashboard.`;
      } catch {
        // keep AI reply
      }
    }
    await sendMessage(chatId, reply, env, {
      message_thread_id: msg.message_thread_id,
      reply_markup: getDashboardMarkup(env),
    });
    return;
  }

  if (!intent || intent.type === "UNKNOWN") {
    await sendMessage(
      chatId,
      "I am here! You can tell me any expense (like \"bazar 450 tk\"), contribution (like \"Adnan gave 500 tk\"), ask for balance, or send /help to view all commands.",
      env,
      {
        message_thread_id: msg.message_thread_id,
        reply_markup: getDashboardMarkup(env),
      }
    );
    return;
  }

  // 2. Resolve or initialize group and fund context in D1
  const context = await getOrCreateGroupFundContext(
    chatId,
    msg.chat.title,
    msg.from,
    env
  );

  // 3. Route by intent
  switch (intent.type) {
    case "BALANCE":
      await handleBalance(chatId, context, env);
      break;

    case "SUMMARY":
      await handleSummary(chatId, context, env);
      break;

    case "HISTORY":
      await handleHistory(chatId, context, env);
      break;

    case "MEMBERS":
      await handleMembers(chatId, context, env);
      break;

    case "CONTRIBUTION":
      await handleContribution(
        chatId,
        context,
        intent.memberName,
        intent.amountPaisa,
        intent.description,
        msg,
        env
      );
      break;

    case "EXPENSE":
      await handleExpense(
        chatId,
        context,
        intent.category,
        intent.amountPaisa,
        intent.description,
        msg,
        env
      );
      break;

    case "REVERSE":
      await handleReverse(chatId, context, intent.transactionId, msg, env);
      break;
  }
}

// ── Context and Authorization ────────────────────────────────────────────────

/**
 * Retrieve the group and primary fund for this Telegram chat.
 * If the group is not registered yet, auto bootstrap it so the room can start immediately.
 */
async function getOrCreateGroupFundContext(
  chatId: number,
  chatTitle: string | undefined,
  fromUser: TelegramUser | undefined,
  env: Env
): Promise<GroupFundContext> {
  const strChatId = String(chatId);

  // Check if group already exists
  const existing = await env.DB.prepare(
    `SELECT g.id AS group_id, g.organization_id, g.name AS group_name,
            f.id AS fund_id, f.name AS fund_name
     FROM groups g
     LEFT JOIN funds f ON f.group_id = g.id AND f.status = 'active'
     WHERE g.telegram_chat_id = ?
     LIMIT 1`
  )
    .bind(strChatId)
    .first<{
      group_id: string;
      organization_id: string;
      group_name: string;
      fund_id: string | null;
      fund_name: string | null;
    }>();

  if (existing && existing.fund_id) {
    return {
      organizationId: existing.organization_id,
      groupId: existing.group_id,
      fundId: existing.fund_id,
      groupName: existing.group_name,
      fundName: existing.fund_name ?? "General Room Fund",
    };
  }

  const now = Math.floor(Date.now() / 1000);

  // If group exists but has no active fund, create the default fund
  if (existing) {
    const newFundId = `fund-${crypto.randomUUID().slice(0, 8)}`;
    await env.DB.prepare(
      `INSERT INTO funds (id, organization_id, group_id, name, type, currency, opening_balance_paisa, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Room General Fund', 'ROOM', 'BDT', 0, 'active', ?, ?)`
    )
      .bind(newFundId, existing.organization_id, existing.group_id, now, now)
      .run();

    return {
      organizationId: existing.organization_id,
      groupId: existing.group_id,
      fundId: newFundId,
      groupName: existing.group_name,
      fundName: "Room General Fund",
    };
  }

  // Auto bootstrap new room organization, group, fund, and initial treasurer
  const orgId = `org-${crypto.randomUUID().slice(0, 8)}`;
  const groupId = `grp-${crypto.randomUUID().slice(0, 8)}`;
  const fundId = `fund-${crypto.randomUUID().slice(0, 8)}`;
  const groupName = chatTitle || `Room (${strChatId})`;
  const fundName = `${groupName} General Fund`;

  const creatorUserId = fromUser ? await resolveOrCreateUserFromTelegram(fromUser, env) : "system";

  await env.DB.batch([
    // Create Organization
    env.DB.prepare(
      `INSERT INTO organizations (id, name, type, country, currency, owner_user_id, status, created_at, updated_at)
       VALUES (?, ?, 'COMMUNITY', 'BD', 'BDT', ?, 'active', ?, ?)`
    ).bind(orgId, groupName, creatorUserId, now, now),

    // Create Group
    env.DB.prepare(
      `INSERT INTO groups (id, organization_id, parent_group_id, name, type, telegram_chat_id, status, created_at, updated_at)
       VALUES (?, ?, NULL, ?, 'ROOM', ?, 'active', ?, ?)`
    ).bind(groupId, orgId, groupName, strChatId, now, now),

    // Create Fund
    env.DB.prepare(
      `INSERT INTO funds (id, organization_id, group_id, name, type, currency, opening_balance_paisa, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ROOM', 'BDT', 0, 'active', ?, ?)`
    ).bind(fundId, orgId, groupId, fundName, now, now),

    // Assign Creator as Treasurer
    env.DB.prepare(
      `INSERT INTO memberships (id, organization_id, group_id, fund_id, user_id, role, status, joined_at)
       VALUES (?, ?, ?, ?, ?, 'TREASURER', 'active', ?)`
    ).bind(`mem-${crypto.randomUUID().slice(0, 8)}`, orgId, groupId, fundId, creatorUserId, now),
  ]);

  return {
    organizationId: orgId,
    groupId,
    fundId,
    groupName,
    fundName,
  };
}

/**
 * Check if the message sender has permission to record financial mutations.
 * Only users with role TREASURER or OWNER are permitted.
 */
async function checkTreasurerPermission(
  telegramUserId: number | undefined,
  groupId: string,
  env: Env
): Promise<{ allowed: boolean; role?: string; userId?: string }> {
  if (!telegramUserId) return { allowed: false };

  const strTgId = String(telegramUserId);

  const row = await env.DB.prepare(
    `SELECT m.role, u.id AS user_id
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE u.telegram_user_id = ?
       AND m.group_id = ?
       AND m.status = 'active'
     LIMIT 1`
  )
    .bind(strTgId, groupId)
    .first<{ role: string; user_id: string }>();

  if (!row) {
    // If no memberships exist yet for this group, allow the first user
    const totalMembers = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM memberships WHERE group_id = ?`
    )
      .bind(groupId)
      .first<{ total: number }>();

    if ((totalMembers?.total ?? 0) === 0) {
      return { allowed: true, role: "TREASURER" };
    }
    return { allowed: false };
  }

  const isAllowed = row.role === "TREASURER" || row.role === "OWNER";
  return { allowed: isAllowed, role: row.role, userId: row.user_id };
}

/**
 * Resolve or insert a user record corresponding to a Telegram user.
 */
async function resolveOrCreateUserFromTelegram(
  tgUser: TelegramUser,
  env: Env
): Promise<string> {
  const strId = String(tgUser.id);
  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE telegram_user_id = ? LIMIT 1`
  )
    .bind(strId)
    .first<{ id: string }>();

  if (existing) return existing.id;

  const newUserId = `u-${crypto.randomUUID().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  await env.DB.prepare(
    `INSERT INTO users (id, telegram_user_id, username, display_name, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
  )
    .bind(newUserId, strId, tgUser.username ?? null, fullName || "Telegram User", now, now)
    .run();

  return newUserId;
}

/**
 * Match an existing member by name in this group, or create a new user and membership.
 */
async function resolveOrCreateMemberByName(
  memberName: string,
  context: GroupFundContext,
  env: Env
): Promise<{ userId: string; displayName: string }> {
  const cleanName = memberName.trim();

  // Try matching display name inside this group
  const existing = await env.DB.prepare(
    `SELECT u.id, u.display_name
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.group_id = ?
       AND (LOWER(u.display_name) LIKE ? OR LOWER(u.username) LIKE ?)
     LIMIT 1`
  )
    .bind(context.groupId, `%${cleanName.toLowerCase()}%`, `%${cleanName.toLowerCase()}%`)
    .first<{ id: string; display_name: string }>();

  if (existing) {
    return { userId: existing.id, displayName: existing.display_name };
  }

  // Not yet a member of this group, check global users table
  const globalUser = await env.DB.prepare(
    `SELECT id, display_name FROM users WHERE LOWER(display_name) = ? LIMIT 1`
  )
    .bind(cleanName.toLowerCase())
    .first<{ id: string; display_name: string }>();

  const userId = globalUser?.id ?? `u-${crypto.randomUUID().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);

  if (!globalUser) {
    await env.DB.prepare(
      `INSERT INTO users (id, display_name, status, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?)`
    )
      .bind(userId, cleanName, now, now)
      .run();
  }

  // Add membership with role MEMBER
  await env.DB.prepare(
    `INSERT INTO memberships (id, organization_id, group_id, fund_id, user_id, role, status, joined_at)
     VALUES (?, ?, ?, ?, ?, 'MEMBER', 'active', ?)`
  )
    .bind(
      `mem-${crypto.randomUUID().slice(0, 8)}`,
      context.organizationId,
      context.groupId,
      context.fundId,
      userId,
      now
    )
    .run();

  return { userId, displayName: cleanName };
}

function getDashboardMarkup(env: Env) {
  const url = env.DASHBOARD_URL;
  if (!url) return undefined;
  return {
    inline_keyboard: [
      [
        {
          text: "📊 Open Room Dashboard",
          web_app: { url },
        },
      ],
    ],
  };
}

// ── Command Handlers ─────────────────────────────────────────────────────────

async function handleStart(chatId: number, msg: TelegramMessage, env: Env) {
  const name = msg.from?.first_name ?? "there";
  await sendMessage(
    chatId,
    `Hi ${name}, welcome to FundBot.\n\n` +
      "This bot manages your shared room fund with an authoritative ledger in Bangladeshi Taka.\n\n" +
      "Commands to get started:\n" +
      "/balance : view current fund balance\n" +
      "/summary : view full report and breakdown\n" +
      "/history : view recent transactions\n" +
      "/members : view all members and contributions\n" +
      "/add <name> <amount> : record a contribution\n" +
      "/expense <amount> <category> : record an expense\n" +
      "/help : list all commands",
    env,
    { reply_markup: getDashboardMarkup(env) }
  );
}

async function handleHelp(chatId: number, env: Env) {
  await sendMessage(
    chatId,
    "FundBot Commands\n\n" +
      "General:\n" +
      "/balance : current fund balance and flow totals\n" +
      "/summary : complete breakdown by category and member\n" +
      "/history : last 10 transactions\n" +
      "/members : member roster and total contributed\n\n" +
      "Treasurer and Owner:\n" +
      "/add <name> <amount> [note] : record contribution\n" +
      "/expense <amount> <category> [note] : record expense\n" +
      "/reverse <tx id> : reverse a mistaken entry\n\n" +
      "Natural language examples:\n" +
      "Murad gave 300 tk\n" +
      "We spent 150 on grocery\n\n" +
      "All entries are saved directly to Cloudflare D1.",
    env,
    { reply_markup: getDashboardMarkup(env) }
  );
}

async function handleBalance(chatId: number, context: GroupFundContext, env: Env) {
  try {
    if (env.WEB_API_URL) {
      const syncData = await fetchFundFromWebApi(env);
      if (syncData?.fund) {
        const f = syncData.fund;
        await sendMessage(
          chatId,
          `💰 Fund Balance (${f.name})\n\n` +
            `Type: ${f.fundType === "BATCH" ? "Batch Fund" : "Room Fund"}\n` +
            `Current Balance: ${formatTaka(f.totalBalancePaisa)}\n` +
            `Total Contributions: ${formatTaka(f.totalContributionsPaisa)}\n` +
            `Total Expenses: ${formatTaka(f.totalExpensesPaisa)}\n` +
            `Active Members: ${f.memberCount}\n` +
            (f.targetBudgetPaisa > 0 ? `Target Goal: ${formatTaka(f.targetBudgetPaisa)}\n` : "") +
            (f.announcement ? `Notice: ${f.announcement}\n` : ""),
          env,
          { reply_markup: getDashboardMarkup(env) }
        );
        return;
      }
    }

    const fund = await env.DB.prepare(
      `SELECT opening_balance_paisa FROM funds WHERE id = ?`
    )
      .bind(context.fundId)
      .first<{ opening_balance_paisa: number }>();

    const txTotals = await env.DB.prepare(
      `SELECT
         COALESCE(SUM(amount_paisa), 0) AS net,
         COALESCE(SUM(CASE WHEN amount_paisa > 0 THEN amount_paisa ELSE 0 END), 0) AS contributions,
         COALESCE(SUM(CASE WHEN amount_paisa < 0 THEN amount_paisa ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE fund_id = ? AND status = 'completed'`
    )
      .bind(context.fundId)
      .first<{ net: number; contributions: number; expenses: number }>();

    const opening = fund?.opening_balance_paisa ?? 0;
    const netTransactions = txTotals?.net ?? 0;
    const totalBalance = opening + netTransactions;
    const contributions = txTotals?.contributions ?? 0;
    const expenses = Math.abs(txTotals?.expenses ?? 0);

    await sendMessage(
      chatId,
      `💰 Fund Balance (${context.groupName})\n\n` +
        `Current Balance: ${formatTaka(totalBalance)}\n` +
        `Total Contributions: ${formatTaka(contributions)}\n` +
        `Total Expenses: ${formatTaka(expenses)}\n` +
        `Opening Reserve: ${formatTaka(opening)}`,
      env,
      { reply_markup: getDashboardMarkup(env) }
    );
  } catch (err) {
    console.error("handleBalance error:", err);
    await sendMessage(chatId, "Could not fetch balance. Please try again.", env);
  }
}

async function handleSummary(chatId: number, context: GroupFundContext, env: Env) {
  try {
    const fund = await env.DB.prepare(
      `SELECT opening_balance_paisa FROM funds WHERE id = ?`
    )
      .bind(context.fundId)
      .first<{ opening_balance_paisa: number }>();

    const txTotals = await env.DB.prepare(
      `SELECT
         COALESCE(SUM(amount_paisa), 0) AS net,
         COALESCE(SUM(CASE WHEN amount_paisa > 0 THEN amount_paisa ELSE 0 END), 0) AS contributions,
         COALESCE(SUM(CASE WHEN amount_paisa < 0 THEN amount_paisa ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE fund_id = ? AND status = 'completed'`
    )
      .bind(context.fundId)
      .first<{ net: number; contributions: number; expenses: number }>();

    const opening = fund?.opening_balance_paisa ?? 0;
    const netTransactions = txTotals?.net ?? 0;
    const totalBalance = opening + netTransactions;
    const contributions = txTotals?.contributions ?? 0;
    const expenses = Math.abs(txTotals?.expenses ?? 0);

    // Expenses by category
    const categoryRows = await env.DB.prepare(
      `SELECT COALESCE(category, 'OTHER') AS cat,
              ABS(SUM(amount_paisa)) AS spent
       FROM transactions
       WHERE fund_id = ? AND type = 'EXPENSE' AND status = 'completed'
       GROUP BY category
       ORDER BY spent DESC`
    )
      .bind(context.fundId)
      .all<{ cat: string; spent: number }>();

    const categoryLines = categoryRows.results.length
      ? categoryRows.results.map((c) => `• ${c.cat}: ${formatTaka(c.spent)}`).join("\n")
      : "No expenses recorded yet";

    // Member contributions
    const memberRows = await env.DB.prepare(
      `SELECT u.display_name,
              COALESCE(SUM(t.amount_paisa), 0) AS contributed
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN transactions t ON t.member_id = m.user_id
         AND t.fund_id = ?
         AND t.status = 'completed'
         AND t.type = 'CONTRIBUTION'
       WHERE m.group_id = ? AND m.status = 'active'
       GROUP BY m.user_id
       ORDER BY contributed DESC
       LIMIT 5`
    )
      .bind(context.fundId, context.groupId)
      .all<{ display_name: string; contributed: number }>();

    const memberLines = memberRows.results.length
      ? memberRows.results.map((m) => `• ${m.display_name}: ${formatTaka(m.contributed)}`).join("\n")
      : "No contributions yet";

    await sendMessage(
      chatId,
      `📊 Room Fund Summary (${context.groupName})\n\n` +
        `Current Balance: ${formatTaka(totalBalance)}\n` +
        `Total Inflows: ${formatTaka(contributions)}\n` +
        `Total Outflows: ${formatTaka(expenses)}\n\n` +
        `Expense Breakdown:\n${categoryLines}\n\n` +
        `Top Contributions:\n${memberLines}\n\n` +
        `Use /history to view recent individual records.`,
      env,
      { reply_markup: getDashboardMarkup(env) }
    );
  } catch (err) {
    console.error("handleSummary error:", err);
    await sendMessage(chatId, "Could not generate summary report. Please try again.", env);
  }
}

async function handleHistory(chatId: number, context: GroupFundContext, env: Env) {
  try {
    const rows = await env.DB.prepare(
      `SELECT t.id, t.type, t.amount_paisa, t.category, t.description,
              t.transaction_date, t.source,
              COALESCE(u.display_name, t.category, t.type) AS party
       FROM transactions t
       LEFT JOIN users u ON u.id = t.member_id
       WHERE t.fund_id = ? AND t.status = 'completed'
       ORDER BY t.transaction_date DESC
       LIMIT 10`
    )
      .bind(context.fundId)
      .all<{
        id: string;
        type: string;
        amount_paisa: number;
        category: string | null;
        description: string | null;
        transaction_date: number;
        source: string;
        party: string;
      }>();

    if (!rows.results.length) {
      await sendMessage(chatId, "No transactions recorded yet in this fund.", env);
      return;
    }

    const lines = rows.results.map((r) => {
      const sign = r.amount_paisa >= 0 ? "+" : "";
      const shortId = r.id.slice(0, 6);
      const note = r.description ? ` (${r.description})` : "";
      return `[${shortId}] ${sign}${formatTaka(r.amount_paisa)} ${r.party}${note}`;
    });

    await sendMessage(
      chatId,
      `📋 Recent Transactions (${context.groupName})\n\n${lines.join("\n")}\n\n` +
        `To reverse an entry, send /reverse <id>`,
      env
    );
  } catch (err) {
    console.error("handleHistory error:", err);
    await sendMessage(chatId, "Could not fetch history. Please try again.", env);
  }
}

async function handleMembers(chatId: number, context: GroupFundContext, env: Env) {
  try {
    const rows = await env.DB.prepare(
      `SELECT u.display_name, m.role, m.status,
              COALESCE(SUM(CASE WHEN t.amount_paisa > 0 THEN t.amount_paisa ELSE 0 END), 0) AS contributed
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN transactions t ON t.member_id = m.user_id
         AND t.fund_id = ?
         AND t.status = 'completed'
         AND t.type = 'CONTRIBUTION'
       WHERE m.group_id = ?
       GROUP BY m.user_id
       ORDER BY contributed DESC`
    )
      .bind(context.fundId, context.groupId)
      .all<{ display_name: string; role: string; status: string; contributed: number }>();

    if (!rows.results.length) {
      await sendMessage(chatId, "No members found for this room group.", env);
      return;
    }

    const lines = rows.results.map((r) => {
      const statusNote = r.status !== "active" ? ` [${r.status}]` : "";
      return `• ${r.display_name} (${r.role}${statusNote}): ${formatTaka(r.contributed)}`;
    });

    await sendMessage(
      chatId,
      `👥 Member List (${context.groupName})\n\n${lines.join("\n")}`,
      env
    );
  } catch (err) {
    console.error("handleMembers error:", err);
    await sendMessage(chatId, "Could not fetch member list. Please try again.", env);
  }
}

async function handleContribution(
  chatId: number,
  context: GroupFundContext,
  memberName: string,
  amountPaisa: number,
  description: string,
  msg: TelegramMessage,
  env: Env
) {
  // Authorization check: Treasurer or Owner only
  const auth = await checkTreasurerPermission(msg.from?.id, context.groupId, env);
  if (!auth.allowed) {
    await sendMessage(
      chatId,
      "Permission denied. Only a Treasurer or Owner can record contributions.",
      env
    );
    return;
  }

  try {
    const member = await resolveOrCreateMemberByName(memberName, context, env);
    const txId = `tx-${crypto.randomUUID().slice(0, 8)}`;
    const now = Math.floor(Date.now() / 1000);
    const actorId = auth.userId ?? String(msg.from?.id ?? "unknown");

    await env.DB.batch([
      // Insert Transaction
      env.DB.prepare(
        `INSERT INTO transactions
           (id, organization_id, group_id, fund_id, type, member_id,
            amount_paisa, currency, description,
            transaction_date, created_by, source,
            source_telegram_chat_id, source_telegram_message_id,
            status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'CONTRIBUTION', ?,
                 ?, 'BDT', ?,
                 ?, ?, 'TELEGRAM',
                 ?, ?,
                 'completed', ?, ?)`
      ).bind(
        txId,
        context.organizationId,
        context.groupId,
        context.fundId,
        member.userId,
        amountPaisa,
        description,
        now,
        actorId,
        String(chatId),
        String(msg.message_id),
        now,
        now
      ),

      // Insert Audit Log
      env.DB.prepare(
        `INSERT INTO audit_logs
           (id, organization_id, group_id, fund_id, actor_user_id,
            action, entity_type, entity_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 'CREATE_TRANSACTION', 'transaction', ?, ?, ?)`
      ).bind(
        `log-${crypto.randomUUID().slice(0, 8)}`,
        context.organizationId,
        context.groupId,
        context.fundId,
        actorId,
        txId,
        JSON.stringify({ type: "CONTRIBUTION", member: member.displayName, amountPaisa }),
        now
      ),
    ]);

    if (env.WEB_API_URL) {
      await postTransactionToWebApi(
        {
          type: "CONTRIBUTION",
          memberName: member.displayName,
          amountPaisa,
          description,
          telegramChatId: chatId,
          telegramUser: msg.from?.username || msg.from?.first_name || "Telegram User",
        },
        env
      );
    }

    await sendMessage(
      chatId,
      `✅ Contribution Recorded\n\n` +
        `Member: ${member.displayName}\n` +
        `Amount: ${formatTaka(amountPaisa)}\n` +
        `Note: ${description}\n` +
        `Record ID: ${txId.slice(0, 6)}\n\n` +
        `Send /balance to view the updated total.`,
      env
    );
  } catch (err) {
    console.error("handleContribution error:", err);
    await sendMessage(chatId, "Could not record contribution. Please try again.", env);
  }
}

async function handleExpense(
  chatId: number,
  context: GroupFundContext,
  category: string,
  amountPaisa: number,
  description: string,
  msg: TelegramMessage,
  env: Env
) {
  // Authorization check: Treasurer or Owner only
  const auth = await checkTreasurerPermission(msg.from?.id, context.groupId, env);
  if (!auth.allowed) {
    await sendMessage(
      chatId,
      "Permission denied. Only a Treasurer or Owner can record expenses.",
      env
    );
    return;
  }

  try {
    const txId = `tx-${crypto.randomUUID().slice(0, 8)}`;
    const now = Math.floor(Date.now() / 1000);
    const actorId = auth.userId ?? String(msg.from?.id ?? "unknown");

    await env.DB.batch([
      // Insert Expense Transaction (negative amount paisa)
      env.DB.prepare(
        `INSERT INTO transactions
           (id, organization_id, group_id, fund_id, type,
            amount_paisa, currency, category, description,
            transaction_date, created_by, source,
            source_telegram_chat_id, source_telegram_message_id,
            status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'EXPENSE',
                 ?, 'BDT', ?, ?,
                 ?, ?, 'TELEGRAM',
                 ?, ?,
                 'completed', ?, ?)`
      ).bind(
        txId,
        context.organizationId,
        context.groupId,
        context.fundId,
        -amountPaisa,
        category,
        description,
        now,
        actorId,
        String(chatId),
        String(msg.message_id),
        now,
        now
      ),

      // Insert Audit Log
      env.DB.prepare(
        `INSERT INTO audit_logs
           (id, organization_id, group_id, fund_id, actor_user_id,
            action, entity_type, entity_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 'CREATE_TRANSACTION', 'transaction', ?, ?, ?)`
      ).bind(
        `log-${crypto.randomUUID().slice(0, 8)}`,
        context.organizationId,
        context.groupId,
        context.fundId,
        actorId,
        txId,
        JSON.stringify({ type: "EXPENSE", category, amountPaisa }),
        now
      ),
    ]);

    if (env.WEB_API_URL) {
      await postTransactionToWebApi(
        {
          type: "EXPENSE",
          category,
          amountPaisa,
          description,
          telegramChatId: chatId,
          telegramUser: msg.from?.username || msg.from?.first_name || "Telegram User",
        },
        env
      );
    }

    await sendMessage(
      chatId,
      `✅ Expense Recorded\n\n` +
        `Category: ${category}\n` +
        `Amount: ${formatTaka(amountPaisa)}\n` +
        `Note: ${description}\n` +
        `Record ID: ${txId.slice(0, 6)}\n\n` +
        `Send /balance to view the updated total.`,
      env
    );
  } catch (err) {
    console.error("handleExpense error:", err);
    await sendMessage(chatId, "Could not record expense. Please try again.", env);
  }
}

async function handleReverse(
  chatId: number,
  context: GroupFundContext,
  targetTxId: string,
  msg: TelegramMessage,
  env: Env
) {
  // Authorization check: Treasurer or Owner only
  const auth = await checkTreasurerPermission(msg.from?.id, context.groupId, env);
  if (!auth.allowed) {
    await sendMessage(
      chatId,
      "Permission denied. Only a Treasurer or Owner can reverse transactions.",
      env
    );
    return;
  }

  try {
    // Find transaction by full or prefix ID in this fund
    const orig = await env.DB.prepare(
      `SELECT id, type, amount_paisa, description, status
       FROM transactions
       WHERE fund_id = ?
         AND (id = ? OR id LIKE ?)
       LIMIT 1`
    )
      .bind(context.fundId, targetTxId, `${targetTxId}%`)
      .first<{
        id: string;
        type: string;
        amount_paisa: number;
        description: string | null;
        status: string;
      }>();

    if (!orig) {
      await sendMessage(
        chatId,
        `Transaction '${targetTxId}' was not found in this fund. Check /history for valid record IDs.`,
        env
      );
      return;
    }

    if (orig.status === "reversed") {
      await sendMessage(
        chatId,
        `Transaction '${orig.id.slice(0, 6)}' is already reversed.`,
        env
      );
      return;
    }

    const reversalTxId = `tx-${crypto.randomUUID().slice(0, 8)}`;
    const now = Math.floor(Date.now() / 1000);
    const actorId = auth.userId ?? String(msg.from?.id ?? "unknown");

    await env.DB.batch([
      // Mark original as reversed
      env.DB.prepare(
        `UPDATE transactions SET status = 'reversed', updated_at = ? WHERE id = ?`
      ).bind(now, orig.id),

      // Insert correcting reversal transaction
      env.DB.prepare(
        `INSERT INTO transactions
           (id, organization_id, group_id, fund_id, type,
            amount_paisa, currency, description,
            transaction_date, created_by, source,
            source_telegram_chat_id, source_telegram_message_id,
            reverses_transaction_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'REVERSAL',
                 ?, 'BDT', ?,
                 ?, ?, 'TELEGRAM',
                 ?, ?,
                 ?, 'completed', ?, ?)`
      ).bind(
        reversalTxId,
        context.organizationId,
        context.groupId,
        context.fundId,
        -orig.amount_paisa, // opposing amount cancels original in sum
        `Reversal of transaction ${orig.id.slice(0, 6)}`,
        now,
        actorId,
        String(chatId),
        String(msg.message_id),
        orig.id,
        now,
        now
      ),

      // Audit Log
      env.DB.prepare(
        `INSERT INTO audit_logs
           (id, organization_id, group_id, fund_id, actor_user_id,
            action, entity_type, entity_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 'REVERSE_TRANSACTION', 'transaction', ?, ?, ?)`
      ).bind(
        `log-${crypto.randomUUID().slice(0, 8)}`,
        context.organizationId,
        context.groupId,
        context.fundId,
        actorId,
        orig.id,
        JSON.stringify({ reversedTxId: orig.id, originalAmount: orig.amount_paisa }),
        now
      ),
    ]);

    await sendMessage(
      chatId,
      `↩️ Transaction Reversed\n\n` +
        `Reversed Record: ${orig.id.slice(0, 6)}\n` +
        `Correction Amount: ${formatTaka(Math.abs(orig.amount_paisa))}\n` +
        `Reversal Record: ${reversalTxId.slice(0, 6)}\n\n` +
        `Ledger has been corrected. Send /balance to view the new total.`,
      env
    );
  } catch (err) {
    console.error("handleReverse error:", err);
    await sendMessage(chatId, "Could not reverse transaction. Please try again.", env);
  }
}
