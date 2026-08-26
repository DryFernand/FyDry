"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { DebtItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

export default function DebtsView() {
  const { t } = useLanguage();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [creditor, setCreditor] = useState("");
  const [type, setType] = useState("Préstamo Personal");
  const [total, setTotal] = useState("");
  const [remaining, setRemaining] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");

  const totalRemaining = debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalMonthlyCommitment = debts.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const totalOriginalPrincipal = debts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalAmortized = Math.max(totalOriginalPrincipal - totalRemaining, 0);
  const liquidationPercent =
    totalOriginalPrincipal > 0 ? Math.round((totalAmortized / totalOriginalPrincipal) * 100) : 100;

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor || !remaining) return;

    const newD: DebtItem = {
      id: `debt-${Date.now()}`,
      creditor,
      type,
      totalAmount: parseFloat(total) || parseFloat(remaining),
      remainingAmount: parseFloat(remaining) || 0,
      monthlyPayment: parseFloat(monthly) || 0,
      interestRate: parseFloat(rate) || 0,
      dueDate: "Fin de mes",
    };

    setDebts([...debts, newD]);
    setCreditor("");
    setTotal("");
    setRemaining("");
    setMonthly("");
    setRate("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.debts.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.debts.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.debts.addDebt}</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.debts.totalPendingDebt}</span>
          <div className="text-2xl font-bold tracking-tight text-rose-600">
            ${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {debts.length} {t.debts.activeDebts}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.debts.monthlyCommitment}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalMonthlyCommitment.toLocaleString("en-US", { minimumFractionDigits: 2 })} / mes
          </div>
          <div className="text-[11px] text-zinc-400">{t.debts.recurringPayment}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.debts.liquidationProgress}</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            {liquidationPercent}% {t.debts.paidTag}
          </div>
          <div className="text-[11px] text-zinc-400">{t.debts.goodPace}</div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        {debts.map((d) => {
          const paidAmount = d.totalAmount - d.remainingAmount;
          const percentPaid = d.totalAmount > 0 ? Math.round((paidAmount / d.totalAmount) * 100) : 0;

          return (
            <motion.div
              key={d.id}
              whileHover={{ y: -2 }}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                    {d.type.includes("Tarjeta") ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">{d.creditor}</h3>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span>{d.type}</span>
                      <span>•</span>
                      <span>TIN: {d.interestRate}%</span>
                      <span>•</span>
                      <span>{d.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-base font-bold text-rose-600">
                    ${d.remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                    <span className="text-xs text-zinc-400 font-normal">
                      de ${d.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">
                    {t.debts.monthlyFee}: ${d.monthlyPayment}/mes
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>{t.debts.amortized}: ${paidAmount.toLocaleString()}</span>
                  <span>{percentPaid}% {t.debts.completed}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-emerald-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${percentPaid}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        {debts.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-zinc-900">¡Libre de deudas! Cero compromisos pendientes</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No tienes préstamos ni deudas registradas. Si tienes compromisos bancarios o tarjetas de crédito a plazo, regístralas para monitorear su amortización.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.debts.addDebt}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-950">{t.debts.modalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.debts.creditor}
                  </label>
                  <input
                    type="text"
                    required
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    placeholder="Ej. Banco Santander, Préstamo familiar..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.totalOriginal}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.pendingBalance}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={remaining}
                      onChange={(e) => setRemaining(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.monthlyPaymentInput}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthly}
                      onChange={(e) => setMonthly(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.interestRateInput}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="Ej. 6.5"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    {t.accounts.cancel}
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    {t.debts.saveDebt}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
