"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  PieChart,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
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

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function BudgetView() {
  const { t, language } = useLanguage();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);

  // Selector de mes y año activo
  const [selectedDate, setSelectedDate] = useState(() => new Date());

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

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  const isCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() === selectedYear && now.getMonth() === selectedMonth;
  };

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const monthLabel =
    language === "es"
      ? `${MONTH_NAMES_ES[selectedMonth]} ${selectedYear}`
      : `${MONTH_NAMES_EN[selectedMonth]} ${selectedYear}`;

  // Helper para verificar si un gasto pertenece al mes seleccionado
  const isExpenseInPeriod = (e: TransactionItem): boolean => {
    if (e.createdAt) {
      const d = new Date(e.createdAt);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }
    }
    if (e.date && e.date.includes("-")) {
      const parts = e.date.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          return y === selectedYear && m === selectedMonth;
        }
      }
    }
    // Fallback: Si no tiene fecha ISO, atribuir al mes actual
    const now = new Date();
    return selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  };

  // Filtrar gastos del mes seleccionado
  const monthlyExpenses = expenses.filter(isExpenseInPeriod);

  // Calcular gasto real acumulado por cada categoría en el mes seleccionado
  const budgetsWithSpent = budgets.map((b) => {
    const isTax =
      b.category.toLowerCase().includes("impuesto") &&
      !b.category.toLowerCase().includes("transporte") &&
      !b.category.toLowerCase().includes("taxi");

    const actualSpent = monthlyExpenses
      .filter((e) => {
        // Coincidencia exacta de categoría
        if (e.category.toLowerCase().trim() === b.category.toLowerCase().trim()) return true;
        // Solo si esta tarjeta es de Impuestos y el gasto también es estrictamente de impuesto
        if (
          isTax &&
          e.category.toLowerCase().includes("impuesto") &&
          !e.category.toLowerCase().includes("transporte") &&
          !e.category.toLowerCase().includes("taxi")
        ) {
          return true;
        }
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
    if (confirm("¿Estás seguro de eliminar este límite de presupuesto?")) {
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
      {/* Header with Month Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.budget.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.budget.subtitle} · Los límites se conservan cada mes
          </p>
        </div>

        {/* Month Selector Controls & New Budget Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegador de Meses */}
          <div className="flex items-center bg-zinc-100/90 rounded-2xl p-1 border border-zinc-200/60 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white hover:text-zinc-950 text-zinc-600 transition-all cursor-pointer shadow-2xs"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-zinc-900 min-w-[130px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{monthLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white hover:text-zinc-950 text-zinc-600 transition-all cursor-pointer shadow-2xs"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Mes Actual si está en otro mes */}
          {!isCurrentMonth() && (
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="flex items-center gap-1 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mes actual</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all font-semibold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.budget.adjustLimit || "Nuevo Presupuesto"}</span>
          </button>
        </div>
      </div>

      {/* Main Budget Summary */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.budget.globalConsumption || "Presupuesto Mensual"} ({monthLabel})
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-950">
                ${totalAllocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                / Gastado: ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-400 block">{t.budget.availableMargin || "Disponible"}</span>
              <span className="text-lg font-bold text-emerald-600">
                ${remainingBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-400 block">{t.budget.used || "Consumido"}</span>
              <span className={`text-lg font-bold ${overallPercentage > 90 ? "text-rose-600" : "text-zinc-950"}`}>
                {overallPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full transition-all ${
                overallPercentage > 100
                  ? "bg-rose-600"
                  : overallPercentage > 80
                  ? "bg-amber-500"
                  : "bg-zinc-950"
              }`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
            <span>$0.00</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetsWithSpent.map((b) => {
          const percentage = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
          const isOver = b.spent > b.allocated;

          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -2 }}
              onClick={() => openEditModal(b)}
              className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-400 transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-700">
                      <PieChart className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700">
                          {b.category}
                        </h3>
                        <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {monthLabel}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isOver
                        ? "bg-rose-50 text-rose-700"
                        : percentage > 80
                        ? "bg-amber-50 text-amber-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isOver ? "bg-rose-600" : percentage > 80 ? "bg-amber-500" : "bg-zinc-950"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Gastado</span>
                  <span className={`text-sm font-bold ${isOver ? "text-rose-600" : "text-zinc-950"}`}>
                    ${b.spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">{t.budget.assignedLimit || "Límite"}</span>
                  <span className="text-sm font-bold text-zinc-500">
                    ${b.allocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">No tienes categorías presupuestadas</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Define límites mensuales para tus gastos y recibe alertas preventivas cuando alcances el 80% de consumo.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Crear primer presupuesto
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Presupuesto */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-zinc-950 text-sm">
                    {editingBudget ? "Editar Límite de Presupuesto" : t.budget.modalTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.budget.category}
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allocated Amount */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.budget.monthlyLimit} ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAllocated}
                    onChange={(e) => setNewAllocated(e.target.value)}
                    placeholder="Ej. 500.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Este tope se renovará automáticamente cada mes.
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-2">
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
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      {editingBudget ? "Guardar Cambios" : t.budget.saveLimit || "Guardar Presupuesto"}
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
