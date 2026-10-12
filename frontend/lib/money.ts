import type { AccountItem } from "@/components/dashboard/types";

/** Tarjeta de crédito: su saldo es lo CONSUMIDO (deuda), igual que en el backend. */
export const isLiability = (acc: Pick<AccountItem, "type">) => acc.type === "credit_card";

/** Fecha local AAAA-MM-DD. `toISOString()` usa UTC y en RD (UTC-4) adelanta el día después de las 8 p.m. */
export function todayISO(d: Date = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Convierte texto de monto a número: "1,500.50", "1.500,50", "RD$ 2,000", "12,5".
 * Un separador único seguido de exactamente 3 dígitos se toma como de miles. NaN si no es válido.
 */
export function parseAmount(input: string | number): number {
  if (typeof input === "number") return input;
  const s = input.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(s)) return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSep = lastComma > lastDot ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    normalized = s.split(thousandsSep).join("").replace(decimalSep, ".");
  } else {
    const sep = lastComma >= 0 ? "," : lastDot >= 0 ? "." : "";
    if (!sep) {
      normalized = s;
    } else {
      const parts = s.split(sep);
      const isThousands = parts.length > 2 || parts[1].length === 3;
      normalized = isThousands ? parts.join("") : parts.join(".");
    }
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

/** Cuánto se puede gastar desde la cuenta. Tarjeta sin límite configurado -> Infinity. */
export function availableFunds(acc: AccountItem): number {
  const overdraft = Number(acc.overdraftLimit) || 0;
  if (isLiability(acc)) {
    const limit = (Number(acc.creditLimit) || 0) + overdraft;
    return limit > 0 ? limit - acc.balance : Infinity;
  }
  return acc.balance + overdraft;
}

/** Patrimonio neto por moneda: activos menos deuda de tarjetas. Nunca mezcla DOP con USD. */
export function netWorthByCurrency(accounts: AccountItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const acc of accounts) {
    const cur = acc.currency || "DOP";
    totals[cur] = (totals[cur] || 0) + (isLiability(acc) ? -acc.balance : acc.balance);
  }
  return totals;
}

export function currencySymbol(currency: string = "DOP"): string {
  switch (currency) {
    case "DOP":
      return "RD$";
    case "USD":
      return "US$";
    case "EUR":
      return "€";
    default:
      return currency;
  }
}

/** "RD$ 1,500.00" / "US$ 20.00" */
export function formatMoney(amount: number, currency: string = "DOP"): string {
  const value = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount < 0 ? "-" : ""}${currencySymbol(currency)} ${value}`;
}

/** Mensaje legible de un error del backend (detail string o lista de validación 422). */
export function apiErrorMessage(data: unknown, status: number): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
    return `Dato inválido${field ? ` en "${field}"` : ""}: ${first.msg || "revisa el formulario"}.`;
  }
  if (status === 401) return "Tu sesión expiró. Inicia sesión de nuevo.";
  return "No se pudo guardar. Intenta de nuevo.";
}
