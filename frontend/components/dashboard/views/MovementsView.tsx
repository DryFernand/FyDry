"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  X,
  Filter,
  Trash2,
  Edit3,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { TransactionItem, AccountItem } from "../types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchTransactionsApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  fetchAccountsApi,
} from "@/lib/api";

export default function MovementsView() {
  const { t, language } = useLanguage();
  const [movements, setMovements] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);

  // Filters State
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<TransactionItem | null>(null);

  // Form State
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [formAccountName, setFormAccountName] = useState("");

  const loadData = async () => {
    const [txData, accData] = await Promise.all([
      fetchTransactionsApi(),
      fetchAccountsApi(),
    ]);
    setMovements(txData);
    setAccounts(accData);
    if (accData.length > 0 && !formAccountName) {
      setFormAccountName(accData[0].name);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  // Categorías que realmente tienen movimientos registrados
  const activeCategories = useMemo(() => {
    const available = Array.from(new Set(movements.map((m) => m.category)));
    return [language === "es" ? "Todos" : "All", ...available];
  }, [movements, language]);

  // Filtrado compuesto
  const filteredMovements = movements.filter((m) => {
    // 1. Type
    if (typeFilter !== "all" && m.type !== typeFilter) return false;

    // 2. Category
    const isAllCat = selectedCategory === "Todos" || selectedCategory === "All";
    if (!isAllCat && m.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

    // 3. Account
    if (selectedAccountFilter !== "all" && m.account.toLowerCase() !== selectedAccountFilter.toLowerCase()) return false;

    // 4. Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchCat = m.category.toLowerCase().includes(q);
      const matchAcc = m.account.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc) return false;
    }

    return true;
  });

  // Métricas calculadas
  const totalIncomes = movements
    .filter((m) => m.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = movements
    .filter((m) => m.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netCashFlow = totalIncomes - totalExpenses;

  // Handlers para modal
  const openCreateModal = (initialType: "expense" | "income" = "expense") => {
    setEditingMovement(null);
    setFormType(initialType);
    setFormDesc("");
    setFormAmount("");
    setFormCategory(initialType === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
    setFormAccountName(accounts.length > 0 ? accounts[0].name : "Efectivo Principal");
    setIsModalOpen(true);
  };

  const openEditModal = (item: TransactionItem) => {
    setEditingMovement(item);
    setFormType(item.type);
    setFormDesc(item.description);
    setFormAmount(item.amount.toString());
    setFormCategory(item.category);
    setFormAccountName(item.account);
    setIsModalOpen(true);
  };

  const handleTypeToggle = (type: "expense" | "income") => {
    setFormType(type);
    setFormCategory(type === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc || !formAmount) return;

    const parsedAmount = parseFloat(formAmount) || 0;
    const accountName = formAccountName || (accounts.length > 0 ? accounts[0].name : "Efectivo Principal");

    if (editingMovement) {
      const updatedItem = {
        description: formDesc,
        amount: parsedAmount,
        category: formCategory,
        account: accountName,
        type: formType,
      };
      setMovements((prev) =>
        prev.map((item) => (item.id === editingMovement.id ? { ...item, ...updatedItem } : item))
      );
      await updateTransactionApi(editingMovement.id, updatedItem);
    } else {
      const created = await createTransactionApi({
        description: formDesc,
        category: formCategory,
        account: accountName,
        amount: parsedAmount,
        type: formType,
        date: new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
          day: "numeric",
          month: "short",
        }),
      });
      setMovements((prev) => [created, ...prev]);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingMovement(null);
  };

  const handleDeleteMovement = async (id: string) => {
    if (confirm("¿Deseas eliminar este movimiento? El saldo de tu cuenta será restaurado automáticamente.")) {
      setMovements((prev) => prev.filter((m) => m.id !== id));
      await deleteTransactionApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingMovement(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.movements.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.movements.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModal("income")}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ Ingreso</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal("expense")}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.movements.newMovement}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Incomes */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.movements.totalIncomes}</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            +${totalIncomes.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {movements.filter((m) => m.type === "income").length} ingresos aplicados
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.movements.totalExpenses}</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            -${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {movements.filter((m) => m.type === "expense").length} gastos debitados
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.movements.netBalance}</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {netCashFlow >= 0 ? "+" : "-"}$
            {Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {netCashFlow >= 0 ? "Superávit neto disponible" : "Déficit en este ciclo"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.movements.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === "all" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.movements.allFilter}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("income")}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === "income" ? "bg-emerald-600 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.movements.incomesFilter}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("expense")}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === "expense" ? "bg-zinc-950 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.movements.expensesFilter}
              </button>
            </div>

            {/* Account filter dropdown */}
            {accounts.length > 0 && (
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs font-semibold focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
              >
                <option value="all">Todas las Cuentas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Dynamic categories chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 text-xs text-zinc-400 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Categoría:</span>
          </div>
          {activeCategories.map((c) => (
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

        {/* Unified Movements List */}
        <div className="divide-y divide-zinc-100 pt-2">
          {filteredMovements.map((item) => {
            const isInc = item.type === "income";
            return (
              <div
                key={item.id}
                onClick={() => openEditModal(item)}
                className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isInc
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-800 group-hover:bg-zinc-200"
                    }`}
                  >
                    {isInc ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700">
                        {item.description}
                      </span>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span className="font-medium text-zinc-600">{item.category}</span>
                      <span>•</span>
                      <span className="text-zinc-500 font-semibold">{item.account}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold ${
                      isInc ? "text-emerald-600" : "text-zinc-950"
                    }`}
                  >
                    {isInc ? "+" : "-"}${item.amount.toFixed(2)}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      isInc
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredMovements.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {movements.length === 0 ? t.movements.emptyTitle : "No hay movimientos con estos filtros"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {movements.length === 0
                  ? t.movements.emptyDesc
                  : "Prueba seleccionando otro tipo de transacción o limpiando la barra de búsqueda."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Movimiento */}
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
                  {editingMovement ? t.movements.editModalTitle : t.movements.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTypeToggle("expense")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === "expense"
                      ? "bg-zinc-950 text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{t.movements.expenseType}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeToggle("income")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === "income"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{t.movements.incomeType}</span>
                </button>
              </div>

              <form onSubmit={handleSaveMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.movements.conceptLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder={
                      formType === "expense"
                        ? "Ej. Supermercado, Alquiler, Combustible, Cena..."
                        : "Ej. Nómina mensual, Proyecto Freelance, Reembolso..."
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.movements.amountLabel}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.movements.categoryLabel}
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                    >
                      {(formType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.movements.accountLabel} (Impacto en Saldo)
                  </label>
                  <select
                    value={formAccountName}
                    onChange={(e) => setFormAccountName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    {accounts.length > 0 ? (
                      accounts.map((a) => (
                        <option key={a.id} value={a.name}>
                          {a.name} (${a.balance.toFixed(2)} - {a.type})
                        </option>
                      ))
                    ) : (
                      <option value="Efectivo Principal">Efectivo Principal ($0.00)</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingMovement ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteMovement(editingMovement.id)}
                      className="flex items-center gap-1 py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.movements.deleteBtn}</span>
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
                      {t.movements.cancelBtn}
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      {editingMovement ? "Actualizar Saldo" : t.movements.saveBtn}
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
