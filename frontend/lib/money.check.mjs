// Self-check (Node 22.6+): node lib/money.check.mjs
import assert from "node:assert/strict";
import { parseAmount, availableFunds, netWorthByCurrency, todayISO, formatMoney, formatAmountInput } from "./money.ts";

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

// Formato de miles al escribir; parseAmount lo lee de vuelta igual
assert.equal(formatAmountInput("1500000"), "1,500,000");
assert.equal(formatAmountInput("1,500,0001"), "15,000,001");
assert.equal(formatAmountInput("1500.567"), "1,500.56");
assert.equal(formatAmountInput("0005"), "5");
assert.equal(formatAmountInput(".5"), "0.5");
assert.equal(formatAmountInput("-2500", true), "-2,500");
assert.equal(formatAmountInput("-2500"), "2,500");
assert.equal(formatAmountInput("RD$ 30000"), "30,000");
for (const v of ["1,500,000", "1,500.56", "30,000", "999"]) assert.equal(parseAmount(formatAmountInput(v)), Number(v.replace(/,/g, "")));

console.log("OK: money helpers");
