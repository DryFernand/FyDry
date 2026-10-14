// Self-check (Node 22.6+): node lib/planner.check.mjs
import assert from "node:assert/strict";
import { computePlan } from "./planner.ts";

const base = {
  version: 1,
  taxRate: 0.0015,
  accounts: [
    { id: "pop", name: "Popular", currency: "DOP", realBalance: 0, startBalance: "0", keep: "0" },
    { id: "bhd", name: "BHD", currency: "DOP", realBalance: 1000, startBalance: "1,000", keep: "0" },
  ],
  incomes: [{ id: "i1", label: "Quincena", amount: "30,000", accountId: "pop" }],
  expenses: [
    { id: "e1", accountId: "pop", label: "ITLA", amount: "5000", kind: "gasto", applyTax: false },
    { id: "e2", accountId: "pop", label: "Pasaje", amount: "2000", kind: "gasto", applyTax: false },
    { id: "e3", accountId: "bhd", label: "Pago tarjeta", amount: "8000", kind: "gasto", applyTax: true },
    { id: "e4", accountId: "bhd", label: "Ahorro", amount: "5000", kind: "ahorro", applyTax: false },
  ],
  transfers: [{ id: "t1", fromId: "pop", toId: "bhd", mode: "rest", amount: "", applyTax: true }],
};

// Ejemplo del usuario: Popular deja ITLA y pasaje y pasa el resto al BHD con 0.15%
let r = computePlan(base);
const pop = r.accounts[0];
const bhd = r.accounts[1];
// 23,000 disponibles: se transfiere el máximo que cabe con impuesto incluido
assert.equal(pop.outgoing[0].amount, 22965.55);
assert.equal(pop.outgoing[0].tax, 34.45);
assert.equal(pop.beforeExpenses, 7000);
assert.equal(pop.final, 0);
assert.equal(bhd.beforeExpenses, 23965.55); // 1,000 real + lo recibido
assert.equal(bhd.final, 23965.55 - 8000 - 12 - 5000); // pago tarjeta cobra 0.15% (12)
assert.equal(r.totals.savings, 5000);
assert.equal(r.totals.taxes, 46.45);
assert.deepEqual(r.errors, []);

// Mínimo a dejar en la cuenta reduce el resto
r = computePlan({ ...base, accounts: [{ ...base.accounts[0], keep: "1000" }, base.accounts[1]] });
// el resto con impuesto se redondea hacia abajo: puede quedar algún centavo, nunca menos del mínimo
assert.ok(r.accounts[0].final >= 1000 && r.accounts[0].final < 1000.05);

// Transferir de más se marca
r = computePlan({ ...base, transfers: [{ id: "t1", fromId: "pop", toId: "bhd", mode: "fixed", amount: "40000", applyTax: false }] });
assert.ok(r.accounts[0].issues.some((i) => i.includes("más de lo que tiene")));

// Ciclo de "resto" se detecta
r = computePlan({
  ...base,
  transfers: [
    { id: "a", fromId: "pop", toId: "bhd", mode: "rest", amount: "", applyTax: false },
    { id: "b", fromId: "bhd", toId: "pop", mode: "rest", amount: "", applyTax: false },
  ],
});
assert.equal(r.errors.length, 1);

console.log("OK: calculadora de quincena");
