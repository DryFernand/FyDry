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
  markNotificationProcessedApi,
} from "@/lib/api";

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
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TransactionItem | null>(null);

  // Form states
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const loadData = async () => {
    const [expData, accData] = await Promise.all([
      fetchTransactionsApi("expense"),
      fetchAccountsApi(),
    ]);
    setExpenses(expData);
    setAccounts(accData);
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
      setIsModalOpen(true);
    }
  }, [initialDraft]);

  // Dinámicamente obtener SOLO las categorías en las que realmente se ha consumido
  const activeExpenseCategories = useMemo(() => {
    const consumedCategories = Array.from(new Set(expenses.map((e) => e.category)));
    return [language === "es" ? "Todos" : "All", ...consumedCategories];
  }, [expenses, language]);

  const filteredExpenses = expenses.filter((e) => {
    const isAll = selectedCategory === "Todos" || selectedCategory === "All";
    const matchesCat = isAll || e.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.account.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const openCreateModal = () => {
    setEditingExpense(null);
    setDesc("");
    setAmount("");
    setCat(EXPENSE_CATEGORIES[0]);
    setSelectedAccountId(accounts.length > 0 ? accounts[0].name : "Efectivo");
    setIsModalOpen(true);
  };

  const openEditModal = (exp: TransactionItem) => {
    setEditingExpense(exp);
    setDesc(exp.description);
    setAmount(exp.amount.toString());
    setCat(exp.category);
    setSelectedAccountId(exp.account);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const parsedAmount = parseFloat(amount) || 0;
    const accountName = selectedAccountId || (accounts.length > 0 ? accounts[0].name : "Efectivo");

    const targetAcc = accounts.find((a) => a.name === accountName || a.id === selectedAccountId);
    if (targetAcc && targetAcc.type === "credit_card") {
      const availableFunds = targetAcc.balance + (targetAcc.overdraftLimit || 0);
      if (parsedAmount > availableFunds) {
        alert(
          `Transacción rechazada: El monto ($${parsedAmount.toFixed(2)}) supera el saldo disponible más el sobregiro permitido ($${availableFunds.toFixed(2)}) de la tarjeta "${targetAcc.name}".`
        );
        return;
      }
    }

    if (editingExpense) {
      const updatedItem = {
        description: desc,
        amount: parsedAmount,
        category: cat,
        account: accountName,
      };
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingExpense.id ? { ...item, ...updatedItem } : item))
      );
      await updateTransactionApi(editingExpense.id, updatedItem);
    } else {
      const created = await createTransactionApi({
        description: desc,
        category: cat,
        account: accountName,
        amount: parsedAmount,
        type: "expense",
        date: new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
          day: "numeric",
          month: "short",
        }),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.expenses.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.expenses.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.expenses.addExpense}</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.expenses.totalSpentMonth}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {filteredExpenses.length} {t.expenses.transactionsRegistered}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.expenses.fixedExpenses}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$0.00</div>
          <div className="text-[11px] text-zinc-400">{t.expenses.fixedSubtitle}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.expenses.variableExpenses}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$0.00</div>
          <div className="text-[11px] text-zinc-400">{t.expenses.variableSubtitle}</div>
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
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              onClick={() => openEditModal(exp)}
              className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                  <ArrowDownRight className="w-5 h-5" />
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
          ))}

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {expenses.length === 0 ? "Sin gastos registrados" : "No hay gastos con este filtro"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {expenses.length === 0
                  ? "Registra tu primer gasto para comenzar a monitorear tus consumos por categoría."
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
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingExpense ? "Editar Gasto" : t.expenses.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.expenses.concept}
                  </label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
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
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.expenses.category} (25 Opciones)
                    </label>
                    <select
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                    >
                      {EXPENSE_CATEGORIES.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                          {categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.expenses.debitedAccount} (Tus Cuentas Creadas)
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
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
