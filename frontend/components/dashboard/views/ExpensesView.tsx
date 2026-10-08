"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  Plus,
  Search,
  X,
  Receipt,
  Filter,
  Tag,
  Trash2,
  Edit3,
  Home,
  ShoppingCart,
  Utensils,
  Zap,
  Wifi,
  Fuel,
  Bus,
  HeartPulse,
  ShieldCheck,
  Dumbbell,
  Shirt,
  Sparkles,
  GraduationCap,
  Film,
  Tv,
  Plane,
  PawPrint,
  Smartphone,
  Wrench,
  Gift,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Layers,
  Wallet,
  LucideIcon,
} from "lucide-react";
import { TransactionItem, AccountItem } from "../types";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
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

export function getCategoryIcon(category: string): LucideIcon {
  const norm = (category || "").toLowerCase().trim();

  if (norm.includes("vivienda") || norm.includes("alquiler") || norm.includes("casa")) return Home;
  if (norm.includes("supermercado") || norm.includes("alimentaci") || norm.includes("comida")) return ShoppingCart;
  if (norm.includes("restaurante") || norm.includes("bar")) return Utensils;
  if (norm.includes("servicio") || norm.includes("luz") || norm.includes("agua") || norm.includes("gas")) return Zap;
  if (norm.includes("telefon") || norm.includes("internet") || norm.includes("móvil") || norm.includes("movil")) return Wifi;
  if (norm.includes("gasolina") || norm.includes("combustible")) return Fuel;
  if (norm.includes("transporte") || norm.includes("taxi") || norm.includes("bus")) return Bus;
  if (norm.includes("salud") || norm.includes("farmacia") || norm.includes("médic") || norm.includes("medic")) return HeartPulse;
  if (norm.includes("seguro") || norm.includes("póliza") || norm.includes("poliza")) return ShieldCheck;
  if (norm.includes("gimnasio") || norm.includes("deporte") || norm.includes("gym")) return Dumbbell;
  if (norm.includes("ropa") || norm.includes("calzado") || norm.includes("moda")) return Shirt;
  if (norm.includes("cuidado personal") || norm.includes("barbería") || norm.includes("barberia") || norm.includes("belleza")) return Sparkles;
  if (norm.includes("educaci") || norm.includes("curso")) return GraduationCap;
  if (norm.includes("entretenimiento") || norm.includes("cine")) return Film;
  if (norm.includes("suscripci") || norm.includes("streaming")) return Tv;
  if (norm.includes("viaje") || norm.includes("vacacion")) return Plane;
  if (norm.includes("mascota") || norm.includes("veterinari")) return PawPrint;
  if (norm.includes("tecnolog") || norm.includes("gadget")) return Smartphone;
  if (norm.includes("mantenimiento") || norm.includes("hogar") || norm.includes("reparaci")) return Wrench;
  if (norm.includes("regalo") || norm.includes("celebraci")) return Gift;
  if (norm.includes("impuesto") || norm.includes("tasa")) return Receipt;
  if (norm.includes("deuda") || norm.includes("préstamo") || norm.includes("prestamo")) return CreditCard;
  if (norm.includes("imprevisto") || norm.includes("emergencia")) return AlertTriangle;
  if (norm.includes("inversi")) return TrendingUp;
  if (norm.includes("ahorro")) return PiggyBank;

  return ArrowDownRight;
}

interface ExpensesViewProps {
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

export default function ExpensesView({ initialDraft, onClearDraft }: ExpensesViewProps = {}) {
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [budgetResetDay, setBudgetResetDay] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TransactionItem | null>(null);

  // Navegador de Ciclos Históricos
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [scope, setScope] = useState<"cycle" | "all">("cycle");

  // Form states
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    const [expData, accData, settingsData] = await Promise.all([
      fetchTransactionsApi("expense"),
      fetchAccountsApi(),
      fetchUserSettingsApi(),
    ]);
    setExpenses(expData);
    setAccounts(accData);
    if (settingsData?.budget_reset_day !== undefined && settingsData.budget_reset_day !== null) {
      setBudgetResetDay(settingsData.budget_reset_day);
    }
    if (accData.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accData[0].name);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  useEffect(() => {
    if (initialDraft) {
      setEditingExpense(null);
      setDesc(initialDraft.description || "");
      setAmount(initialDraft.amount ? initialDraft.amount.toString() : "");
      if (initialDraft.category && EXPENSE_CATEGORIES.includes(initialDraft.category as any)) {
        setCat(initialDraft.category);
      }
      if (initialDraft.date) {
        setExpenseDate(initialDraft.date.split("T")[0]);
      }
      setFormError(null);
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

  const isCurrentCycle = () => {
    const cur = getCycleRange(new Date(), budgetResetDay);
    return (
      cur.startDate.getTime() === cycleRange.startDate.getTime() &&
      cur.endDate.getTime() === cycleRange.endDate.getTime()
    );
  };

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

  // Gastos del ciclo seleccionado
  const cycleExpenses = useMemo(() => {
    return expenses.filter((e) =>
      isTransactionInPeriod(e, cycleRange.startDate, cycleRange.endDate)
    );
  }, [expenses, cycleRange]);

  const totalSpentSelectedCycle = useMemo(() => {
    return cycleExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [cycleExpenses]);

  const totalSpentAllHistory = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  // Gasto promedio diario del ciclo
  const { elapsedDays, dailyAverageSpent } = useMemo(() => {
    const now = new Date();
    const startMs = cycleRange.startDate.getTime();
    const endMs = cycleRange.endDate.getTime();
    const totalCycleDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

    const isCurrent = isCurrentCycle();
    let days = totalCycleDays;
    if (isCurrent) {
      const diff = Math.max(0, now.getTime() - startMs);
      days = Math.max(1, Math.min(totalCycleDays, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1));
    }
    const avg = days > 0 ? totalSpentSelectedCycle / days : 0;
    return { elapsedDays: days, dailyAverageSpent: avg };
  }, [cycleRange, budgetResetDay, totalSpentSelectedCycle]);

  // Categoría de mayor consumo del ciclo
  const topCategoryInfo = useMemo(() => {
    if (cycleExpenses.length === 0 || totalSpentSelectedCycle <= 0) {
      return null;
    }
    const categoryTotals: Record<string, number> = {};
    for (const exp of cycleExpenses) {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    }
    let maxCat = "";
    let maxAmount = 0;
    for (const [categoryName, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxCat = categoryName;
      }
    }
    const percentage = totalSpentSelectedCycle > 0 ? (maxAmount / totalSpentSelectedCycle) * 100 : 0;
    return {
      category: maxCat,
      amount: maxAmount,
      percentage: Math.round(percentage),
    };
  }, [cycleExpenses, totalSpentSelectedCycle]);

  // Base de gastos según el alcance actual ("cycle" o "all")
  const baseExpenses = useMemo(() => {
    return scope === "cycle" ? cycleExpenses : expenses;
  }, [scope, cycleExpenses, expenses]);

  // Categorías que realmente se han consumido en el conjunto activo (para píldoras rápidas)
  const activeExpenseCategories = useMemo(() => {
    const consumedCategories = Array.from(new Set(baseExpenses.map((e) => e.category)));
    return [language === "es" ? "Todos" : "All", ...consumedCategories];
  }, [baseExpenses, language]);

  // Catálogo completo de categorías para el selector desplegable
  const allCategoryOptions = useMemo(() => {
    const list: string[] = [...EXPENSE_CATEGORIES];
    baseExpenses.forEach((e) => {
      if (e.category && !list.includes(e.category)) {
        list.push(e.category);
      }
    });
    return list;
  }, [baseExpenses]);

  useEffect(() => {
    const isAll = selectedCategory === "Todos" || selectedCategory === "All";
    const isValid =
      activeExpenseCategories.includes(selectedCategory) ||
      allCategoryOptions.includes(selectedCategory);
    if (!isAll && !isValid) {
      setSelectedCategory(language === "es" ? "Todos" : "All");
    }
  }, [activeExpenseCategories, allCategoryOptions, selectedCategory, language]);

  useEffect(() => {
    if (selectedCategory === "Todos" && language === "en") {
      setSelectedCategory("All");
    } else if (selectedCategory === "All" && language === "es") {
      setSelectedCategory("Todos");
    }
  }, [language, selectedCategory]);

  // Lista final filtrada por categoría, cuenta debitada y búsqueda
  const filteredExpenses = useMemo(() => {
    return baseExpenses.filter((e) => {
      const isAllCat = selectedCategory === "Todos" || selectedCategory === "All";
      const matchesCat = isAllCat || e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesAccount =
        selectedAccountFilter === "all" ||
        e.account.toLowerCase() === selectedAccountFilter.toLowerCase();
      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.account.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesAccount && matchesSearch;
    });
  }, [baseExpenses, selectedCategory, selectedAccountFilter, searchTerm]);

  // Previsualización contable en modal en tiempo real
  const selectedModalAccount = useMemo(() => {
    const accountName = selectedAccountId || (accounts.length > 0 ? accounts[0].name : "Efectivo");
    return (
      accounts.find((a) => a.name === accountName || a.id === selectedAccountId) ||
      (accounts.length > 0 ? accounts[0] : null)
    );
  }, [accounts, selectedAccountId]);

  const numAmountPreview = useMemo(() => {
    const parsed = parseFloat(amount.replace(",", "."));
    return isNaN(parsed) || !isFinite(parsed) || parsed < 0 ? 0 : parsed;
  }, [amount]);

  const accountImpactPreview = useMemo(() => {
    if (!selectedModalAccount) return null;

    const isSameAccountAsEditing =
      editingExpense &&
      (editingExpense.account === selectedModalAccount.name ||
        editingExpense.account === selectedModalAccount.id);

    const currentBalance =
      selectedModalAccount.balance +
      (isSameAccountAsEditing ? editingExpense.amount : 0);

    const resultingBalance = currentBalance - numAmountPreview;
    const overdraftLimit = selectedModalAccount.overdraftLimit || 0;
    const totalAvailableFunds = currentBalance + overdraftLimit;
    const exceedsFunds = numAmountPreview > totalAvailableFunds;
    const usesOverdraft = resultingBalance < 0 && !exceedsFunds;
    const overdraftUsedAmount = usesOverdraft ? Math.abs(resultingBalance) : 0;

    return {
      currentBalance,
      resultingBalance,
      overdraftLimit,
      totalAvailableFunds,
      exceedsFunds,
      usesOverdraft,
      overdraftUsedAmount,
    };
  }, [selectedModalAccount, editingExpense, numAmountPreview]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setDesc("");
    setAmount("");
    setCat(EXPENSE_CATEGORIES[0]);
    setSelectedAccountId(accounts.length > 0 ? accounts[0].name : "Efectivo");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: TransactionItem) => {
    setEditingExpense(exp);
    setDesc(exp.description);
    setAmount(exp.amount.toString());
    setCat(exp.category);
    setSelectedAccountId(exp.account);
    setExpenseDate(exp.date ? exp.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!desc.trim()) {
      setFormError("Por favor ingresa un concepto o descripción para el gasto.");
      return;
    }

    if (!amount) {
      setFormError("Por favor ingresa un monto válido.");
      return;
    }

    // Normalizar comas decimales
    const parsedAmount = parseFloat(amount.replace(",", "."));

    // Validar que sea un número positivo y finito
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("El monto debe ser un número positivo mayor a 0.");
      return;
    }

    const accountName = selectedAccountId || (accounts.length > 0 ? accounts[0].name : "Efectivo");
    const selectedAcc = accounts.find((a) => a.name === accountName || a.id === selectedAccountId);

    // Validar fondos y margen de sobregiro contra la cuenta seleccionada
    if (selectedAcc) {
      const availableFunds =
        editingExpense && editingExpense.account === selectedAcc.name
          ? selectedAcc.balance + editingExpense.amount + (selectedAcc.overdraftLimit || 0)
          : selectedAcc.balance + (selectedAcc.overdraftLimit || 0);

      if (parsedAmount > availableFunds) {
        setFormError(
          `Fondos insuficientes: La cuenta "${selectedAcc.name}" dispone de $${availableFunds.toFixed(
            2
          )} (saldo disponible + sobregiro permitido), pero el gasto ingresado es de $${parsedAmount.toFixed(
            2
          )}.`
        );
        return;
      }
    }

    if (editingExpense) {
      const updatedItem = {
        description: desc.trim(),
        amount: parsedAmount,
        category: cat,
        account: accountName,
        date: expenseDate || editingExpense.date,
      };
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingExpense.id ? { ...item, ...updatedItem } : item))
      );
      await updateTransactionApi(editingExpense.id, updatedItem);
    } else {
      const created = await createTransactionApi({
        description: desc.trim(),
        category: cat,
        account: accountName,
        amount: parsedAmount,
        type: "expense",
        date: initialDraft?.date || expenseDate || new Date().toISOString().split("T")[0],
      });
      setExpenses((prev) => [created, ...prev]);
    }

    if (initialDraft?.notifId) {
      await markNotificationProcessedApi(initialDraft.notifId);
      if (onClearDraft) onClearDraft();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("¿Deseas eliminar este gasto?")) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      await deleteTransactionApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingExpense(null);
    }
  };

  const ModalCategoryIcon = getCategoryIcon(cat);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              {t.expenses.title}
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
            {t.expenses.subtitle}
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
          {scope === "cycle" && !isCurrentCycle() && (
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
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.expenses.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Overview stats: 4 Tarjetas Analíticas Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Total Gastado en Ciclo */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              {scope === "cycle" ? t.expenses.totalSpentMonth : "Gastado en Ciclo"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Ciclo
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalSpentSelectedCycle.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {cycleExpenses.length} {cycleExpenses.length === 1 ? "transacción" : "transacciones"} este ciclo • {expenses.length} en total
          </div>
        </div>

        {/* Tarjeta 2: Gasto Promedio Diario */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Promedio Diario</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Ritmo
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${dailyAverageSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            Gasto medio por día ({elapsedDays} {elapsedDays === 1 ? "día transcurrido" : "días transcurridos"})
          </div>
        </div>

        {/* Tarjeta 3: Categoría de Mayor Consumo */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Mayor Consumo</span>
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
                  const TopCatIcon = getCategoryIcon(topCategoryInfo.category);
                  return <TopCatIcon className="w-5 h-5 text-zinc-700 shrink-0" />;
                })()}
                <span className="truncate">{topCategoryInfo.category}</span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                ${topCategoryInfo.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {topCategoryInfo.percentage}% del ciclo
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold tracking-tight text-zinc-950">
                Sin registros
              </div>
              <div className="text-[11px] text-zinc-400">
                0% consumido en el ciclo
              </div>
            </>
          )}
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
            ${totalSpentAllHistory.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Todos los períodos</span>
            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/40">
              Reinicio: Día {budgetResetDay}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Buscador de texto */}
            <div className="relative flex-1 min-w-[160px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.expenses.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {/* Selector de filtro por cuenta */}
            <div className="relative shrink-0 sm:w-48">
              <div className="absolute left-3 top-2.5 pointer-events-none text-zinc-400">
                <Wallet className="w-4 h-4" />
              </div>
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-700 hover:text-zinc-950 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs cursor-pointer truncate"
              >
                <option value="all">{language === "es" ? "Todas las Cuentas" : "All Accounts"}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de filtro por categoría */}
            <div className="relative shrink-0 sm:w-56">
              <div className="absolute left-3 top-2.5 pointer-events-none text-zinc-400">
                <Tag className="w-4 h-4" />
              </div>
              <select
                value={
                  selectedCategory === "Todos" || selectedCategory === "All"
                    ? language === "es"
                      ? "Todos"
                      : "All"
                    : selectedCategory
                }
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-700 hover:text-zinc-950 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs cursor-pointer truncate"
              >
                <option value={language === "es" ? "Todos" : "All"}>
                  {language === "es" ? "Todas las Categorías" : "All Categories"}
                </option>
                {allCategoryOptions.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por categorías (píldoras rápidas) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none shrink-0">
            <div className="flex items-center gap-1 text-xs text-zinc-400 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>{language === "es" ? "Filtro:" : "Filter:"}</span>
            </div>
            {activeExpenseCategories.map((c) => {
              const isAllItem = c === "Todos" || c === "All";
              const isSelected = isAllItem
                ? selectedCategory === "Todos" || selectedCategory === "All"
                : selectedCategory.toLowerCase() === c.toLowerCase();

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-zinc-950 text-white shadow-2xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expenses List */}
        <div className="divide-y divide-zinc-100 pt-2">
          {filteredExpenses.map((exp) => {
            const CategoryIcon = getCategoryIcon(exp.category);
            return (
              <div
                key={exp.id}
                onClick={() => openEditModal(exp)}
                className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 border border-zinc-200/60 flex items-center justify-center font-bold text-xs group-hover:bg-zinc-200 transition-colors shrink-0">
                    <CategoryIcon className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700">
                        {exp.description}
                      </span>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span className="font-medium text-zinc-600">{exp.category}</span>
                      <span>•</span>
                      <span>{exp.account}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-zinc-950">
                    -${exp.amount.toFixed(2)}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                    {exp.category}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {baseExpenses.length === 0
                  ? scope === "cycle"
                    ? "Sin gastos registrados en este ciclo"
                    : "Sin gastos registrados"
                  : "No hay gastos con este filtro"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {baseExpenses.length === 0
                  ? scope === "cycle"
                    ? "No se han detectado consumos en el ciclo seleccionado."
                    : "Registra tu primer gasto para comenzar a monitorear tus consumos por categoría."
                  : "Prueba seleccionando otra categoría o borrando el término de búsqueda."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 border border-zinc-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                    <ModalCategoryIcon className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950">
                      {editingExpense ? "Editar Gasto" : t.expenses.modalTitle}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">{cat}</p>
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

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.expenses.concept}
                  </label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => {
                      setDesc(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Ej. Supermercado, Alquiler, Gasolina, Netflix..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.expenses.amount}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.expenses.category} (25 Opciones)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 pointer-events-none text-zinc-600">
                        <ModalCategoryIcon className="w-4 h-4" />
                      </div>
                      <select
                        value={cat}
                        onChange={(e) => {
                          setCat(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                      >
                        {EXPENSE_CATEGORIES.map((categoryName) => (
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
                      Fecha del Gasto
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.expenses.debitedAccount} (Tus Cuentas Creadas)
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => {
                        setSelectedAccountId(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                    >
                      {accounts.length > 0 ? (
                        accounts.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} (${a.balance.toFixed(2)} {a.type})
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

                {/* Previsualización de Impacto en Saldo */}
                {selectedModalAccount && accountImpactPreview && (
                  <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-200/70 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Impacto en Saldo ({selectedModalAccount.name})
                      </span>
                      {accountImpactPreview.overdraftLimit > 0 && (
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/60 font-medium">
                          Sobregiro disp: ${accountImpactPreview.overdraftLimit.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-zinc-600 text-xs">
                        <span>Saldo disponible actual:</span>
                        <span className="font-semibold text-zinc-900">
                          ${accountImpactPreview.currentBalance.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">Saldo tras este gasto:</span>
                        <span
                          className={`font-bold ${
                            accountImpactPreview.exceedsFunds
                              ? "text-rose-600"
                              : accountImpactPreview.usesOverdraft
                              ? "text-amber-600"
                              : "text-zinc-900"
                          }`}
                        >
                          ${accountImpactPreview.resultingBalance.toFixed(2)}
                        </span>
                      </div>

                      {accountImpactPreview.usesOverdraft && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/60 font-medium flex items-center gap-1.5 mt-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>
                            ⚠️ Usará ${accountImpactPreview.overdraftUsedAmount.toFixed(2)} de margen de sobregiro.
                          </span>
                        </div>
                      )}

                      {accountImpactPreview.exceedsFunds && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200/60 font-medium flex items-center gap-1.5 mt-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>
                            ⛔ Excede fondos disponibles: El gasto supera el saldo y sobregiro permitido (${accountImpactPreview.totalAvailableFunds.toFixed(2)} máx).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingExpense ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(editingExpense.id)}
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
                      {editingExpense ? "Guardar Cambios" : t.expenses.saveExpense}
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
