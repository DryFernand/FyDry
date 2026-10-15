// Self-check (Node 22.6+): node lib/savings.check.mjs
import assert from "node:assert/strict";
import { periodSavings, savingsRatePct } from "./savings.ts";

const accounts = [
  { id: "pop", name: "Popular", type: "bank", balance: 0, currency: "DOP" },
  { id: "aho", name: "Ahorro BHD", type: "savings", balance: 0, currency: "DOP" },
  { id: "aho2", name: "Ahorro USD", type: "savings", balance: 0, currency: "USD" },
];
const movements = [
  { id: "1", fromAccount: "Popular", fromAccountId: "pop", toAccount: "Ahorro BHD", toAccountId: "aho", amount: 6000, description: "", date: "2026-10-15" },
  { id: "2", fromAccount: "Ahorro BHD", fromAccountId: "aho", toAccount: "Popular", toAccountId: "pop", amount: 1000, description: "", date: "2026-10-20" },
  { id: "3", fromAccount: "Ahorro BHD", fromAccountId: "aho", toAccount: "Ahorro USD", toAccountId: "aho2", amount: 500, description: "", date: "2026-10-21" }, // ahorro→ahorro no cuenta
  { id: "4", fromAccount: "Popular", fromAccountId: "pop", toAccount: "Ahorro BHD", toAccountId: "aho", amount: 9999, description: "", date: "2026-09-01" }, // otro periodo
];
const expenses = [
  { id: "e1", description: "Fondo", category: "Ahorro Programado", account: "Popular", amount: 2000, type: "expense", date: "2026-10-16" },
  { id: "e2", description: "Super", category: "Supermercado & Alimentación", account: "Popular", amount: 5000, type: "expense", date: "2026-10-16" },
];
const inOct = (d) => d >= "2026-10-01" && d <= "2026-10-31";

const s = periodSavings(movements, accounts, expenses, inOct);
assert.deepEqual(s, { deposited: 6000, withdrawn: 1000, categorized: 2000, net: 7000 });
assert.equal(savingsRatePct(s.net, 30000), 23); // 7,000 de 30,000
assert.equal(savingsRatePct(-500, 30000), 0);
assert.equal(savingsRatePct(100, 0), 0);
console.log("OK: ahorro del periodo");
