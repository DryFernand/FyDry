"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Plus,
  X,
  PiggyBank,
  Search,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  Calendar,
  Layers,
  RotateCcw,
  Briefcase,
  Clock,
  Award,
  Laptop,
  Users,
  Store,
  TrendingUp,
  Home,
  Percent,
  Tag,
  Gift,
  HeartHandshake,
  Coins,
} from "lucide-react";
import { TransactionItem, AccountItem } from "../types";
import { INCOME_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchTransactionsApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  fetchAccountsApi,
  fetchUserSettingsApi,
  markNotificationProcessedApi,
} from "@/lib/api";
import { getCycleRange, isTransactionInPeriod, formatCycleLabel } from "@/lib/cycle";
import { currencySymbol, formatMoney, isLiability, parseAmount, todayISO } from "@/lib/money";
import ConfirmDialog, { useEscapeKey } from "../ConfirmDialog";
import MoneyInput from "@/components/ui/MoneyInput";

export function getIncomeCategoryIcon(category: string) {
  switch (category) {
    case "Salario / Nómina Principal":
      return Briefcase;
    case "Horas Extras & Guardias":
      return Clock;
    case "Bonificaciones & Comisiones":
      return Award;
    case "Servicios Freelance":
      return Laptop;
    case "Consultoría & Asesoría":
      return Users;
    case "Negocio Propio / Ventas":
      return Store;
    case "Dividendos & Acciones":
      return TrendingUp;
    case "Rentas / Alquileres de Inmuebles":
      return Home;
    case "Rendimientos & Intereses Bancarios":
      return Percent;
    case "Reembolsos & Devoluciones":
      return RotateCcw;
    case "Venta de Artículos de Segunda Mano":
      return Tag;
    case "Premios & Sorteos":
      return Gift;
    case "Regalos & Ayudas Familiares":
      return HeartHandshake;
    case "Criptomonedas & Staking":
      return Coins;
    case "Otros Ingresos":
      return ArrowUpRight;
    default:
      return ArrowUpRight;
  }
}

interface IncomesViewProps {
  initialDraft?: {
    amount?: number;
    description?: string;
    category?: string;
    from_account_name?: string;
    date?: string;
    notifId?: string;
  } | null;
  onClearDraft?: () => void;
}

export default function IncomesView({ initialDraft, onClearDraft }: IncomesViewProps = {}) {
  const { t, language } = useLanguage();
  const [incomes, setIncomes] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const incomeAccounts = accounts.filter((a) => !isLiability(a));
  const [budgetResetDay, setBudgetResetDay] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [scope, setScope] = useState<"cycle" | "all">("cycle");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  useEscapeKey(isModalOpen, () => setIsModalOpen(false));
  const mainCurrency = accounts[0]?.currency || "DOP";
  const [editingIncome, setEditingIncome] = useState<TransactionItem | null>(null);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<string>(INCOME_CATEGORIES[0]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [incomeDate, setIncomeDate] = useState(() => todayISO());
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    const [incData, accData, settingsData] = await Promise.all([
      fetchTransactionsApi("income"),
      fetchAccountsApi(),
      fetchUserSettingsApi(),
    ]);
    setIncomes(incData);
    setAccounts(accData);
    if (settingsData?.budget_reset_day !== undefined && settingsData.budget_reset_day !== null) {
      setBudgetResetDay(settingsData.budget_reset_day);
    }
    if (accData.length > 0 && !selectedAccountId) {
      setSelectedAccountId((accData.find((a) => !isLiability(a)) || accData[0]).name);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    window.addEventListener("fydry_refresh_data", loadData);
    return () => {
      window.removeEventListener("fydry_storage_updated", loadData);
      window.removeEventListener("fydry_refresh_data", loadData);
    };
  }, []);

  useEffect(() => {
    if (initialDraft) {
      setEditingIncome(null);
      setDesc(initialDraft.description || "");
      setAmount(initialDraft.amount ? initialDraft.amount.toString() : "");
      if (initialDraft.category && INCOME_CATEGORIES.includes(initialDraft.category as any)) {
        setCat(initialDraft.category);
      }
      if (initialDraft.date) {
        setIncomeDate(initialDraft.date.split("T")[0]);
      }
      setIsModalOpen(true);
    }
  }, [initialDraft]);

  // Rango del ciclo mensual seleccionado
  const cycleRange = getCycleRange(selectedDate, budgetResetDay);
  const cycleLabel = formatCycleLabel(
    cycleRange.startDate,
    cycleRange.endDate,
    budgetResetDay,
    (language as "es" | "en") || "es"
  );

  const isCurrentCycle = useMemo(() => {
    const cur = getCycleRange(new Date(), budgetResetDay);
    return (
      cur.startDate.getTime() === cycleRange.startDate.getTime() &&
      cur.endDate.getTime() === cycleRange.endDate.getTime()
    );
  }, [cycleRange, budgetResetDay]);

  const handlePrevMonth = () => {
    if (budgetResetDay === 1) {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setSelectedDate(
        new Date(cycleRange.startDate.getFullYear(), cycleRange.startDate.getMonth() - 1, budgetResetDay)
      );
    }
  };

  const handleNextMonth = () => {
    if (budgetResetDay === 1) {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setSelectedDate(
        new Date(cycleRange.startDate.getFullYear(), cycleRange.startDate.getMonth() + 1, budgetResetDay)
      );
    }
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Ingresos del ciclo seleccionado
  const cycleIncomes = useMemo(() => {
    return incomes.filter((inc) =>
      isTransactionInPeriod(inc, cycleRange.startDate, cycleRange.endDate)
    );
  }, [incomes, cycleRange]);

  const totalIncomesSelectedCycle = useMemo(() => {
    return cycleIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [cycleIncomes]);

  const totalIncomesAllHistory = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes]);

  // Base de ingresos según scope seleccionado (por ciclo vs historial)
  const baseIncomes = useMemo(() => {
    return scope === "cycle" ? cycleIncomes : incomes;
  }, [scope, cycleIncomes, incomes]);

  // Categoría de ingreso con mayor volumen acumulado en el ciclo activo
  const topCategoryInfo = useMemo(() => {
    if (cycleIncomes.length === 0 || totalIncomesSelectedCycle <= 0) {
      return null;
    }
    const categoryTotals: Record<string, number> = {};
    for (const inc of cycleIncomes) {
      categoryTotals[inc.category] = (categoryTotals[inc.category] || 0) + inc.amount;
    }
    let maxCat = "";
    let maxAmount = 0;
    for (const [categoryName, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxCat = categoryName;
      }
    }
    if (!maxCat || maxAmount <= 0) return null;
    const percentage = Math.round((maxAmount / totalIncomesSelectedCycle) * 100);
    return {
      category: maxCat,
      amount: maxAmount,
      percentage,
    };
  }, [cycleIncomes, totalIncomesSelectedCycle]);

  // Ticket promedio por depósito en el ciclo activo
  const averagePerIncome = useMemo(() => {
    return cycleIncomes.length > 0 ? totalIncomesSelectedCycle / cycleIncomes.length : 0;
  }, [cycleIncomes, totalIncomesSelectedCycle]);

  useEffect(() => {
    if (selectedCategory === "Todos" && language === "en") {
      setSelectedCategory("All");
    } else if (selectedCategory === "All" && language === "es") {
      setSelectedCategory("Todos");
    }
  }, [language, selectedCategory]);

  // Lista de ingresos filtrados por categoría, cuenta receptora y búsqueda
  const filteredIncomes = useMemo(() => {
    return baseIncomes.filter((inc) => {
      const isAll = selectedCategory === "Todos" || selectedCategory === "All";
      const matchesCat = isAll || inc.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.account.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount =
        selectedAccountFilter === "all" || inc.account === selectedAccountFilter;
      return matchesCat && matchesSearch && matchesAccount;
    });
  }, [baseIncomes, selectedCategory, searchTerm, selectedAccountFilter]);

  const openCreateModal = () => {
    setEditingIncome(null);
    setDesc("");
    setAmount("");
    setCat(INCOME_CATEGORIES[0]);
    setSelectedAccountId(incomeAccounts[0]?.name || "Efectivo");
    setIncomeDate(todayISO());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (inc: TransactionItem) => {
    setEditingIncome(inc);
    setDesc(inc.description);
    setAmount(inc.amount.toString());
    setCat(inc.category);
    setSelectedAccountId(inc.account);
    setIncomeDate(inc.date ? inc.date.split("T")[0] : todayISO());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;

    // Normalizar comas decimales
    const parsedAmount = parseAmount(amount);

    // Blindar contra NaN, Infinity y valores menores o iguales a cero
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) return;

    const accountName = incomeAccounts.some((a) => a.name === selectedAccountId)
      ? selectedAccountId
      : incomeAccounts[0]?.name || "Efectivo";
    setFormError(null);

    try {
      if (editingIncome) {
        const updatedItem = {
          description: desc.trim(),
          amount: parsedAmount,
          category: cat,
          account: accountName,
          date: incomeDate || editingIncome.date,
        };
        await updateTransactionApi(editingIncome.id, updatedItem);
        setIncomes((prev) =>
          prev.map((item) => (item.id === editingIncome.id ? { ...item, ...updatedItem } : item))
        );
      } else {
        const created = await createTransactionApi({
          description: desc.trim(),
          category: cat,
          account: accountName,
          amount: parsedAmount,
          type: "income",
          date: initialDraft?.date || incomeDate || todayISO(),
        });
        setIncomes((prev) => [created, ...prev]);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el ingreso.");
      return;
    }

    if (initialDraft?.notifId) {
      await markNotificationProcessedApi(initialDraft.notifId);
      if (onClearDraft) onClearDraft();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingIncome(null);
  };

  const handleDeleteIncome = (id: string) => setPendingDeleteId(id);

  const deleteIncomeConfirmed = async (id: string) => {
    setFormError(null);
    try {
      await deleteTransactionApi(id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo eliminar el ingreso.");
      return;
    }
    setIncomes((prev) => prev.filter((i) => i.id !== id));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingIncome(null);
  };

  // Simulador contable de saldo resultante en el modal
  const selectedAcc = incomeAccounts.find((a) => a.name === selectedAccountId || a.id === selectedAccountId) || incomeAccounts[0];
  const numAmountPreview = parseAmount(amount) || 0;
  // Tarjeta de crédito: el saldo es lo consumido, así que el ingreso (pago) lo REDUCE.
  const selectedIsCard = !!selectedAcc && isLiability(selectedAcc);
  const editedIncomeAmount = selectedAcc && editingIncome && editingIncome.account === selectedAcc.name ? editingIncome.amount : 0;
  const currentBalance = selectedAcc
    ? selectedAcc.balance + (selectedIsCard ? editedIncomeAmount : -editedIncomeAmount)
    : 0;
  const resultingBalance = selectedIsCard ? currentBalance - numAmountPreview : currentBalance + numAmountPreview;

  const ModalCategoryIcon = getIncomeCategoryIcon(cat);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              {t.incomes.title}
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/60 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <span>Ciclo: {cycleLabel}</span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500 font-normal">Reinicio día {budgetResetDay}</span>
            </span>
            {scope === "all" && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                Historial Completo
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {t.incomes.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Selector: Ciclo vs Historial */}
          <div className="flex items-center bg-zinc-100/90 rounded-2xl p-1 border border-zinc-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setScope("cycle")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                scope === "cycle"
                  ? "bg-white text-zinc-950 shadow-2xs font-bold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Ciclo</span>
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                scope === "all"
                  ? "bg-white text-zinc-950 shadow-2xs font-bold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Historial Completo</span>
            </button>
          </div>

          {/* Navegador de Meses (visible cuando scope === "cycle") */}
          {scope === "cycle" && (
            <div className="flex items-center bg-zinc-100/90 rounded-2xl p-1 border border-zinc-200/60 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-white hover:text-zinc-950 text-zinc-600 transition-all cursor-pointer shadow-2xs"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-zinc-900 min-w-[120px] justify-center text-center">
                <span>{cycleLabel}</span>
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
          )}

          {/* Botón Volver a Ciclo Actual */}
          {scope === "cycle" && !isCurrentCycle && (
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="flex items-center gap-1 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/60 shadow-2xs"
              title="Volver al ciclo actual"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ciclo Actual</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.incomes.addIncome}</span>
          </button>
        </div>
      </div>

      {/* Overview stats: 4 Tarjetas Analíticas Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Total Ingresado (Ciclo) */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              {scope === "cycle" ? t.incomes.totalIncomesMonth : "Ingresos en Pantalla"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200/60">
              Ciclo
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-green-600">
            +{formatMoney(totalIncomesSelectedCycle, mainCurrency)}
          </div>
          <div className="text-[11px] text-zinc-400">
            {scope === "cycle"
              ? `${cycleIncomes.length} fuentes este ciclo • ${incomes.length} en historial`
              : `${incomes.length} fuentes registradas en total`}
          </div>
        </div>

        {/* Tarjeta 2: Fuente Principal de Ingresos */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Fuente Principal</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Categoría
            </span>
          </div>
          {topCategoryInfo ? (
            <>
              <div
                className="text-xl font-bold tracking-tight text-zinc-950 truncate flex items-center gap-2"
                title={topCategoryInfo.category}
              >
                {(() => {
                  const TopCatIcon = getIncomeCategoryIcon(topCategoryInfo.category);
                  return <TopCatIcon className="w-5 h-5 text-green-600 shrink-0" />;
                })()}
                <span className="truncate">{topCategoryInfo.category}</span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                +{formatMoney(topCategoryInfo.amount, mainCurrency)} • {topCategoryInfo.percentage}% del ciclo
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold tracking-tight text-zinc-950">
                Sin registros
              </div>
              <div className="text-[11px] text-zinc-400">
                0% ingresado en el ciclo
              </div>
            </>
          )}
        </div>

        {/* Tarjeta 3: Ticket Promedio por Depósito */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Ticket Promedio</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Por Entrada
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            +{formatMoney(averagePerIncome, mainCurrency)}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            Promedio por entrada registrada
          </div>
        </div>

        {/* Tarjeta 4: Historial Total Acumulado */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Historial Total</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Historial
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            +{formatMoney(totalIncomesAllHistory, mainCurrency)}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Todos los períodos registrados</span>
            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/40">
              Día {budgetResetDay}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador max-w-md */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ingreso, cliente, cuenta..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Selectores a la derecha */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Selector de cuenta receptora */}
            <div className="relative shrink-0 sm:w-48">
              <Wallet className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-700 hover:text-zinc-950 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs cursor-pointer truncate appearance-none"
              >
                <option value="all">Todas las Cuentas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Selector de categoría */}
            <div className="relative shrink-0 sm:w-56">
              <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-700 hover:text-zinc-950 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs cursor-pointer truncate appearance-none"
              >
                <option value={language === "es" ? "Todos" : "All"}>
                  {language === "es" ? "Todas las Categorías" : "All Categories"}
                </option>
                {INCOME_CATEGORIES.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Income Streams List */}
        <div className="divide-y divide-zinc-100 pt-2">
          {filteredIncomes.map((inc) => {
            const CategoryIcon = getIncomeCategoryIcon(inc.category);
            return (
              <div
                key={inc.id}
                onClick={() => openEditModal(inc)}
                className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center font-bold text-xs group-hover:bg-green-100 transition-colors shrink-0">
                    <CategoryIcon className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700">
                        {inc.description}
                      </span>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span className="font-medium text-zinc-600">{inc.category}</span>
                      <span>•</span>
                      <span>{inc.account}</span>
                      <span>•</span>
                      <span>{inc.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-green-600">
                    +{formatMoney(inc.amount, accounts.find((a) => a.name === inc.account)?.currency || mainCurrency)}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-semibold">
                    {t.incomes.credited}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredIncomes.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {baseIncomes.length === 0 ? "Sin ingresos en este período" : "No hay ingresos con este filtro"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {baseIncomes.length === 0
                  ? scope === "cycle"
                    ? "No se han registrado ingresos en este ciclo. Cambia de ciclo o añade uno nuevo."
                    : "Registra tu nómina, proyectos freelance o dividendos para ver tu flujo mensual."
                  : "Prueba seleccionando otra cuenta, categoría o borrando el término de búsqueda."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Income Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="income-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center font-bold text-xs shrink-0">
                    <ModalCategoryIcon className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 id="income-modal-title" className="text-lg font-bold text-zinc-950">
                      {editingIncome ? "Editar Ingreso" : t.incomes.modalTitle}
                    </h3>
                    <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">{cat}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium shadow-2xs">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.incomes.concept}
                  </label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej. Nómina mensual, Proyecto cliente, Dividendos..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.incomes.amount.replace("$", currencySymbol(selectedAcc?.currency || mainCurrency))}
                    </label>
                    <MoneyInput
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.incomes.category} (15 Opciones)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 pointer-events-none text-green-600">
                        <ModalCategoryIcon className="w-4 h-4" />
                      </div>
                      <select
                        value={cat}
                        onChange={(e) => setCat(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                      >
                        {INCOME_CATEGORIES.map((categoryName) => (
                          <option key={categoryName} value={categoryName}>
                            {categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Fecha del Ingreso
                    </label>
                    <input
                      type="date"
                      required
                      value={incomeDate}
                      onChange={(e) => setIncomeDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.incomes.receivingAccount} (Tus Cuentas Creadas)
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                    >
                      {incomeAccounts.length > 0 ? (
                        incomeAccounts.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} ({formatMoney(a.balance, a.currency)} {a.type})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Efectivo Principal">Efectivo Principal</option>
                          <option value="Cuenta Bancaria">Cuenta Bancaria</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Simulador Contable de Saldo Resultante */}
                {selectedAcc && (
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span>Simulación de Saldo</span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-full">
                        {selectedAcc.name}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs">
                      <div className="flex items-center justify-between text-zinc-600">
                        <span>{selectedIsCard ? "Consumido actual:" : "Saldo actual:"}</span>
                        <span className="font-semibold text-zinc-900">
                          {formatMoney(currentBalance, selectedAcc.currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-600">
                        <span>Acreditación estimada:</span>
                        <span className="text-green-600 font-semibold">
                          +{formatMoney(numAmountPreview, selectedAcc.currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60">
                        <span className="text-zinc-600 font-medium">
                          {selectedIsCard ? "Consumido después:" : "Saldo final estimado:"}
                        </span>
                        <span className="text-zinc-950 font-bold">
                          {formatMoney(resultingBalance, selectedAcc.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingIncome ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteIncome(editingIncome.id)}
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
                      className="py-2.5 px-4 rounded-xl bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      {editingIncome ? "Guardar Cambios" : t.incomes.saveIncome}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        message="¿Deseas eliminar este ingreso?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) deleteIncomeConfirmed(id);
        }}
      />
    </div>
  );
}
