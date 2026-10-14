/**
 * Calculadora de quincena: reparte ingresos entre cuentas, descuenta gastos planificados y calcula
 * cuánto transferir a cada cuenta (monto fijo o "el resto"), con el impuesto DGII por transferencia.
 * Lógica pura: no toca datos reales; los montos se guardan como texto tal como los escribe el usuario.
 */
import { parseAmount, transferTax } from "./money.ts";

export interface PlanAccount {
  id: string;
  name: string;
  currency: string;
  /** Saldo real de la cuenta al momento de planificar */
  realBalance: number;
  /** Saldo usado como punto de partida (por defecto el real; editable) */
  startBalance: string;
  /** Monto mínimo a dejar en la cuenta al calcular "el resto" */
  keep: string;
}

export interface PlanIncome {
  id: string;
  label: string;
  amount: string;
  accountId: string;
}

export interface PlanExpense {
  id: string;
  accountId: string;
  label: string;
  amount: string;
  kind: "gasto" | "ahorro";
  /** Cobra impuesto DGII (ej. pago de tarjeta desde el banco) */
  applyTax: boolean;
}

export interface PlanTransfer {
  id: string;
  fromId: string;
  toId: string;
  mode: "fixed" | "rest";
  amount: string;
  applyTax: boolean;
}

export interface PlanData {
  version: 1;
  taxRate: number;
  accounts: PlanAccount[];
  incomes: PlanIncome[];
  expenses: PlanExpense[];
  transfers: PlanTransfer[];
}

export interface AccountResult {
  id: string;
  name: string;
  currency: string;
  start: number;
  incomes: { label: string; amount: number }[];
  incoming: { from: string; amount: number }[];
  outgoing: { id: string; to: string; amount: number; tax: number; mode: "fixed" | "rest" }[];
  expenses: { id: string; label: string; amount: number; tax: number; kind: "gasto" | "ahorro" }[];
  /** Saldo después de entradas y transferencias, antes de pagar los gastos planificados */
  beforeExpenses: number;
  /** Saldo final con los gastos aplicados */
  final: number;
  issues: string[];
}

export interface PlanResult {
  accounts: AccountResult[];
  totals: {
    income: number;
    transferred: number;
    taxes: number;
    expenses: number;
    savings: number;
    finalTotal: number;
  };
  errors: string[];
}

const round = (n: number) => Math.round(n * 100) / 100;
const num = (text: string) => {
  const n = parseAmount(text || "");
  return Number.isFinite(n) ? n : 0;
};

export function computePlan(plan: PlanData): PlanResult {
  const errors: string[] = [];
  const byId = new Map(plan.accounts.map((a) => [a.id, a]));
  const name = (id: string) => byId.get(id)?.name || "Cuenta";

  const results = new Map<string, AccountResult>(
    plan.accounts.map((a) => [
      a.id,
      {
        id: a.id,
        name: a.name,
        currency: a.currency,
        start: num(a.startBalance),
        incomes: [],
        incoming: [],
        outgoing: [],
        expenses: [],
        beforeExpenses: 0,
        final: 0,
        issues: [],
      },
    ])
  );

  for (const inc of plan.incomes) {
    const r = results.get(inc.accountId);
    if (r && num(inc.amount) > 0) r.incomes.push({ label: inc.label || "Ingreso", amount: num(inc.amount) });
  }
  for (const e of plan.expenses) {
    const r = results.get(e.accountId);
    const amount = num(e.amount);
    if (r && amount > 0) {
      r.expenses.push({ id: e.id, label: e.label || "Gasto", amount, tax: e.applyTax ? transferTax(amount, plan.taxRate) : 0, kind: e.kind });
    }
  }

  // Transferencias válidas (ambas cuentas en el plan, distintas, misma moneda)
  const valid = plan.transfers.filter((t) => {
    const from = results.get(t.fromId);
    const to = results.get(t.toId);
    if (!from || !to) return false;
    if (t.fromId === t.toId) {
      from.issues.push("Una transferencia no puede ir a la misma cuenta.");
      return false;
    }
    if (from.currency !== to.currency) {
      from.issues.push(`No se puede transferir a ${to.name}: usa otra moneda.`);
      return false;
    }
    return true;
  });

  // Las transferencias fijas se conocen de entrada
  const amounts = new Map<string, number>();
  for (const t of valid) if (t.mode === "fixed") amounts.set(t.id, num(t.amount));

  // "El resto" depende de lo que entra a la cuenta: se resuelven en orden (cadena Popular → BHD → ...)
  const restBySource = new Map<string, PlanTransfer>();
  for (const t of valid.filter((t) => t.mode === "rest")) {
    if (restBySource.has(t.fromId)) {
      results.get(t.fromId)!.issues.push('Solo puede haber un "resto" por cuenta.');
      amounts.set(t.id, 0);
    } else {
      restBySource.set(t.fromId, t);
    }
  }

  const pending = new Set(restBySource.keys());
  let progressed = true;
  while (pending.size > 0 && progressed) {
    progressed = false;
    for (const accountId of [...pending]) {
      // Se puede calcular cuando todo "resto" que le llega ya está resuelto
      const blocked = valid.some((t) => t.toId === accountId && t.mode === "rest" && !amounts.has(t.id));
      if (blocked) continue;
      const t = restBySource.get(accountId)!;
      const a = byId.get(accountId)!;
      const r = results.get(accountId)!;
      const inflow = r.start + r.incomes.reduce((s, x) => s + x.amount, 0) +
        valid.filter((x) => x.toId === accountId).reduce((s, x) => s + (amounts.get(x.id) || 0), 0);
      const fixedOut = valid
        .filter((x) => x.fromId === accountId && x.mode === "fixed")
        .reduce((s, x) => s + num(x.amount) + (x.applyTax ? transferTax(num(x.amount), plan.taxRate) : 0), 0);
      const spend = r.expenses.reduce((s, x) => s + x.amount + x.tax, 0);
      const available = inflow - fixedOut - spend - num(a.keep);
      // Si cobra impuesto, se transfiere lo máximo que cabe con el impuesto incluido
      const amount = available > 0 ? (t.applyTax ? Math.floor((available / (1 + plan.taxRate)) * 100) / 100 : round(available)) : 0;
      if (available <= 0) r.issues.push('No queda nada para transferir como "resto".');
      amounts.set(t.id, amount);
      pending.delete(accountId);
      progressed = true;
    }
  }
  if (pending.size > 0) {
    errors.push(`Hay un ciclo de "resto" entre ${[...pending].map(name).join(", ")}. Cambia alguna transferencia a monto fijo.`);
    for (const id of pending) amounts.set(restBySource.get(id)!.id, 0);
  }

  for (const t of valid) {
    const amount = round(amounts.get(t.id) || 0);
    const tax = t.applyTax ? transferTax(amount, plan.taxRate) : 0;
    results.get(t.fromId)!.outgoing.push({ id: t.id, to: name(t.toId), amount, tax, mode: t.mode });
    results.get(t.toId)!.incoming.push({ from: name(t.fromId), amount });
  }

  for (const r of results.values()) {
    const inflow = r.start + r.incomes.reduce((s, x) => s + x.amount, 0) + r.incoming.reduce((s, x) => s + x.amount, 0);
    const out = r.outgoing.reduce((s, x) => s + x.amount + x.tax, 0);
    r.beforeExpenses = round(inflow - out);
    r.final = round(r.beforeExpenses - r.expenses.reduce((s, x) => s + x.amount + x.tax, 0));
    if (r.beforeExpenses < 0) r.issues.push("Transfieres más de lo que tiene la cuenta.");
    else if (r.final < 0) r.issues.push(`Faltan ${Math.abs(r.final).toLocaleString("en-US", { minimumFractionDigits: 2 })} para cubrir los gastos.`);
  }

  const accounts = plan.accounts.map((a) => results.get(a.id)!);
  const all = <T,>(pick: (r: AccountResult) => T[]) => accounts.flatMap(pick);
  return {
    accounts,
    errors,
    totals: {
      income: round(all((r) => r.incomes).reduce((s, x) => s + x.amount, 0)),
      transferred: round(all((r) => r.outgoing).reduce((s, x) => s + x.amount, 0)),
      taxes: round(all((r) => r.outgoing).reduce((s, x) => s + x.tax, 0) + all((r) => r.expenses).reduce((s, x) => s + x.tax, 0)),
      expenses: round(all((r) => r.expenses).filter((x) => x.kind === "gasto").reduce((s, x) => s + x.amount, 0)),
      savings: round(all((r) => r.expenses).filter((x) => x.kind === "ahorro").reduce((s, x) => s + x.amount, 0)),
      finalTotal: round(accounts.reduce((s, r) => s + r.final, 0)),
    },
  };
}

/** "Quincena 15 oct 2026" */
export function autoPlanName(d: Date = new Date()): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `Quincena ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Resumen en texto plano para copiar (WhatsApp, notas). */
export function planSummaryText(title: string, result: PlanResult, fmt: (n: number) => string): string {
  const lines = [`📋 ${title}`, `Ingresos: ${fmt(result.totals.income)}`, ""];
  for (const r of result.accounts) {
    if (!r.incomes.length && !r.incoming.length && !r.outgoing.length && !r.expenses.length) continue;
    lines.push(`🏦 ${r.name} (saldo actual ${fmt(r.start)})`);
    for (const t of r.outgoing) lines.push(`  → Transferir ${fmt(t.amount)} a ${t.to}${t.tax ? ` (impuesto ${fmt(t.tax)})` : ""}`);
    for (const e of r.expenses) lines.push(`  − ${e.label}: ${fmt(e.amount)}${e.kind === "ahorro" ? " (ahorro)" : ""}`);
    lines.push(`  = Queda: ${fmt(r.final)}`, "");
  }
  lines.push(
    `Transferencias: ${fmt(result.totals.transferred)}`,
    `Impuestos: ${fmt(result.totals.taxes)}`,
    `Gastos: ${fmt(result.totals.expenses)}`,
    `Ahorro: ${fmt(result.totals.savings)}`,
    `Te quedan: ${fmt(result.totals.finalTotal)}`
  );
  return lines.join("\n");
}
