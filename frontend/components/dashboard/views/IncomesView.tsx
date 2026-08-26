"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Plus,
  X,
  PiggyBank,
  Filter,
  Search,
  Trash2,
  Edit3,
} from "lucide-react";
import { TransactionItem, AccountItem } from "../types";
import { INCOME_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";

export default function IncomesView() {
  const { t, language } = useLanguage();
  const [incomes, setIncomes] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<TransactionItem | null>(null);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<string>(INCOME_CATEGORIES[0]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedInc = localStorage.getItem("fydry_incomes");
      if (storedInc) {
        try {
          setIncomes(JSON.parse(storedInc));
        } catch {
          setIncomes([]);
        }
      }

      const storedAcc = localStorage.getItem("fydry_accounts");
      if (storedAcc) {
        try {
          const parsed = JSON.parse(storedAcc);
          setAccounts(parsed);
          if (parsed.length > 0) {
            setSelectedAccountId(parsed[0].name);
          }
        } catch {
          setAccounts([]);
        }
      }
    }
  }, []);

  const saveIncomes = (newIncomes: TransactionItem[]) => {
    setIncomes(newIncomes);
    if (typeof window !== "undefined") {
      localStorage.setItem("fydry_incomes", JSON.stringify(newIncomes));
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
  };

  // Dinámicamente obtener SOLO las categorías en las que realmente se han registrado ingresos
  const activeIncomeCategories = useMemo(() => {
    const consumedCategories = Array.from(new Set(incomes.map((i) => i.category)));
    return [language === "es" ? "Todos" : "All", ...consumedCategories];
  }, [incomes, language]);

  const filteredIncomes = incomes.filter((inc) => {
    const isAll = selectedCategory === "Todos" || selectedCategory === "All";
    const matchesCat = isAll || inc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.account.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalIncome = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);

  const openCreateModal = () => {
    setEditingIncome(null);
    setDesc("");
    setAmount("");
    setCat(INCOME_CATEGORIES[0]);
    setSelectedAccountId(accounts.length > 0 ? accounts[0].name : "Efectivo");
    setIsModalOpen(true);
  };

  const openEditModal = (inc: TransactionItem) => {
    setEditingIncome(inc);
    setDesc(inc.description);
    setAmount(inc.amount.toString());
    setCat(inc.category);
    setSelectedAccountId(inc.account);
    setIsModalOpen(true);
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const parsedAmount = parseFloat(amount) || 0;
    const accountName = selectedAccountId || "Efectivo";

    if (editingIncome) {
      const updated = incomes.map((item) =>
        item.id === editingIncome.id
          ? {
              ...item,
              description: desc,
              amount: parsedAmount,
              category: cat,
              account: accountName,
            }
          : item
      );
      saveIncomes(updated);
    } else {
      const newInc: TransactionItem = {
        id: `inc-${Date.now()}`,
        description: desc,
        category: cat,
        account: accountName,
        amount: parsedAmount,
        type: "income",
        date: new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
          day: "numeric",
          month: "short",
        }),
      };
      saveIncomes([newInc, ...incomes]);
    }

    setIsModalOpen(false);
    setEditingIncome(null);
  };

  const handleDeleteIncome = (id: string) => {
    if (confirm("¿Deseas eliminar este ingreso?")) {
      const updated = incomes.filter((i) => i.id !== id);
      saveIncomes(updated);
      setIsModalOpen(false);
      setEditingIncome(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.incomes.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.incomes.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.incomes.addIncome}</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.incomes.totalIncomesMonth}</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            +${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {filteredIncomes.length} {t.incomes.activeIncomeSources}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.incomes.mainSalary}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$0.00</div>
          <div className="text-[11px] text-zinc-400">0% del total mensual</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.incomes.extraIncomes}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$0.00</div>
          <div className="text-[11px] text-zinc-400">0% del total mensual</div>
        </div>
      </div>

      {/* Filter and Search Bar con Filtro Inteligente */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ingreso, cliente, cuenta..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Selector de Filtros por Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 text-xs text-zinc-400 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtro:</span>
            </div>
            {activeIncomeCategories.map((c) => (
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

        {/* Income Streams List */}
        <div className="divide-y divide-zinc-100 pt-2">
          {filteredIncomes.map((inc) => (
            <div
              key={inc.id}
              onClick={() => openEditModal(inc)}
              className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
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
                <div className="text-xs font-bold text-emerald-600">
                  +${inc.amount.toFixed(2)}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                  {t.incomes.credited}
                </span>
              </div>
            </div>
          ))}

          {filteredIncomes.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {incomes.length === 0 ? "Sin ingresos registrados" : "No hay ingresos con este filtro"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {incomes.length === 0
                  ? "Registra tu nómina, proyectos freelance o dividendos para ver tu flujo mensual."
                  : "Prueba seleccionando otra categoría o borrando el término de búsqueda."}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingIncome ? "Editar Ingreso" : t.incomes.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.incomes.amount}
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
                      {t.incomes.category} (15 Opciones)
                    </label>
                    <select
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                    >
                      {INCOME_CATEGORIES.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                          {categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.incomes.receivingAccount} (Tus Cuentas Creadas)
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
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
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
    </div>
  );
}
