import test from "node:test";
import assert from "node:assert/strict";
import { formatTaka, parsePaisa } from "../src/lib/telegram.ts";

test("Telegram lib: formatTaka formats integer paisa as BDT currency string", () => {
  assert.ok(formatTaka(150000).includes("1,500.00"));
  assert.ok(formatTaka(0).includes("0.00"));
  assert.ok(formatTaka(50).includes("0.50"));
  assert.ok(formatTaka(2000000).includes("20,000.00"));
});

test("Telegram lib: parsePaisa safely parses user input into integer paisa", () => {
  // Integers
  assert.strictEqual(parsePaisa("100"), 10000);
  assert.strictEqual(parsePaisa("500"), 50000);

  // Decimals
  assert.strictEqual(parsePaisa("100.50"), 10050);
  assert.strictEqual(parsePaisa("100.5"), 10050);
  assert.strictEqual(parsePaisa("0.25"), 25);

  // Invalid inputs return null
  assert.strictEqual(parsePaisa("abc"), null);
  assert.strictEqual(parsePaisa("-50"), null);
  assert.strictEqual(parsePaisa("0"), null);
});
