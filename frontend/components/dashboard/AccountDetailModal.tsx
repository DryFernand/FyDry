"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Edit3, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { AccountItem } from "./types";
import { formatMoney } from "@/lib/money";
import { fetchTransactionsApi, fetchMovementsApi, fetchUserSettingsApi } from "@/lib/api";
import { getCycleRange, formatCycleLabel } from "@/lib/cycle";
import { useEscapeKey } from "./ConfirmDialog";
import AccountCard from "./AccountCard";

interface Row {
  id: string;
  description: string;
  date: string;
  /** firmado: + entra, − sale */
  amount: number;
}

export default function AccountDetailModal({
  acc,
  onClose,
  onEdit,
}: {
  acc: AccountItem;
  onClose: () => void;
  onEdit: (acc: AccountItem) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cycleLabel, setCycleLabel] = useState("");
  const [loading, setLoading] = useState(true);
  useEscapeKey(true, onClose);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [txs, moves, settings] = await Promise.all([
        fetchTransactionsApi(),
        fetchMovementsApi(),
        fetchUserSettingsApi(),
      ]);
      if (!alive) return;
      const resetDay = settings?.budget_reset_day ?? 1;
      const { startDate, endDate } = getCycleRange(new Date(), resetDay);
      setCycleLabel(formatCycleLabel(startDate, endDate, resetDay));

      const inCycle = (d: string) => {
        const t = new Date(d);
        return t >= startDate && t <= endDate;
      };

      const out: Row[] = [];
      for (const t of txs) {
        if (t.account !== acc.name || !inCycle(t.date)) continue;
        out.push({ id: `t-${t.id}`, description: t.description || t.category, date: t.date, amount: t.type === "income" ? t.amount : -t.amount });
      }
      for (const m of moves) {
        if (!inCycle(m.date)) continue;
        if (m.toAccount === acc.name) out.push({ id: `mi-${m.id}`, description: m.description || `Transferencia de ${m.fromAccount}`, date: m.date, amount: m.toAmount ?? m.amount });
        if (m.fromAccount === acc.name) out.push({ id: `mo-${m.id}`, description: m.description || `Transferencia a ${m.toAccount}`, date: m.date, amount: -m.amount });
      }
      out.sort((a, b) => b.date.localeCompare(a.date));
      setRows(out);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [acc.name]);

  const isCredit = acc.type === "credit_card";
  const creditLimit = Number(acc.creditLimit) || 0;
  const overdraft = Number(acc.overdraftLimit) || 0;
  const minBalance = Number(acc.minBalance) || 0;

  const details: { label: string; value: string }[] = [{ label: "Moneda", value: acc.currency || "DOP" }];
  if (acc.cardNumber || acc.accountNumber) details.push({ label: isCredit || acc.type.includes("card") ? "Tarjeta" : "Cuenta", value: `•••• ${(acc.cardNumber || acc.accountNumber || "").replace(/\D/g, "").slice(-4)}` });
  if (isCredit) {
    details.push({ label: "Consumido", value: formatMoney(acc.balance, acc.currency) });
    if (creditLimit > 0) {
      details.push({ label: "Cupo total", value: formatMoney(creditLimit, acc.currency) });
      details.push({ label: "Disponible", value: formatMoney(creditLimit + overdraft - acc.balance, acc.currency) });
    }
    if (acc.cutoffDay) details.push({ label: "Día de corte", value: `Día ${acc.cutoffDay}` });
    if (acc.graceDays) details.push({ label: "Días de gracia", value: `${acc.graceDays} días` });
  } else {
    details.push({ label: "Saldo", value: formatMoney(acc.balance, acc.currency) });
    if (minBalance > 0) details.push({ label: "Saldo mínimo", value: formatMoney(minBalance, acc.currency) });
  }
  if (overdraft > 0) details.push({ label: "Sobregiro", value: formatMoney(overdraft, acc.currency) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-zinc-950 text-base leading-tight">{acc.name}</h3>
              <p className="text-[11px] text-zinc-400">Detalle de la cuenta</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onEdit(acc)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer" aria-label="Editar">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-[320px] mx-auto w-full">
            <AccountCard acc={acc} />
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 gap-2">
            {details.map((d) => (
              <div key={d.label} className="rounded-xl bg-zinc-50 border border-zinc-200/60 px-3 py-2">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wide">{d.label}</div>
                <div className="text-sm font-semibold text-zinc-900">{d.value}</div>
              </div>
            ))}
          </div>

          {/* Consumo de crédito */}
          {isCredit && creditLimit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Consumido {Math.round((acc.balance / creditLimit) * 100)}%</span>
                <span>{formatMoney(acc.balance, acc.currency)} / {formatMoney(creditLimit, acc.currency)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className={`h-full rounded-full ${acc.balance > creditLimit ? "bg-rose-500" : "bg-emerald-700"}`} style={{ width: `${Math.min(100, (acc.balance / creditLimit) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Movimientos del ciclo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-900">Movimientos del mes</h4>
              <span className="text-[10px] text-zinc-400">{cycleLabel}</span>
            </div>
            {loading ? (
              <p className="text-[11px] text-zinc-400 py-4 text-center">Cargando…</p>
            ) : rows.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-4 text-center">Sin movimientos en este ciclo.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${r.amount >= 0 ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-600"}`}>
                        {r.amount >= 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 truncate">{r.description}</p>
                        <p className="text-[10px] text-zinc-400">{new Date(r.date).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${r.amount >= 0 ? "text-green-700" : "text-zinc-900"}`}>
                      {r.amount >= 0 ? "+" : "−"}{formatMoney(Math.abs(r.amount), acc.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
