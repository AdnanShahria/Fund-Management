import test from "node:test";
import assert from "node:assert/strict";
import { ruleBasedParse } from "../src/lib/parser.ts";

test("Rule parser: basic bot commands", () => {
  assert.deepStrictEqual(ruleBasedParse("/start"), { type: "START" });
  assert.deepStrictEqual(ruleBasedParse("/help"), { type: "HELP" });
  assert.deepStrictEqual(ruleBasedParse("/balance"), { type: "BALANCE" });
  assert.deepStrictEqual(ruleBasedParse("/summary"), { type: "SUMMARY" });
  assert.deepStrictEqual(ruleBasedParse("/history"), { type: "HISTORY" });
  assert.deepStrictEqual(ruleBasedParse("/members"), { type: "MEMBERS" });
});

test("Rule parser: /add command with various amounts and notes", () => {
  // Simple integer amount
  const res1 = ruleBasedParse("/add Murad 200");
  assert.ok(res1 && res1.type === "CONTRIBUTION");
  assert.strictEqual(res1.memberName, "Murad");
  assert.strictEqual(res1.amountPaisa, 20000);

  // Decimal amount in taka converted to paisa
  const res2 = ruleBasedParse("/add Murad 150.50");
  assert.ok(res2 && res2.type === "CONTRIBUTION");
  assert.strictEqual(res2.amountPaisa, 15050);

  // Multi word member name with note
  const res3 = ruleBasedParse("/add Murad Hasan 500 monthly deposit");
  assert.ok(res3 && res3.type === "CONTRIBUTION");
  assert.strictEqual(res3.memberName, "Murad Hasan");
  assert.strictEqual(res3.amountPaisa, 50000);
  assert.strictEqual(res3.description, "monthly deposit");

  // Currency symbols and suffixes
  const res4 = ruleBasedParse("/add Rahim 300tk");
  assert.ok(res4 && res4.type === "CONTRIBUTION");
  assert.strictEqual(res4.amountPaisa, 30000);
});

test("Rule parser: /expense command with categories", () => {
  // Amount first, category second
  const res1 = ruleBasedParse("/expense 90 grocery");
  assert.ok(res1 && res1.type === "EXPENSE");
  assert.strictEqual(res1.category, "GROCERY");
  assert.strictEqual(res1.amountPaisa, 9000);

  // Category first, amount second
  const res2 = ruleBasedParse("/expense electricity 250");
  assert.ok(res2 && res2.type === "EXPENSE");
  assert.strictEqual(res2.category, "ELECTRICITY");
  assert.strictEqual(res2.amountPaisa, 25000);

  // Unknown category defaults to OTHER
  const res3 = ruleBasedParse("/expense 100 miscellaneous");
  assert.ok(res3 && res3.type === "EXPENSE");
  assert.strictEqual(res3.category, "OTHER");
  assert.strictEqual(res3.amountPaisa, 10000);
});

test("Rule parser: natural language contributions", () => {
  // English gave pattern
  const res1 = ruleBasedParse("Murad gave 300 tk");
  assert.ok(res1 && res1.type === "CONTRIBUTION");
  assert.strictEqual(res1.memberName, "Murad");
  assert.strictEqual(res1.amountPaisa, 30000);

  // English contributed pattern
  const res2 = ruleBasedParse("Adnan contributed 500");
  assert.ok(res2 && res2.type === "CONTRIBUTION");
  assert.strictEqual(res2.memberName, "Adnan");
  assert.strictEqual(res2.amountPaisa, 50000);

  // Bengali paid pattern
  const res3 = ruleBasedParse("মুরাদ ৪০০ টাকা দিল");
  assert.ok(res3 && res3.type === "CONTRIBUTION");
  assert.strictEqual(res3.memberName, "মুরাদ");
  assert.strictEqual(res3.amountPaisa, 40000);
});

test("Rule parser: natural language expenses", () => {
  const res1 = ruleBasedParse("We spent 150 on grocery");
  assert.ok(res1 && res1.type === "EXPENSE");
  assert.strictEqual(res1.category, "GROCERY");
  assert.strictEqual(res1.amountPaisa, 15000);

  const res2 = ruleBasedParse("spent 80 for cleaning");
  assert.ok(res2 && res2.type === "EXPENSE");
  assert.strictEqual(res2.category, "CLEANING");
  assert.strictEqual(res2.amountPaisa, 8000);
});

test("Rule parser: /reverse command", () => {
  const res1 = ruleBasedParse("/reverse tx-12345");
  assert.ok(res1 && res1.type === "REVERSE");
  assert.strictEqual(res1.transactionId, "tx-12345");
});

test("Rule parser: non financial fallback returns null", () => {
  assert.strictEqual(ruleBasedParse("hello how are you"), null);
  assert.strictEqual(ruleBasedParse("what is the weather today"), null);
});
