"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  PieChart,
} from "lucide-react";
import { BudgetItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

export default function BudgetView() {
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newAllocated, setNewAllocated] = useState("");

  const totalAllocated = budgets.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
  const remainingBudget = Math.max(totalAllocated - totalSpent, 0);
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newAllocated) return;

    const newB: BudgetItem = {
      id: `b-${Date.now()}`,
      category: newCat,
      allocated: parseFloat(newAllocated) || 0,
      spent: 0,
      color: "bg-zinc-800",
    };

    setBudgets([...budgets, newB]);
    setNewCat("");
    setNewAllocated("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.budget.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.budget.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.budget.adjustLimit}</span>
        </button>
      </div>

      {/* Progress summary card */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-zinc-500">
              {t.budget.globalConsumption}
            </span>
            <div className="text-2xl font-bold text-zinc-950">
              ${totalSpent} / ${totalAllocated}{" "}
              <span className="text-xs text-zinc-400 font-normal">
                ({overallPercentage}% {t.budget.used})
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-zinc-500">{t.budget.availableMargin}</span>
            <div className="text-xl font-bold text-emerald-600">
              ${remainingBudget.toFixed(2)} {t.budget.remaining}
            </div>
          </div>
        </div>

        <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="bg-zinc-950 h-2.5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Budget Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const percent = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
          const isWarning = percent >= 85 && percent < 100;
          const isExceeded = percent >= 100;

          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -2 }}
              className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">{b.category}</h3>
                  <span className="text-[11px] text-zinc-400">
                    {t.budget.assignedLimit}
                  </span>
                </div>
                {isExceeded ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] font-bold">
                    {t.budget.exceeded}
                  </span>
                ) : isWarning ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold">
                    {t.budget.warning85}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    {t.budget.inRange}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="font-bold text-zinc-900">
                  ${b.spent}{" "}
                  <span className="text-zinc-400 font-normal">/ ${b.allocated}</span>
                </span>
                <span className="text-zinc-500 font-medium">{percent}%</span>
              </div>

              <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${
                    isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : b.color
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                <span>{t.budget.remainingLabel}</span>
                <span className="font-bold text-zinc-800">
                  ${Math.max(b.allocated - b.spent, 0)}
                </span>
              </div>
            </motion.div>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-zinc-900">Sin límites presupuestarios definidos</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Define topes de gasto por categoría (Vivienda, Alimentación, Ocio) para recibir alertas antes de sobrepasar tu presupuesto.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.budget.adjustLimit}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Adjust Budget Modal */}
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
                <h3 className="text-lg font-bold text-zinc-950">{t.budget.modalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.budget.category}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Ej. Ocio, Gimnasio, Ropa..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.budget.monthlyLimit}
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newAllocated}
                    onChange={(e) => setNewAllocated(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
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
                    {t.budget.saveLimit}
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
