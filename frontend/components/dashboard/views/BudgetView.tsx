"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  PieChart,
  Trash2,
  Edit3,
} from "lucide-react";
import { BudgetItem, TransactionItem } from "../types";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchBudgetsApi,
  createBudgetApi,
  updateBudgetApi,
  deleteBudgetApi,
  fetchTransactionsApi,
} from "@/lib/api";

export default function BudgetView() {
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);

  const [newCat, setNewCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [newAllocated, setNewAllocated] = useState("");

  const loadData = async () => {
    const [budData, expData] = await Promise.all([
      fetchBudgetsApi(),
      fetchTransactionsApi("expense"),
    ]);
    setBudgets(budData);
    setExpenses(expData);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  // Calcular gasto real acumulado por cada categoría presupuestada (incluye gastos e impuestos de transferencias)
  const budgetsWithSpent = budgets.map((b) => {
    const isTax =
      b.category.toLowerCase().includes("impuesto") ||
      b.category.toLowerCase().includes("tax") ||
      b.category.toLowerCase().includes("tasa") ||
      b.category.toLowerCase().includes("comisi");

    const actualSpent = expenses
      .filter((e) => {
        if (e.category.toLowerCase() === b.category.toLowerCase()) return true;
        if (isTax && (
          e.category.toLowerCase().includes("impuesto") ||
          e.category.toLowerCase().includes("tax") ||
          e.category.toLowerCase().includes("tasa")
        )) return true;
        return false;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      ...b,
      spent: actualSpent,
      isTaxCategory: isTax,
    };
  });

  const totalAllocated = budgetsWithSpent.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalSpent = budgetsWithSpent.reduce((acc, curr) => acc + curr.spent, 0);
  const remainingBudget = Math.max(totalAllocated - totalSpent, 0);
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const openCreateModal = () => {
    setEditingBudget(null);
    setNewCat(EXPENSE_CATEGORIES[0]);
    setNewAllocated("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: BudgetItem) => {
    setEditingBudget(b);
    setNewCat(b.category);
    setNewAllocated(b.allocated.toString());
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newAllocated) return;

    const parsedAllocated = parseFloat(newAllocated) || 0;

    if (editingBudget) {
      const updatedItem = {
        category: newCat,
        allocated: parsedAllocated,
      };
      setBudgets((prev) =>
        prev.map((item) => (item.id === editingBudget.id ? { ...item, ...updatedItem } : item))
      );
      await updateBudgetApi(editingBudget.id, updatedItem);
    } else {
      const created = await createBudgetApi({
        category: newCat,
        allocated: parsedAllocated,
        color: "bg-zinc-900",
      });
      setBudgets((prev) => [...prev, created]);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm("¿Deseas eliminar esta meta de presupuesto?")) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      await deleteBudgetApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingBudget(null);
    }
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
          onClick={openCreateModal}
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
              ${totalSpent.toFixed(2)} / ${totalAllocated.toFixed(2)}{" "}
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
        {budgetsWithSpent.map((b) => {
          const percent = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
          const isWarning = percent >= 85 && percent < 100;
          const isExceeded = percent >= 100;

          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -2 }}
              onClick={() => openEditModal(b)}
              className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3 cursor-pointer hover:border-zinc-400 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700">
                      {b.category}
                    </h3>
                    <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <span>{t.budget.assignedLimit}</span>
                    {b.isTaxCategory && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                        • Incluye impuestos de transferencias
                      </span>
                    )}
                  </div>
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
                  ${b.spent.toFixed(2)}{" "}
                  <span className="text-zinc-400 font-normal">/ ${b.allocated.toFixed(2)}</span>
                </span>
                <span className="text-zinc-500 font-medium">{percent}%</span>
              </div>

              <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${
                    isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-zinc-900"
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                <span>{t.budget.remainingLabel}</span>
                <span className="font-bold text-zinc-800">
                  ${Math.max(b.allocated - b.spent, 0).toFixed(2)}
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
              Define topes de gasto por categoría para recibir alertas antes de sobrepasar tu presupuesto.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.budget.adjustLimit}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingBudget ? "Editar Límite Presupuestario" : t.budget.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.budget.category} (Misma lista de 25 categorías)
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                  >
                    {EXPENSE_CATEGORIES.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
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
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingBudget ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(editingBudget.id)}
                      className="flex items-center gap-1 py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      {t.accounts.cancel}
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      {editingBudget ? "Guardar Cambios" : t.budget.saveLimit}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
