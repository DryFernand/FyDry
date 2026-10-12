// Self-check (Node 22.6+): node lib/money.check.mjs
import assert from "node:assert/strict";
import { parseAmount, availableFunds, netWorthByCurrency, todayISO, formatMoney } from "./money.ts";

assert.equal(parseAmount("1,500"), 1500);
assert.equal(parseAmount("1,500.50"), 1500.5);
assert.equal(parseAmount("1.500,50"), 1500.5);
assert.equal(parseAmount("RD$ 2,000"), 2000);
assert.equal(parseAmount("12,5"), 12.5);
assert.equal(parseAmount("12.50"), 12.5);
assert.equal(parseAmount("1,234,567"), 1234567);
assert.ok(Number.isNaN(parseAmount("abc")));

const bank = { id: "1", name: "B", type: "bank", balance: 100, currency: "DOP", overdraftLimit: 50 };
const card = { id: "2", name: "V", type: "credit_card", balance: 300, currency: "DOP", creditLimit: 500 };
const usd = { id: "3", name: "U", type: "savings", balance: 20, currency: "USD" };
const noLimitCard = { id: "4", name: "N", type: "credit_card", balance: 10, currency: "DOP" };
assert.equal(availableFunds(bank), 150);
assert.equal(availableFunds(card), 200);
assert.equal(availableFunds(noLimitCard), Infinity);
assert.deepEqual(netWorthByCurrency([bank, card, usd]), { DOP: -200, USD: 20 });

// 23:30 hora local nunca salta al día siguiente
assert.equal(todayISO(new Date(2026, 9, 12, 23, 30)), "2026-10-12");
assert.equal(formatMoney(-1500, "DOP"), "-RD$ 1,500.00");

console.log("OK: money helpers");
