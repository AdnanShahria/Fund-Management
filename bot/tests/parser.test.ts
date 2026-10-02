import test from "node:test";
import assert from "node:assert/strict";
import { ruleBasedParse, type ParsedIntent } from "../src/lib/parser.ts";

function assertContribution(
  res: ParsedIntent | null
): asserts res is Extract<ParsedIntent, { type: "CONTRIBUTION" }> {
  assert.ok(res && res.type === "CONTRIBUTION", "Expected CONTRIBUTION intent");
}

function assertExpense(
  res: ParsedIntent | null
): asserts res is Extract<ParsedIntent, { type: "EXPENSE" }> {
  assert.ok(res && res.type === "EXPENSE", "Expected EXPENSE intent");
}

function assertReverse(
  res: ParsedIntent | null
): asserts res is Extract<ParsedIntent, { type: "REVERSE" }> {
  assert.ok(res && res.type === "REVERSE", "Expected REVERSE intent");
}

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
  assertContribution(res1);
  assert.strictEqual(res1.memberName, "Murad");
  assert.strictEqual(res1.amountPaisa, 20000);

  // Decimal amount in taka converted to paisa
  const res2 = ruleBasedParse("/add Murad 150.50");
  assertContribution(res2);
  assert.strictEqual(res2.amountPaisa, 15050);

  // Multi word member name with note
  const res3 = ruleBasedParse("/add Murad Hasan 500 monthly deposit");
  assertContribution(res3);
  assert.strictEqual(res3.memberName, "Murad Hasan");
  assert.strictEqual(res3.amountPaisa, 50000);
  assert.strictEqual(res3.description, "monthly deposit");

  // Currency symbols and suffixes
  const res4 = ruleBasedParse("/add Rahim 300tk");
  assertContribution(res4);
  assert.strictEqual(res4.amountPaisa, 30000);
});

test("Rule parser: /expense command with categories", () => {
  // Amount first, category second
  const res1 = ruleBasedParse("/expense 90 grocery");
  assertExpense(res1);
  assert.strictEqual(res1.category, "GROCERY");
  assert.strictEqual(res1.amountPaisa, 9000);

  // Category first, amount second
  const res2 = ruleBasedParse("/expense electricity 250");
  assertExpense(res2);
  assert.strictEqual(res2.category, "ELECTRICITY");
  assert.strictEqual(res2.amountPaisa, 25000);

  // Unknown category defaults to OTHER
  const res3 = ruleBasedParse("/expense 100 miscellaneous");
  assertExpense(res3);
  assert.strictEqual(res3.category, "OTHER");
  assert.strictEqual(res3.amountPaisa, 10000);
});

test("Rule parser: natural language contributions", () => {
  // English gave pattern
  const res1 = ruleBasedParse("Murad gave 300 tk");
  assertContribution(res1);
  assert.strictEqual(res1.memberName, "Murad");
  assert.strictEqual(res1.amountPaisa, 30000);

  // English contributed pattern
  const res2 = ruleBasedParse("Adnan contributed 500");
  assertContribution(res2);
  assert.strictEqual(res2.memberName, "Adnan");
  assert.strictEqual(res2.amountPaisa, 50000);

  // Bengali paid pattern
  const res3 = ruleBasedParse("মুরাদ ৪০০ টাকা দিল");
  assertContribution(res3);
  assert.strictEqual(res3.memberName, "মুরাদ");
  assert.strictEqual(res3.amountPaisa, 40000);
});

test("Rule parser: natural language expenses", () => {
  const res1 = ruleBasedParse("We spent 150 on grocery");
  assertExpense(res1);
  assert.strictEqual(res1.category, "GROCERY");
  assert.strictEqual(res1.amountPaisa, 15000);

  const res2 = ruleBasedParse("spent 80 for cleaning");
  assertExpense(res2);
  assert.strictEqual(res2.category, "CLEANING");
  assert.strictEqual(res2.amountPaisa, 8000);
});

test("Rule parser: /reverse command", () => {
  const res1 = ruleBasedParse("/reverse tx-12345");
  assertReverse(res1);
  assert.strictEqual(res1.transactionId, "tx-12345");
});

test("Rule parser: natural language expenses with category first and amount first", () => {
  const res1 = ruleBasedParse("bazar 450 tk");
  assertExpense(res1);
  assert.strictEqual(res1.category, "GROCERY");
  assert.strictEqual(res1.amountPaisa, 45000);

  const res2 = ruleBasedParse("450 tk bazar");
  assertExpense(res2);
  assert.strictEqual(res2.category, "GROCERY");
  assert.strictEqual(res2.amountPaisa, 45000);

  const res3 = ruleBasedParse("electricity 250");
  assertExpense(res3);
  assert.strictEqual(res3.category, "ELECTRICITY");
  assert.strictEqual(res3.amountPaisa, 25000);
});

test("Rule parser: natural language inquiries and conversational chat", () => {
  const res1 = ruleBasedParse("dashboard link?");
  assert.ok(res1 && res1.type === "CHAT");
  assert.match(res1.reply, /fvmas16\.pages\.dev/);

  const res2 = ruleBasedParse("now");
  assert.ok(res2 && res2.type === "CHAT");
  assert.match(res2.reply, /I am ready/);

  const res3 = ruleBasedParse("how much balance left");
  assert.deepStrictEqual(res3, { type: "BALANCE" });

  const res4 = ruleBasedParse("show summary");
  assert.deepStrictEqual(res4, { type: "SUMMARY" });

  const res5 = ruleBasedParse("recent transactions");
  assert.deepStrictEqual(res5, { type: "HISTORY" });

  const res6 = ruleBasedParse("who is in this fund members");
  assert.deepStrictEqual(res6, { type: "MEMBERS" });
});

test("Rule parser: non financial fallback returns null", () => {
  assert.strictEqual(ruleBasedParse("hello how are you"), null);
  assert.strictEqual(ruleBasedParse("what is the weather today"), null);
});

