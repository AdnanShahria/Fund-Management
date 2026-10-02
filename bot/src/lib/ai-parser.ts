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
    type: z.literal("CHAT"),
    reply: z.string().optional(),
    message: z.string().optional(),
    text: z.string().optional(),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal("UNKNOWN"),
  }),
]);

const SYSTEM_PROMPT = `
You are OrbitFundBot, a helpful and friendly fund manager for shared rooms, bachelor mess groups, and student batch finances in Bangladesh.
The primary currency is Bangladeshi Taka (BDT / ৳).
The live web dashboard is at https://fvmas16.pages.dev and the admin control panel is at https://fvmas16.pages.dev/admin.

Extract the user intent into a clean JSON object with no markdown fences.

Supported intents:
1. CONTRIBUTION: when a member gave, paid, or deposited money into the fund.
   Example: "Murad gave 500 tk", "Adnan contributed 200", "মুরাদ ৫০০ টাকা দিল", "I paid 1000 tk"
   Required JSON: {"type": "CONTRIBUTION", "memberName": "Name", "amountTaka": 500, "description": "Deposit"}

2. EXPENSE: when money was spent from the fund.
   Example: "We spent 180 on eggs and onions", "bazar 450 tk", "paid 400 for electricity bill", "বাজার খরচ ৩৫০"
   Required JSON: {"type": "EXPENSE", "category": "GROCERY", "amountTaka": 180, "description": "Grocery"}
   Allowed categories: GROCERY, ELECTRICITY, CLEANING, INTERNET, TRANSPORT, OTHER

3. BALANCE: user is asking for current fund balance.
   Example: "how much money do we have left?", "what is the balance?", "koto taka ache?"
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

7. CHAT: Any greeting, general conversational question, question about the bot, dashboard, links, groups, or how to use the bot. Answer helpfully, warmly, and concisely as OrbitFundBot in 1 to 3 friendly sentences. Never use dashes or hyphens as punctuation.
   Example: "dashboard link?", "in how many group you are added", "hi", "who are you?", "can you help us manage our bachelor mess?"
   Required JSON: {"type": "CHAT", "reply": "Your warm, helpful, natural conversational reply here"}

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
      const candidateModels = [
        "@cf/meta/llama-3.2-3b-instruct",
        "@cf/meta/llama-3.2-1b-instruct",
        "@cf/meta/llama-3-8b-instruct",
      ];
      for (const model of candidateModels) {
        try {
          const response = await env.AI.run(model, {
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: trimmed },
            ],
            max_tokens: 384,
            temperature: 0.1,
          });
          const extractedText =
            typeof response?.response === "string" && response.response.trim().length > 0
              ? response.response
              : response?.choices?.[0]?.message?.content ||
                (typeof response === "string" ? response : null);
          if (extractedText) {
            rawJsonResponse = extractedText;
            break;
          }
        } catch (aiErr) {
          console.warn(`Workers AI model ${model} error:`, aiErr);
        }
      }
    }

    // 2. Try NVIDIA NIM if key is available
    if (!rawJsonResponse && env.NVIDIA_API_KEY) {
      try {
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
            max_tokens: 384,
          }),
        });

        if (res.ok) {
          const data: any = await res.json();
          rawJsonResponse = data?.choices?.[0]?.message?.content ?? null;
        }
      } catch (nvErr) {
        console.warn("NVIDIA NIM fetch error:", nvErr);
      }
    }

    // 3. Try Gemini API if key is available and previous providers were absent
    if (!rawJsonResponse && env.GEMINI_API_KEY) {
      try {
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
      } catch (gemErr) {
        console.warn("Gemini API fetch error:", gemErr);
      }
    }

    if (rawJsonResponse) {
      // Attempt to extract JSON object from response using regex
      const jsonMatch = rawJsonResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          const validated = aiResponseSchema.safeParse(parsedData);

          if (validated.success) {
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
            if (val.type === "CHAT") {
              const replyText = val.reply || val.message || val.text || val.content;
              if (replyText) {
                return { type: "CHAT", reply: replyText };
              }
            }
          }
        } catch (jsonErr) {
          console.warn("JSON parse of match failed:", jsonErr);
        }
      }

      // Check if the response contains a "reply": "..." key (e.g. from partial or formatted JSON)
      const partialChatMatch = rawJsonResponse.match(/"reply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
      if (partialChatMatch && partialChatMatch[1]) {
        return {
          type: "CHAT",
          reply: partialChatMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        };
      }

      // If the model produced natural language prose (not valid JSON), use it as conversational CHAT
      const cleanedText = rawJsonResponse
        .replace(/```[a-z]*\s*/gi, "")
        .replace(/```/g, "")
        .trim();

      if (cleanedText.length > 0) {
        if (cleanedText.startsWith("{") && cleanedText.endsWith("}")) {
          try {
            const rawObj = JSON.parse(cleanedText);
            const candidateText =
              rawObj.reply || rawObj.message || rawObj.text || rawObj.response || rawObj.content;
            if (candidateText && typeof candidateText === "string") {
              return { type: "CHAT", reply: candidateText };
            }
          } catch {
            // keep raw
          }
        } else {
          return {
            type: "CHAT",
            reply: cleanedText,
          };
        }
      }
    }

    // Conversational question fallback if AI gave no text or unparseable payload
    if (/(?:who|what|where|how|can|is|are|tell|help|\?)/i.test(trimmed)) {
      return {
        type: "CHAT",
        reply:
          "I am OrbitFundBot, your shared room and batch fund assistant. I keep track of member contributions, mess expenses, and balances in Bangladeshi Taka with live reports on our dashboard at https://fvmas16.pages.dev.",
      };
    }

    return null;
  } catch (err) {
    console.error("aiParse unexpected failure:", err);
    return null;
  }
}
