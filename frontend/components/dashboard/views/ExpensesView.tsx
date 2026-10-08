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

  // Base de gastos según el alcance actual ("cycle" o "all")
  const baseExpenses = useMemo(() => {
    return scope === "cycle" ? cycleExpenses : expenses;
  }, [scope, cycleExpenses, expenses]);

  // Categorías que realmente se han consumido en el conjunto activo
  const activeExpenseCategories = useMemo(() => {
    const consumedCategories = Array.from(new Set(baseExpenses.map((e) => e.category)));
    return [language === "es" ? "Todos" : "All", ...consumedCategories];
  }, [baseExpenses, language]);

  useEffect(() => {
    const isAll = selectedCategory === "Todos" || selectedCategory === "All";
    if (!isAll && !activeExpenseCategories.includes(selectedCategory)) {
      setSelectedCategory(language === "es" ? "Todos" : "All");
    }
  }, [activeExpenseCategories, selectedCategory, language]);

  // Lista final filtrada por categoría y búsqueda
  const filteredExpenses = useMemo(() => {
    return baseExpenses.filter((e) => {
      const isAll = selectedCategory === "Todos" || selectedCategory === "All";
      const matchesCat = isAll || e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.account.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [baseExpenses, selectedCategory, searchTerm]);

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

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              {scope === "cycle" ? t.expenses.totalSpentMonth : "Gastado en Ciclo Activo"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Ciclo
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalSpentSelectedCycle.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {cycleExpenses.length} este ciclo • {expenses.length} en total
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Historial Total Gastado</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Historial
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalSpentAllHistory.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">Todos los períodos registrados</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Reinicio de Presupuesto</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/50">
              Configuración
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">Día {budgetResetDay}</div>
          <div className="text-[11px] text-zinc-400">Se reinicia cada mes el día {budgetResetDay}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.expenses.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 text-xs text-zinc-400 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtro:</span>
            </div>
            {activeExpenseCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === c
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {c}
              </button>
            ))}
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
