"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { DashboardTab } from "../types";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardHomeProps {
  onNavigate: (tab: DashboardTab) => void;
}

const mockRecentTransactions = [
  {
    id: "tx-1",
    description: "Supermercado Mercadona",
    category: "Alimentación",
    account: "BBVA Principal",
    amount: 74.5,
    type: "expense",
    date: "14:20",
  },
  {
    id: "tx-2",
    description: "Nómina Mensual Empresa",
    category: "Salario",
    account: "Santander Nómina",
    amount: 2450.0,
    type: "income",
    date: "09:00",
  },
  {
    id: "tx-3",
    description: "Suscripción Netflix & Spotify",
    category: "Entretenimiento",
    account: "Revolut Tarjeta",
    amount: 22.98,
    type: "expense",
    date: "24 Ago",
  },
  {
    id: "tx-4",
    description: "Pago Proyecto Web Freelance",
    category: "Clientes",
    account: "Revolut Tarjeta",
    amount: 650.0,
    type: "income",
    date: "22 Ago",
  },
  {
    id: "tx-5",
    description: "Gasolina Repsol",
    category: "Transporte",
    account: "BBVA Principal",
    amount: 55.2,
    type: "expense",
    date: "20 Ago",
  },
];

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { t } = useLanguage();

  const categoryBreakdown = [
    { name: t.home.housing, amount: 650, percent: 42, color: "bg-zinc-950" },
    { name: t.home.food, amount: 320, percent: 21, color: "bg-zinc-700" },
    { name: t.home.transport, amount: 145, percent: 10, color: "bg-zinc-500" },
    { name: t.home.leisure, amount: 180, percent: 12, color: "bg-zinc-400" },
    { name: t.home.subscriptions, amount: 48, percent: 3, color: "bg-zinc-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.home.mentalPeace}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.home.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.home.subtitle}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("expenses")}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.home.addExpense}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("incomes")}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.home.addIncome}</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Total */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.totalBalance}</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950">$5,842.80</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+$540.20 {t.home.thisMonthGain}</span>
            </div>
          </div>
        </motion.div>

        {/* Ingresos del Mes */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.incomesMonth}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950">$3,100.00</div>
            <div className="text-[11px] text-zinc-500 mt-1">2 {t.home.activeSources}</div>
          </div>
        </motion.div>

        {/* Gastos del Mes */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.expensesMonth}</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950">$1,342.68</div>
            <div className="text-[11px] text-zinc-500 mt-1">43% {t.home.budgetUsed}</div>
          </div>
        </motion.div>

        {/* Ahorro Neto */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.savedAmount}</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600">+$1,757.32</div>
            <div className="text-[11px] text-zinc-500 mt-1">{t.home.savingsRate}: 56.6%</div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-950">{t.home.recentMovements}</h2>
              <p className="text-xs text-zinc-500">{t.home.recentSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("expenses")}
              className="text-xs font-semibold text-zinc-900 hover:underline cursor-pointer"
            >
              {t.home.viewAll} &rarr;
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {mockRecentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === "income"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">{tx.description}</div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.account}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold ${
                      tx.type === "income" ? "text-emerald-600" : "text-zinc-950"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-400">{tx.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 col): Category Breakdown & Accounts summary */}
        <div className="space-y-6">
          {/* Category breakdown card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950">{t.home.categoryExpenses}</h2>
              <button
                type="button"
                onClick={() => onNavigate("budget")}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                {t.home.budgetTab}
              </button>
            </div>

            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-700">{cat.name}</span>
                    <span className="text-zinc-950 font-bold">${cat.amount}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${cat.color} h-1.5 rounded-full`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick accounts widget */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950">{t.home.myAccounts}</h2>
              <button
                type="button"
                onClick={() => onNavigate("accounts")}
                className="text-xs font-semibold text-zinc-900 hover:underline cursor-pointer"
              >
                {t.home.manageAccounts}
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                    BB
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">BBVA Principal</div>
                    <div className="text-[10px] text-zinc-500">••4821</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-900">$3,420.50</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-800 flex items-center justify-center text-xs font-bold">
                    RV
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Revolut</div>
                    <div className="text-[10px] text-zinc-500">••9102</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-900">$1,892.30</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
