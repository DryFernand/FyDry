"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Plus,
  X,
  PiggyBank,
} from "lucide-react";
import { TransactionItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

export default function IncomesView() {
  const { t, language } = useLanguage();
  const [incomes, setIncomes] = useState<TransactionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Salario Fijo");
  const [acc, setAcc] = useState("Santander Nómina");

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newInc: TransactionItem = {
      id: `inc-${Date.now()}`,
      description: desc,
      category: cat,
      account: acc,
      amount: parseFloat(amount) || 0,
      type: "income",
      date: language === "es" ? "Hoy" : "Today",
    };

    setIncomes([newInc, ...incomes]);
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
            {t.incomes.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.incomes.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
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
            {incomes.length} {t.incomes.activeIncomeSources}
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

      {/* Income Streams List */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-950">{t.incomes.history}</h2>
        </div>

        <div className="divide-y divide-zinc-100">
          {incomes.map((inc) => (
            <div key={inc.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">{inc.description}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span>{inc.category}</span>
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
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                  {t.incomes.credited}
                </span>
              </div>
            </div>
          ))}

          {incomes.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">Sin ingresos registrados</div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Registra tu nómina, proyectos freelance o rendimientos para ver tu flujo mensual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Income */}
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
                <h3 className="text-lg font-bold text-zinc-950">{t.incomes.modalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.incomes.concept}
                  </label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej. Nómina mensual, Proyecto cliente..."
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
                      {t.incomes.category}
                    </label>
                    <select
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                    >
                      <option value="Salario Fijo">Salario Fijo</option>
                      <option value="Servicios Freelance">Servicios Freelance</option>
                      <option value="Inversiones">Inversiones</option>
                      <option value="Negocio">Negocio</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.incomes.receivingAccount}
                  </label>
                  <input
                    type="text"
                    value={acc}
                    onChange={(e) => setAcc(e.target.value)}
                    placeholder="Ej. Santander Nómina, Efectivo..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
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
                    {t.incomes.saveIncome}
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
