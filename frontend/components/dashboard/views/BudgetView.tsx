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
  CalendarDays,
  Clock,
  Layers,
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

type BudgetPeriodView = "monthly" | "biweekly" | "weekly";

export default function BudgetView() {
  const { t, language } = useLanguage();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);

  // 3 Vistas de periodicidad: Mensual (base), Quincenal (÷2), Semanal (÷4)
  const [periodView, setPeriodView] = useState<BudgetPeriodView>("monthly");

  // Sub-período interactivo para Quincenal (1 o 2) y Semanal (1, 2, 3, 4)
  const [selectedFortnight, setSelectedFortnight] = useState<1 | 2>(() => {
    const today = new Date().getDate();
    return today <= 15 ? 1 : 2;
  });

  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4>(() => {
    const today = new Date().getDate();
    if (today <= 7) return 1;
    if (today <= 14) return 2;
    if (today <= 21) return 3;
    return 4;
  });

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
    const today = new Date().getDate();
    setSelectedFortnight(today <= 15 ? 1 : 2);
    setSelectedWeek(today <= 7 ? 1 : today <= 14 ? 2 : today <= 21 ? 3 : 4);
  };

  const monthLabel =
    language === "es"
      ? `${MONTH_NAMES_ES[selectedMonth]} ${selectedYear}`
      : `${MONTH_NAMES_EN[selectedMonth]} ${selectedYear}`;

  // Helper para extraer el día y verificar pertenencia al sub-período
  const getExpenseDateInfo = (e: TransactionItem): { year: number; month: number; day: number } => {
    if (e.createdAt) {
      const d = new Date(e.createdAt);
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      }
    }
    if (e.date && e.date.includes("-")) {
      const parts = e.date.split("-");
      if (parts.length >= 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        if (!isNaN(y) && !isNaN(m) && !isNaN(day)) {
          return { year: y, month: m, day };
        }
      } else if (parts.length === 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          return { year: y, month: m, day: 1 };
        }
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  };

  // Helper para verificar si un gasto pertenece al mes y sub-período seleccionado
  const isExpenseInPeriod = (e: TransactionItem): boolean => {
    const { year, month, day } = getExpenseDateInfo(e);
    if (year !== selectedYear || month !== selectedMonth) {
      return false;
    }

    if (periodView === "monthly") {
      return true;
    }

    if (periodView === "biweekly") {
      if (selectedFortnight === 1) {
        return day <= 15;
      } else {
        return day >= 16;
      }
    }

    if (periodView === "weekly") {
      if (selectedWeek === 1) return day <= 7;
      if (selectedWeek === 2) return day >= 8 && day <= 14;
      if (selectedWeek === 3) return day >= 15 && day <= 21;
      return day >= 22;
    }

    return true;
  };

  // Multiplicador de límite según la vista
  const periodMultiplier = periodView === "monthly" ? 1 : periodView === "biweekly" ? 0.5 : 0.25;

  // Filtrar gastos del sub-período seleccionado
  const filteredExpenses = expenses.filter(isExpenseInPeriod);

  // Calcular gasto real acumulado y límite adaptado por cada categoría
  const budgetsWithSpent = budgets.map((b) => {
    const isTax =
      b.category.toLowerCase().includes("impuesto") &&
      !b.category.toLowerCase().includes("transporte") &&
      !b.category.toLowerCase().includes("taxi");

    const actualSpent = filteredExpenses
      .filter((e) => {
        if (e.category.toLowerCase().trim() === b.category.toLowerCase().trim()) return true;
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

    const periodAllocated = b.allocated * periodMultiplier;

    return {
      ...b,
      baseMonthlyAllocated: b.allocated,
      allocated: periodAllocated,
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

  const openEditModal = (b: BudgetItem & { baseMonthlyAllocated?: number }) => {
    setEditingBudget(b);
    setNewCat(b.category);
    // Cargar el límite base mensual al editar
    setNewAllocated((b.baseMonthlyAllocated || b.allocated).toString());
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

  // Etiqueta del período activo
  const getPeriodSubLabel = () => {
    if (periodView === "monthly") return `Mes de ${monthLabel}`;
    if (periodView === "biweekly") {
      return selectedFortnight === 1
        ? `1ra Quincena (Días 1-15) · ${monthLabel}`
        : `2da Quincena (Días 16-Fin) · ${monthLabel}`;
    }
    if (periodView === "weekly") {
      const weekRanges = ["Días 1-7", "Días 8-14", "Días 15-21", "Días 22-Fin"];
      return `Semana ${selectedWeek} (${weekRanges[selectedWeek - 1]}) · ${monthLabel}`;
    }
    return monthLabel;
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Navigator & Period Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              {t.budget.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200/60 uppercase">
              {periodView === "monthly" ? "Mensual" : periodView === "biweekly" ? "Quincenal" : "Semanal"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {getPeriodSubLabel()} · {periodView === "monthly" ? "Límites mensuales" : periodView === "biweekly" ? "Límites quincenales" : "Límites semanales"}
          </p>
        </div>

        {/* Controls: Period Tabs + Month Selector + New Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de 3 Vistas: Mensual, Quincenal, Semanal */}
          <div className="flex items-center bg-zinc-100/90 rounded-2xl p-1 border border-zinc-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setPeriodView("monthly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodView === "monthly"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mensual</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriodView("biweekly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodView === "biweekly"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Quincenal</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriodView("weekly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodView === "weekly"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Semanal</span>
            </button>
          </div>

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

            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-zinc-900 min-w-[125px] justify-center">
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

          {/* Botón Mes Actual */}
          {!isCurrentMonth() && (
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="flex items-center gap-1 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoy</span>
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

      {/* Sub-selector de Quincenas o Semanas */}
      {periodView !== "monthly" && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <Layers className="w-4 h-4 text-zinc-600" />
            <span>{periodView === "biweekly" ? "Seleccionar Quincena:" : "Seleccionar Semana:"}</span>
          </div>

          {periodView === "biweekly" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFortnight(1)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedFortnight === 1
                    ? "bg-zinc-950 text-white shadow-2xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                1ra Quincena (Días 1 - 15)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFortnight(2)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedFortnight === 2
                    ? "bg-zinc-950 text-white shadow-2xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                2da Quincena (Días 16 - Fin)
              </button>
            </div>
          )}

          {periodView === "weekly" && (
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 1, label: "Semana 1 (1-7)" },
                  { id: 2, label: "Semana 2 (8-14)" },
                  { id: 3, label: "Semana 3 (15-21)" },
                  { id: 4, label: "Semana 4 (22+)" },
                ] as const
              ).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWeek(w.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedWeek === w.id
                      ? "bg-zinc-950 text-white shadow-2xs"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Budget Summary */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {periodView === "monthly"
                ? `Presupuesto Mensual (${monthLabel})`
                : periodView === "biweekly"
                ? `Presupuesto Quincenal · Q${selectedFortnight} (${monthLabel})`
                : `Presupuesto Semanal · S${selectedWeek} (${monthLabel})`}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-950">
                ${totalAllocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                / Gastado en el período: ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                        {periodView === "monthly" ? "Tope Mensual" : periodView === "biweekly" ? `Quincena ${selectedFortnight}` : `Semana ${selectedWeek}`}
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

              <div className="pt-2 border-t border-zinc-100 space-y-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Gastado en período</span>
                    <span className={`text-sm font-bold ${isOver ? "text-rose-600" : "text-zinc-950"}`}>
                      ${b.spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">
                      {periodView === "monthly" ? "Límite Mes" : periodView === "biweekly" ? "Límite Quincenal" : "Límite Semanal"}
                    </span>
                    <span className="text-sm font-bold text-zinc-500">
                      ${b.allocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {periodView !== "monthly" && (
                  <div className="text-[10px] text-zinc-400 text-right">
                    Base mensual: ${b.baseMonthlyAllocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                )}
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
              Define presupuestos mensuales y consulta tus metas en vistas quincenales y semanales.
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

      {/* Modal Crear / Editar Presupuesto (Siempre base Mensual) */}
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
                    {editingBudget ? "Editar Límite Mensual" : "Nuevo Presupuesto Mensual"}
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

                {/* Allocated Amount (Mensual Principal) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Límite Mensual ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAllocated}
                    onChange={(e) => setNewAllocated(e.target.value)}
                    placeholder="Ej. 1000.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />

                  {/* Equivalencias automáticas en tiempo real */}
                  {parseFloat(newAllocated) > 0 && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Quincenal:</span>
                        <span className="font-bold text-zinc-900">
                          ${(parseFloat(newAllocated) / 2).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Semanal:</span>
                        <span className="font-bold text-zinc-900">
                          ${(parseFloat(newAllocated) / 4).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-400 mt-1.5 block">
                    Este monto base se renovará mensualmente y se dividirá en las vistas quincenales y semanales.
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
