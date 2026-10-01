import { z } from "zod";
import type { ParsedIntent } from "./parser";
import type { Env } from "../types/env";

/**
 * Zod validation schema for structured AI parser output.
 * Any AI output that violates this schema is rejected before reaching the ledger.
 */
const aiResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CONTRIBUTION"),
    memberName: z.string().min(1),
    amountTaka: z.number().positive(),
    description: z.string().optional().default("Contribution via Telegram"),
  }),
  z.object({
    type: z.literal("EXPENSE"),
    category: z.string().min(1),
    amountTaka: z.number().positive(),
    description: z.string().optional().default("Expense via Telegram"),
  }),
  z.object({
    type: z.literal("BALANCE"),
  }),
  z.object({
    type: z.literal("SUMMARY"),
  }),
  z.object({
    type: z.literal("HISTORY"),
  }),
  z.object({
    type: z.literal("MEMBERS"),
  }),
  z.object({
    type: z.literal("UNKNOWN"),
  }),
]);

const SYSTEM_PROMPT = `
You are the natural language parser for FundBot, a room fund manager in Bangladesh.
The primary currency is Bangladeshi Taka.
Extract the user intent into a clean JSON object with no markdown fences.

Supported intents:
1. CONTRIBUTION: when a member gave or paid money into the fund.
   Example: "Murad gave 500 tk", "Adnan deposited 200 for rent", "মুরাদ ৫০০ টাকা দিল"
   Required JSON: {"type": "CONTRIBUTION", "memberName": "Murad", "amountTaka": 500, "description": "Deposit"}

2. EXPENSE: when money was spent from the fund.
   Example: "We spent 180 on eggs and onions", "paid 400 for electricity bill", "বাজার খরচ ৩৫০"
   Required JSON: {"type": "EXPENSE", "category": "GROCERY", "amountTaka": 180, "description": "Eggs and onions"}
   Allowed categories: GROCERY, ELECTRICITY, CLEANING, INTERNET, TRANSPORT, OTHER

3. BALANCE: user is asking for current fund balance.
   Example: "how much money do we have left?", "what is the balance?"
   Required JSON: {"type": "BALANCE"}

4. SUMMARY: user is asking for summary or report.
   Example: "show room report", "summary please"
   Required JSON: {"type": "SUMMARY"}

5. HISTORY: user is asking for recent transactions.
   Example: "show recent spends", "transaction history"
   Required JSON: {"type": "HISTORY"}

6. MEMBERS: user is asking about group members.
   Example: "who is in this fund?", "show member contributions"
   Required JSON: {"type": "MEMBERS"}

7. UNKNOWN: unrelated questions or unclear messages.
   Required JSON: {"type": "UNKNOWN"}

Respond ONLY with valid JSON.
`;

/**
 * Fallback natural language parser backed by Workers AI or Gemini API.
 * This runs only when rule parser fails to resolve the message.
 */
export async function aiParse(text: string, env: Env): Promise<ParsedIntent | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    let rawJsonResponse: string | null = null;

    // 1. Try Cloudflare Workers AI if bound
    if (env.AI) {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        max_tokens: 256,
        temperature: 0.1,
      });
      rawJsonResponse = response?.response ?? null;
    }

    // 2. Try NVIDIA NIM if key is available
    if (!rawJsonResponse && env.NVIDIA_API_KEY) {
      const model = env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: trimmed },
          ],
          temperature: 0.1,
          max_tokens: 256,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        rawJsonResponse = data?.choices?.[0]?.message?.content ?? null;
      }
    }

    // 3. Try Gemini API if key is available and previous providers were absent
    if (!rawJsonResponse && env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: trimmed }] }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        rawJsonResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      }
    }

    if (!rawJsonResponse) {
      return null;
    }

    // Clean any accidental markdown code blocks
    const cleanedJson = rawJsonResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsedData = JSON.parse(cleanedJson);
    const validated = aiResponseSchema.safeParse(parsedData);

    if (!validated.success) {
      console.warn("AI parser validation failure:", validated.error);
      return null;
    }

    const val = validated.data;

    // Convert amount in Taka to integer paisa
    if (val.type === "CONTRIBUTION") {
      return {
        type: "CONTRIBUTION",
        memberName: val.memberName,
        amountPaisa: Math.round(val.amountTaka * 100),
        description: val.description,
      };
    }

    if (val.type === "EXPENSE") {
      return {
        type: "EXPENSE",
        category: val.category.toUpperCase(),
        amountPaisa: Math.round(val.amountTaka * 100),
        description: val.description,
      };
    }

    if (val.type === "BALANCE") return { type: "BALANCE" };
    if (val.type === "SUMMARY") return { type: "SUMMARY" };
    if (val.type === "HISTORY") return { type: "HISTORY" };
    if (val.type === "MEMBERS") return { type: "MEMBERS" };

    return { type: "UNKNOWN" };
  } catch (err) {
    console.error("aiParse unexpected failure:", err);
    return null;
  }
}
