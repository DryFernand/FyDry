"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { TransactionItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

const initialExpenses: TransactionItem[] = [
  {
    id: "exp-1",
    description: "Alquiler Piso Centro",
    category: "Vivienda",
    account: "BBVA Principal",
    amount: 650.0,
    type: "expense",
    date: "01 Ago 2026",
  },
  {
    id: "exp-2",
    description: "Supermercado Mercadona",
    category: "Alimentación",
    account: "BBVA Principal",
    amount: 74.5,
    type: "expense",
    date: "26 Ago 2026",
  },
  {
    id: "exp-3",
    description: "Suscripción Netflix & Spotify",
    category: "Suscripciones",
    account: "Revolut Tarjeta",
    amount: 22.98,
    type: "expense",
    date: "24 Ago 2026",
  },
  {
    id: "exp-4",
    description: "Gasolina Repsol",
    category: "Transporte",
    account: "BBVA Principal",
    amount: 55.2,
    type: "expense",
    date: "20 Ago 2026",
  },
  {
    id: "exp-5",
    description: "Cena Restaurante Italiano",
    category: "Ocio",
    account: "Revolut Tarjeta",
    amount: 48.0,
    type: "expense",
    date: "18 Ago 2026",
  },
  {
    id: "exp-6",
    description: "Factura Luz & Gas",
    category: "Vivienda",
    account: "BBVA Principal",
    amount: 82.0,
    type: "expense",
    date: "10 Ago 2026",
  },
];

export default function ExpensesView() {
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState<TransactionItem[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Alimentación");
  const [acc, setAcc] = useState("BBVA Principal");

  const categories = [
    language === "es" ? "Todos" : "All",
    language === "es" ? "Vivienda" : "Housing",
    language === "es" ? "Alimentación" : "Food",
    language === "es" ? "Transporte" : "Transport",
    language === "es" ? "Suscripciones" : "Subscriptions",
    language === "es" ? "Ocio" : "Leisure",
  ];

  const filteredExpenses = expenses.filter((e) => {
    const isAll = selectedCategory === "Todos" || selectedCategory === "All";
    const matchesCat = isAll || e.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newExp: TransactionItem = {
      id: `exp-${Date.now()}`,
      description: desc,
      category: cat,
      account: acc,
      amount: parseFloat(amount) || 0,
      type: "expense",
      date: language === "es" ? "Hoy" : "Today",
    };

    setExpenses([newExp, ...expenses]);
    setDesc("");
    setAmount("");
    setIsModalOpen(false);
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
          onClick={() => setIsModalOpen(true)}
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
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$732.00</div>
          <div className="text-[11px] text-zinc-400">{t.expenses.fixedSubtitle}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.expenses.variableExpenses}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">$200.68</div>
          <div className="text-[11px] text-zinc-400">{t.expenses.variableSubtitle}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
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
            {categories.map((c) => (
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
            <div key={exp.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">{exp.description}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span>{exp.category}</span>
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
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                  {exp.category}
                </span>
              </div>
            </div>
          ))}

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center text-xs text-zinc-400">
              {t.expenses.noExpensesFound}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
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
                <h3 className="text-lg font-bold text-zinc-950">{t.expenses.modalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.expenses.concept}
                  </label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej. Supermercado, Alquiler, Gasolina"
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
                      {t.expenses.category}
                    </label>
                    <select
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                    >
                      <option value="Alimentación">Alimentación</option>
                      <option value="Vivienda">Vivienda</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Suscripciones">Suscripciones</option>
                      <option value="Ocio">Ocio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.expenses.debitedAccount}
                  </label>
                  <select
                    value={acc}
                    onChange={(e) => setAcc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    <option value="BBVA Principal">BBVA Principal</option>
                    <option value="Santander Nómina">Santander Nómina</option>
                    <option value="Revolut Tarjeta">Revolut Tarjeta</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
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
                    {t.expenses.saveExpense}
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
