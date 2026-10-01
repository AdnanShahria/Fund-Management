import test from "node:test";
import assert from "node:assert/strict";
import { aiParse } from "../src/lib/ai-parser.ts";
import type { Env } from "../src/types/env.ts";

test("AI parser: returns null for empty or whitespace messages", async () => {
  const dummyEnv: Env = {
    DB: {} as any,
    BOT_TOKEN: "mock_token",
    ENVIRONMENT: "test",
  };

  const res1 = await aiParse("", dummyEnv);
  const res2 = await aiParse("   ", dummyEnv);

  assert.strictEqual(res1, null);
  assert.strictEqual(res2, null);
});

test("AI parser: returns null when no AI providers are configured", async () => {
  const dummyEnv: Env = {
    DB: {} as any,
    BOT_TOKEN: "mock_token",
    ENVIRONMENT: "test",
  };

  const res = await aiParse("Murad gave 500", dummyEnv);
  assert.strictEqual(res, null);
});

test("AI parser: parses complex Bengali and natural speech using NVIDIA NIM when key is provided", async () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    // Skip external network test if running in offline test runner
    return;
  }

  const envWithNvidia: Env = {
    DB: {} as any,
    BOT_TOKEN: "mock_token",
    ENVIRONMENT: "test",
    NVIDIA_API_KEY: apiKey,
    NVIDIA_MODEL: "meta/llama-3.2-11b-vision-instruct",
  };

  const res = await aiParse("আজকে বাজারে মুরগির জন্য ৪৫০ টাকা খরচ হয়েছে", envWithNvidia);
  assert.ok(res !== null, "Expected parsed intent from NVIDIA NIM");
  assert.strictEqual(res.type, "EXPENSE");
  if (res.type === "EXPENSE") {
    assert.strictEqual(res.amountPaisa, 45000); // 450 BDT in paisa
    assert.strictEqual(res.category, "GROCERY");
  }
});
