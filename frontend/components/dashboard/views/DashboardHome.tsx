"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  PieChart,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { DashboardTab, TransactionItem, AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardHomeProps {
  onNavigate: (tab: DashboardTab) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const netSavings = Math.max(totalIncomes - totalExpenses, 0);
  const savingsRate = totalIncomes > 0 ? Math.round((netSavings / totalIncomes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.home.mentalPeace}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              {t.home.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-xl font-normal">
              {t.home.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("expenses")}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.home.addExpense}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("incomes")}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold border border-zinc-200 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>{t.home.addIncome}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Balance */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.totalBalance}</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.length} {t.accounts.activeAccounts}
          </div>
        </motion.div>

        {/* Metric 2: Incomes this month */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.incomesMonth}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
            +${totalIncomes.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {transactions.filter((t) => t.type === "income").length} {t.home.activeSources}
          </div>
        </motion.div>

        {/* Metric 3: Expenses this month */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.expensesMonth}</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {transactions.filter((t) => t.type === "expense").length} {t.expenses.transactionsRegistered}
          </div>
        </motion.div>

        {/* Metric 4: Net Savings */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.savedAmount}</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            ${netSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {t.home.savingsRate}: <span className="font-semibold text-emerald-600">{savingsRate}%</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content: Recent Movements & Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Recent Movements */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                {t.home.recentMovements}
              </h2>
              <p className="text-xs text-zinc-400">
                {t.home.recentSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("expenses")}
              className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 cursor-pointer"
            >
              <span>{t.home.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {transactions.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between hover:bg-zinc-50/50 rounded-2xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      item.type === "income"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {item.type === "income" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900">
                      {item.description}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.account}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold ${
                      item.type === "income" ? "text-emerald-600" : "text-zinc-950"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}${item.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-400">{item.date}</div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-zinc-700">Sin transacciones registradas</div>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Empieza añadiendo tus cuentas bancarias o registrando tus primeros ingresos y gastos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): My Accounts & Liquidity */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950">{t.home.myAccounts}</h2>
              <button
                type="button"
                onClick={() => onNavigate("accounts")}
                className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer"
              >
                {t.home.manageAccounts}
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center font-bold text-[10px] text-zinc-700">
                      {acc.type === "cash" ? "💵" : acc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900">{acc.name}</div>
                      <div className="text-[10px] text-zinc-400">{acc.accountNumber || acc.type}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-zinc-950">
                    ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <div className="text-xs font-medium text-zinc-500">No hay cuentas añadidas</div>
                  <button
                    type="button"
                    onClick={() => onNavigate("accounts")}
                    className="text-xs font-bold text-zinc-950 hover:underline cursor-pointer"
                  >
                    + Añadir primera cuenta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
