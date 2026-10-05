"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  ShieldCheck,
  Plus,
  ArrowRight,
  Layers,
  Calendar,
  Activity,
  PieChart,
  Building2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { DashboardTab, TransactionItem, AccountItem, BudgetItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchAccountsApi,
  fetchTransactionsApi,
  fetchUserSettingsApi,
  fetchBudgetsApi,
} from "@/lib/api";
import {
  getCycleRange,
  isTransactionInPeriod,
  formatCycleLabel,
  getTransactionTimestamp,
} from "@/lib/cycle";

interface DashboardHomeProps {
  onNavigate: (tab: DashboardTab) => void;
}

function formatMovementDate(
  dateStr: string,
  createdAt?: string,
  lang: "es" | "en" = "es"
): string {
  const ts = getTransactionTimestamp({ date: dateStr, createdAt } as TransactionItem);
  if (!ts) return dateStr || (lang === "en" ? "Recent" : "Reciente");

  const d = new Date(ts);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isToday) return lang === "en" ? "Hoy" : "Hoy";
  if (isYesterday) return lang === "en" ? "Ayer" : "Ayer";

  const monthsEs = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const monthsEn = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mName = lang === "en" ? monthsEn[d.getMonth()] : monthsEs[d.getMonth()];
  return `${d.getDate()} ${mName}`;
}

function getAccountIcon(type: AccountItem["type"]) {
  switch (type) {
    case "bank":
      return <Building2 className="w-4 h-4 text-zinc-700" />;
    case "credit_card":
    case "debit_card":
    case "card":
      return <CreditCard className="w-4 h-4 text-zinc-700" />;
    case "cash":
      return <Banknote className="w-4 h-4 text-emerald-700" />;
    case "wallet":
    case "savings":
    default:
      return <Wallet className="w-4 h-4 text-zinc-700" />;
  }
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [budgetResetDay, setBudgetResetDay] = useState<number>(1);

  const loadData = async () => {
    const [accData, txData, settingsData, budgetsData] = await Promise.all([
      fetchAccountsApi(),
      fetchTransactionsApi(),
      fetchUserSettingsApi(),
      fetchBudgetsApi(),
    ]);
    setAccounts(accData);
    setTransactions(txData);
    setBudgets(budgetsData);
    if (settingsData?.budget_reset_day !== undefined && settingsData.budget_reset_day !== null) {
      setBudgetResetDay(settingsData.budget_reset_day);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  // Rango del ciclo mensual activo según el día de corte/reinicio (día 1 al 31)
  const cycleRange = getCycleRange(new Date(), budgetResetDay);
  const cycleLabel = formatCycleLabel(
    cycleRange.startDate,
    cycleRange.endDate,
    budgetResetDay,
    (language as "es" | "en") || "es"
  );

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Filtrar estrictamente las transacciones del mes / ciclo actual
  const currentCycleTransactions = transactions.filter((t) =>
    isTransactionInPeriod(t, cycleRange.startDate, cycleRange.endDate)
  );

  const incomeTransactions = currentCycleTransactions.filter((t) => t.type === "income");
  const expenseTransactions = currentCycleTransactions.filter((t) => t.type === "expense");

  const totalIncomes = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const netSavings = Math.max(totalIncomes - totalExpenses, 0);
  const netFlow = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? Math.round((netSavings / totalIncomes) * 100) : 0;
  const expenseRatio = totalIncomes > 0 ? Math.round((totalExpenses / totalIncomes) * 100) : 0;

  const totalBudgetAllocated = budgets.reduce((acc, b) => acc + (b.allocated || 0), 0);
  const budgetConsumedPercent =
    totalBudgetAllocated > 0
      ? Math.round((totalExpenses / totalBudgetAllocated) * 100)
      : 0;
  const budgetRemaining = Math.max(0, totalBudgetAllocated - totalExpenses);

  return (
    <div className="space-y-6">
      {/* 1. Tarjeta Hero de Balance Financiero (Estilo Fintech) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 sm:p-8 text-white border border-zinc-800 shadow-xl"
      >
        {/* Luces difusas decorativas de fondo */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Badges de ciclo y estado */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.home.mentalPeace}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{cycleLabel}</span>
              </span>
            </div>

            {/* Saldo Total */}
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.home.totalBalance}</span>
              </div>
              <div className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Micro indicadores de contexto */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-0.5">
              <span>
                {accounts.length} {t.accounts.activeAccounts}
              </span>
              <span>•</span>
              <span
                className={
                  netFlow >= 0
                    ? "text-emerald-400 font-semibold"
                    : "text-rose-400 font-semibold"
                }
              >
                {netFlow >= 0 ? "+" : ""}
                ${netFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                {language === "en" ? "net flow" : "flujo neto"}
              </span>
              <span>•</span>
              <span className="text-zinc-400 font-medium">
                {language === "en" ? "Fixed expenses secured" : "Gastos fijos asegurados"}
              </span>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("expenses")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>{t.home.addExpense}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("incomes")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>{t.home.addIncome}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Barra de Pulso y Salud Financiera / Presupuesto */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>{language === "en" ? "Financial Pulse & Budget" : "Pulso y Salud Financiera"}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    savingsRate >= 20
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : savingsRate > 0
                      ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  }`}
                >
                  {savingsRate >= 20
                    ? language === "en"
                      ? "Optimal Health"
                      : "Salud Óptima"
                    : savingsRate > 0
                    ? language === "en"
                      ? "Stable"
                      : "Estable"
                    : language === "en"
                    ? "In Monitoring"
                    : "En Monitoreo"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {language === "en"
                  ? "Execution of active cycle, savings capacity, and budget limits"
                  : "Ejecución del ciclo activo, capacidad de ahorro y límites presupuestarios"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("budget")}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-600 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200/70 transition-colors"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>{t.home.budgetTab}</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        {/* Indicadores en Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Métrica 1: Tasa de Ahorro */}
          <div className="p-3.5 rounded-2xl bg-zinc-50/70 border border-zinc-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-500">{t.home.savingsRate}</span>
              <span className="font-bold text-emerald-600">{savingsRate}%</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(savingsRate, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>{language === "en" ? "Monthly savings rate" : "Tasa sobre ingresos"}</span>
              <span className="font-medium text-zinc-500">{savingsRate >= 20 ? "✓ Meta alcanzada" : "Objetivo: 20%+"}</span>
            </div>
          </div>

          {/* Métrica 2: Ratio Gasto vs Ingreso */}
          <div className="p-3.5 rounded-2xl bg-zinc-50/70 border border-zinc-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-500">
                {language === "en" ? "Expense / Income Ratio" : "Ratio de Consumo"}
              </span>
              <span
                className={`font-bold ${
                  expenseRatio > 90
                    ? "text-rose-600"
                    : expenseRatio > 70
                    ? "text-amber-600"
                    : "text-zinc-800"
                }`}
              >
                {expenseRatio}%
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  expenseRatio > 90
                    ? "bg-rose-500"
                    : expenseRatio > 70
                    ? "bg-amber-500"
                    : "bg-zinc-800"
                }`}
                style={{ width: `${Math.min(expenseRatio, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-400">
              {expenseRatio <= 70
                ? language === "en"
                  ? "Disciplined spending"
                  : "Nivel de gasto controlado"
                : language === "en"
                ? "Close to income ceiling"
                : "Próximo al tope de ingresos"}
            </div>
          </div>

          {/* Métrica 3: Presupuesto Consumido */}
          <div className="p-3.5 rounded-2xl bg-zinc-50/70 border border-zinc-100 space-y-2">
            {totalBudgetAllocated > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-500">
                    {language === "en" ? "Budget Consumed" : "Presupuesto Consumido"}
                  </span>
                  <span
                    className={`font-bold ${
                      budgetConsumedPercent > 100
                        ? "text-rose-600"
                        : budgetConsumedPercent > 80
                        ? "text-amber-600"
                        : "text-zinc-800"
                    }`}
                  >
                    {budgetConsumedPercent}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      budgetConsumedPercent > 100
                        ? "bg-rose-500"
                        : budgetConsumedPercent > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(budgetConsumedPercent, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>
                    ${totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })} / ${totalBudgetAllocated.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="font-medium text-zinc-500">
                    ${budgetRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
                    {language === "en" ? "left" : "disponible"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center h-full space-y-1">
                <div className="text-xs font-semibold text-zinc-700">
                  {language === "en" ? "No active budget set" : "Sin presupuesto fijado"}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("budget")}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline text-left cursor-pointer flex items-center gap-1"
                >
                  <span>{language === "en" ? "+ Set category budgets" : "+ Asignar límites por categoría"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Grid de Métricas Clave (Ingresos, Gastos, Ahorro Neto, Cuentas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Métrica 1: Ingresos del Ciclo */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("incomes")}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3 cursor-pointer hover:border-zinc-300 transition-all"
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
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>
              {incomeTransactions.length} {t.home.activeSources}
            </span>
            <span className="text-zinc-500 font-medium">este ciclo</span>
          </div>
        </motion.div>

        {/* Métrica 2: Gastos del Ciclo */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("expenses")}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3 cursor-pointer hover:border-zinc-300 transition-all"
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
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>
              {expenseTransactions.length} {t.expenses.transactionsRegistered}
            </span>
            <span className="text-zinc-500 font-medium">este ciclo</span>
          </div>
        </motion.div>

        {/* Métrica 3: Ahorro Neto */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("reports")}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3 cursor-pointer hover:border-zinc-300 transition-all"
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
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>{t.home.savingsRate}:</span>
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {savingsRate}%
            </span>
          </div>
        </motion.div>

        {/* Métrica 4: Cuentas y Liquidez Disponible */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("accounts")}
          className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3 cursor-pointer hover:border-zinc-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.home.myAccounts}</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>
              {accounts.length} {t.accounts.activeAccounts}
            </span>
            <span className="text-zinc-600 font-medium hover:underline">
              {t.home.manageAccounts}
            </span>
          </div>
        </motion.div>
      </div>

      {/* 4 & 5. Feed de Movimientos Recientes & Widget de Cuentas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Feed de Movimientos Recientes */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
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
              className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t.home.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {transactions.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.type === "income" ? "incomes" : "expenses")}
                className="py-3 px-3 -mx-3 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      item.type === "income"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-zinc-100 text-zinc-700 border border-zinc-200/60"
                    }`}
                  >
                    {item.type === "income" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950 truncate">
                      {item.description}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100/90 text-zinc-600 font-medium">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span className="truncate">{item.account}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div
                    className={`text-xs sm:text-sm font-bold tracking-tight ${
                      item.type === "income" ? "text-emerald-600" : "text-zinc-950"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-medium text-zinc-400 mt-0.5">
                    {formatMovementDate(item.date, item.createdAt, (language as "es" | "en") || "es")}
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-zinc-700">
                  {language === "en" ? "No transactions recorded" : "Sin transacciones registradas"}
                </div>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  {language === "en"
                    ? "Start by adding your bank accounts or registering your first incomes and expenses."
                    : "Empieza añadiendo tus cuentas bancarias o registrando tus primeros ingresos y gastos."}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("expenses")}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.home.addExpense}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (1/3): Widget de Cuentas y Liquidez */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-bold text-zinc-950">{t.home.myAccounts}</h2>
                <p className="text-xs text-zinc-400">
                  {accounts.length} {t.accounts.activeAccounts}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("accounts")}
                className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer transition-colors"
              >
                {t.home.manageAccounts}
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onNavigate("accounts")}
                  className="p-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between cursor-pointer hover:bg-zinc-100/70 hover:border-zinc-200 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 truncate">{acc.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {acc.accountNumber
                          ? `••• ${acc.accountNumber.slice(-4)}`
                          : acc.cardNumber
                          ? `••• ${acc.cardNumber.slice(-4)}`
                          : acc.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-xs font-bold text-zinc-950">
                      ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                      {acc.currency || "USD"}
                    </div>
                  </div>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <div className="text-xs font-medium text-zinc-500">
                    {language === "en" ? "No accounts added yet" : "No hay cuentas añadidas"}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("accounts")}
                    className="text-xs font-bold text-zinc-950 hover:underline cursor-pointer"
                  >
                    {language === "en" ? "+ Add first account" : "+ Añadir primera cuenta"}
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
