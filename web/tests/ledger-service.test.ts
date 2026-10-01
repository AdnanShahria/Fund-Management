import test from "node:test";
import assert from "node:assert/strict";
import {
  getFundSummary,
  getTransactions,
  createTransaction,
  getMembers,
  addMember,
  exportTransactionsCsv,
  reverseTransaction,
  resetLedger,
  verifyAdminSecret,
  verifyBotApiKey,
} from "../lib/db/ledger-service.ts";

test("getFundSummary: computes initial balance and reserves correctly", async () => {
  const summary = await getFundSummary();

  assert.equal(summary.id, "fund-room-302");
  assert.equal(summary.currency, "BDT");
  assert.equal(summary.openingBalancePaisa, 100000);
  assert.ok(summary.totalBalancePaisa > 0);
  assert.equal(
    summary.totalBalancePaisa,
    summary.openingBalancePaisa + summary.totalContributionsPaisa - summary.totalExpensesPaisa
  );
  assert.ok(summary.memberCount >= 5);
});

test("createTransaction: records a contribution and updates member total", async () => {
  const initialSummary = await getFundSummary();
  const membersBefore = await getMembers();
  const targetMember = membersBefore[0];
  assert.ok(targetMember, "Must have at least one member in the roster");

  const initialContributed = targetMember.contributedPaisa;
  const contributionPaisa = 150000; // 1500 BDT

  const newTx = await createTransaction({
    type: "CONTRIBUTION",
    memberId: targetMember.id,
    memberName: targetMember.displayName,
    description: "Extra contribution for feast",
    amountPaisa: contributionPaisa,
    source: "WEB",
    createdBy: "Treasurer Adnan",
  });

  assert.ok(newTx.id.startsWith("tx-"));
  assert.equal(newTx.type, "CONTRIBUTION");
  assert.equal(newTx.amountPaisa, 150000);
  assert.equal(newTx.status, "completed");

  const updatedSummary = await getFundSummary();
  assert.equal(
    updatedSummary.totalContributionsPaisa,
    initialSummary.totalContributionsPaisa + contributionPaisa
  );
  assert.equal(
    updatedSummary.totalBalancePaisa,
    initialSummary.totalBalancePaisa + contributionPaisa
  );

  const membersAfter = await getMembers();
  const updatedMember = membersAfter.find((m) => m.id === targetMember.id);
  assert.equal(updatedMember?.contributedPaisa, initialContributed + contributionPaisa);
});

test("createTransaction: records an expense as negative paisa", async () => {
  const initialSummary = await getFundSummary();
  const expensePaisa = 45000; // 450 BDT

  const expenseTx = await createTransaction({
    type: "EXPENSE",
    category: "GROCERY",
    description: "Weekly vegetables and fish",
    amountPaisa: expensePaisa,
    source: "WEB",
    createdBy: "Adnan Shahria",
  });

  assert.equal(expenseTx.type, "EXPENSE");
  assert.equal(expenseTx.amountPaisa, -45000);
  assert.equal(expenseTx.category, "GROCERY");

  const updatedSummary = await getFundSummary();
  assert.equal(
    updatedSummary.totalExpensesPaisa,
    initialSummary.totalExpensesPaisa + expensePaisa
  );
  assert.equal(
    updatedSummary.totalBalancePaisa,
    initialSummary.totalBalancePaisa - expensePaisa
  );
});

test("getTransactions: filters by type correctly", async () => {
  const allTxs = await getTransactions();
  const contributionTxs = await getTransactions({ type: "CONTRIBUTION" });
  const expenseTxs = await getTransactions({ type: "EXPENSE" });

  assert.ok(allTxs.length > 0);
  assert.ok(contributionTxs.length > 0);
  assert.ok(expenseTxs.length > 0);

  for (const tx of contributionTxs) {
    assert.equal(tx.type, "CONTRIBUTION");
  }

  for (const tx of expenseTxs) {
    assert.equal(tx.type, "EXPENSE");
  }
});

test("addMember: enrolls new member and increments roster count", async () => {
  const beforeMembers = await getMembers();
  const initialCount = beforeMembers.length;

  const newMember = await addMember({
    displayName: "Tariqul Islam",
    role: "MEMBER",
  });

  assert.ok(newMember.id.startsWith("mem-"));
  assert.equal(newMember.displayName, "Tariqul Islam");
  assert.equal(newMember.role, "MEMBER");
  assert.equal(newMember.status, "active");
  assert.equal(newMember.contributedPaisa, 0);

  const afterMembers = await getMembers();
  assert.equal(afterMembers.length, initialCount + 1);

  const summary = await getFundSummary();
  assert.equal(summary.memberCount, initialCount + 1);
});

test("exportTransactionsCsv: generates well formed CSV formatted data", async () => {
  const csv = await exportTransactionsCsv();

  assert.ok(typeof csv === "string");
  const lines = csv.split("\n");
  assert.ok(lines.length >= 2, "CSV should contain header and at least one data row");

  const header = lines[0];
  assert.equal(
    header,
    "Transaction ID,Date,Type,Party or Category,Description,Amount (BDT),Source,Status"
  );

  // Check first data row format
  const firstDataRow = lines[1];
  assert.ok(firstDataRow);
  assert.ok(firstDataRow.includes("BDT") || firstDataRow.split(",").length >= 7);
});

test("reverseTransaction: safely reverses transaction and adds compensating entry", async () => {
  const tx = await createTransaction({
    type: "CONTRIBUTION",
    memberName: "Adnan Shahria",
    amountPaisa: 5000,
    description: "Temporary contribution to test reversal",
  });

  const reversal = await reverseTransaction(tx.id, "Admin");
  assert.equal(reversal.success, true);
  assert.equal(reversal.reversedTx?.status, "reversed");
  assert.ok(reversal.correctionTx);
  assert.equal(reversal.correctionTx.amountPaisa, -5000);
});

test("resetLedger: switches between room fund and batch fund modes", async () => {
  const batchFund = await resetLedger("BATCH");
  assert.equal(batchFund.fundType, "BATCH");
  assert.equal(batchFund.name, "CSE Batch 2024 Central Fund");

  const roomFund = await resetLedger("ROOM");
  assert.equal(roomFund.fundType, "ROOM");
  assert.equal(roomFund.name, "Room 302 General Fund");
});

test("verifyAdminSecret and verifyBotApiKey: check keys accurately", async () => {
  const validAdmin = verifyAdminSecret("fundadmin2026");
  assert.equal(validAdmin, true);

  const invalidAdmin = verifyAdminSecret("wrongpassword");
  assert.equal(invalidAdmin, false);

  const validBot = verifyBotApiKey("bot-secret-key-2026");
  assert.equal(validBot, true);
});
