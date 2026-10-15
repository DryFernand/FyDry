/**
 * Ahorro real del periodo: lo que se envía a cuentas de tipo "Ahorro" (menos lo que se retira de ellas)
 * más los gastos registrados como ahorro/inversión. La tasa de ahorro se calcula sobre los ingresos.
 */
import type { AccountItem, MovementItem, TransactionItem } from "../components/dashboard/types";

export const SAVINGS_CATEGORIES = ["Ahorro Programado", "Inversiones"];

export interface PeriodSavings {
  /** Traspasos hacia cuentas de ahorro */
  deposited: number;
  /** Retiros desde cuentas de ahorro hacia otras cuentas */
  withdrawn: number;
  /** Gastos en categorías de ahorro/inversión */
  categorized: number;
  /** Ahorro neto del periodo (puede ser negativo si retiraste más de lo que ahorraste) */
  net: number;
}

export function periodSavings(
  movements: MovementItem[],
  accounts: AccountItem[],
  expenses: TransactionItem[],
  inPeriod: (date: string) => boolean
): PeriodSavings {
  const savingsIds = new Set(accounts.filter((a) => a.type === "savings").map((a) => a.id));
  const savingsNames = new Set(accounts.filter((a) => a.type === "savings").map((a) => a.name));
  const isSavings = (id?: string, name?: string) => (id ? savingsIds.has(id) : !!name && savingsNames.has(name));

  let deposited = 0;
  let withdrawn = 0;
  for (const m of movements) {
    if (!inPeriod(m.date)) continue;
    const toSavings = isSavings(m.toAccountId, m.toAccount);
    const fromSavings = isSavings(m.fromAccountId, m.fromAccount);
    // Entre dos cuentas de ahorro no cambia el total ahorrado
    if (toSavings && !fromSavings) deposited += m.amount;
    if (fromSavings && !toSavings) withdrawn += m.amount;
  }
  const categorized = expenses
    .filter((e) => inPeriod(e.date) && SAVINGS_CATEGORIES.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    deposited: round(deposited),
    withdrawn: round(withdrawn),
    categorized: round(categorized),
    net: round(deposited - withdrawn + categorized),
  };
}

/** Porcentaje entero de ahorro sobre ingresos (0 si no hay ingresos o el ahorro neto es negativo). */
export function savingsRatePct(net: number, income: number): number {
  return income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
}
