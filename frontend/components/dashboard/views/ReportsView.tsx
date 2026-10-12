"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sheet,
  Filter,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { AccountItem, TransactionItem, DebtItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchAccountsApi,
  fetchTransactionsApi,
  fetchDebtsApi,
  fetchUserSettingsApi,
} from "@/lib/api";
import { getCycleRange, isTransactionInPeriod, formatCycleLabel } from "@/lib/cycle";
import { isLiability, formatMoney, netWorthByCurrency } from "@/lib/money";
import { TrendChart, CategoryBars, DeltaBadge, type TrendPoint } from "../reports/ReportCharts";

const ACCOUNT_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  bank: { es: "Banco", en: "Bank" },
  credit_card: { es: "Tarjeta de crédito", en: "Credit card" },
  debit_card: { es: "Tarjeta de débito", en: "Debit card" },
  card: { es: "Tarjeta", en: "Card" },
  wallet: { es: "Billetera", en: "Wallet" },
  cash: { es: "Efectivo", en: "Cash" },
  savings: { es: "Ahorros", en: "Savings" },
};

export default function ReportsView() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [incomes, setIncomes] = useState<TransactionItem[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [budgetResetDay, setBudgetResetDay] = useState<number>(1);
  const [reportScope, setReportScope] = useState<"current_cycle" | "all_time">("current_cycle");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [holderName, setHolderName] = useState("");

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("fydry_user") || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
      if (user?.full_name) setHolderName(user.full_name);
    } catch {
      // usuario no disponible: se omite el nombre
    }
  }, []);

  const loadData = async () => {
    const [accData, expData, incData, debData, settingsData] = await Promise.all([
      fetchAccountsApi(),
      fetchTransactionsApi("expense"),
      fetchTransactionsApi("income"),
      fetchDebtsApi(),
      fetchUserSettingsApi(),
    ]);
    setAccounts(accData);
    setExpenses(expData);
    setIncomes(incData);
    setDebts(debData);
    if (settingsData?.budget_reset_day !== undefined && settingsData.budget_reset_day !== null) {
      setBudgetResetDay(settingsData.budget_reset_day);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    window.addEventListener("fydry_refresh_data", loadData);
    return () => {
      window.removeEventListener("fydry_storage_updated", loadData);
      window.removeEventListener("fydry_refresh_data", loadData);
    };
  }, []);

  // Rango del ciclo mensual activo
  const cycleRange = getCycleRange(selectedDate, budgetResetDay);
  const cycleLabel = formatCycleLabel(
    cycleRange.startDate,
    cycleRange.endDate,
    budgetResetDay,
    (language as "es" | "en") || "es"
  );

  const isCurrentCycle =
    selectedDate.getFullYear() === new Date().getFullYear() &&
    selectedDate.getMonth() === new Date().getMonth();

  // Moneda principal: la de la mayoría de las cuentas (los montos de transacciones no traen moneda)
  const currencyCounts = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency || "DOP"] = (acc[a.currency || "DOP"] || 0) + 1;
    return acc;
  }, {});
  const mainCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "DOP";
  const money = (n: number) => formatMoney(n, mainCurrency);
  const lang = ((language as "es" | "en") || "es");

  // Filtro por cuenta
  const byAccount = (t: TransactionItem) => accountFilter === "all" || t.account === accountFilter;
  const accountIncomes = incomes.filter(byAccount);
  const accountExpenses = expenses.filter(byAccount);
  const sumIn = (list: TransactionItem[], start: Date, end: Date) =>
    list.filter((t) => isTransactionInPeriod(t, start, end)).reduce((acc, t) => acc + t.amount, 0);

  // Filtrar transacciones según el alcance seleccionado
  const filteredIncomes = reportScope === "current_cycle"
    ? accountIncomes.filter((inc) => isTransactionInPeriod(inc, cycleRange.startDate, cycleRange.endDate))
    : accountIncomes;

  const filteredExpenses = reportScope === "current_cycle"
    ? accountExpenses.filter((exp) => isTransactionInPeriod(exp, cycleRange.startDate, cycleRange.endDate))
    : accountExpenses;

  // Periodo anterior (para comparar) y tendencia de los últimos 6 periodos
  const cycleAt = (monthsBack: number) =>
    getCycleRange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - monthsBack, budgetResetDay), budgetResetDay);
  const prevRange = cycleAt(1);
  const prevIncomes = sumIn(accountIncomes, prevRange.startDate, prevRange.endDate);
  const prevExpenses = sumIn(accountExpenses, prevRange.startDate, prevRange.endDate);
  const monthShort = lang === "es"
    ? ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trend: TrendPoint[] = [5, 4, 3, 2, 1, 0].map((back) => {
    const r = cycleAt(back);
    return {
      label: `${monthShort[r.startDate.getMonth()]} ${String(r.startDate.getFullYear()).slice(2)}`,
      income: sumIn(accountIncomes, r.startDate, r.endDate),
      expense: sumIn(accountExpenses, r.startDate, r.endDate),
    };
  });
  const topExpenses = [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const accountNames = Array.from(new Set([...accounts.map((a) => a.name), ...incomes.map((t) => t.account), ...expenses.map((t) => t.account)])).filter(Boolean);
  const netWorthCurrencies = netWorthByCurrency(accounts);

  const totalIncomes = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netFlow = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? Math.round((Math.max(netFlow, 0) / totalIncomes) * 100) : 0;

  // Métricas Patrimoniales y de Solvencia (Fase 2)
  const totalDebts = debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalMonthlyDebtPayment = debts.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const netWorth = (netWorthCurrencies[mainCurrency] || 0) - totalDebts;
  const dtiRatio = totalIncomes > 0 ? Math.round((totalMonthlyDebtPayment / totalIncomes) * 100) : 0;

  // Score de Salud Financiera FyDry (0 a 100)
  let calculatedScore = 50;
  if (savingsRate >= 20) {
    calculatedScore += 25;
  } else if (savingsRate >= 10) {
    calculatedScore += 15;
  }

  if (netFlow > 0) {
    calculatedScore += 15;
  } else if (netFlow < 0) {
    calculatedScore -= 20;
  }

  if (debts.length === 0 || dtiRatio <= 30) {
    calculatedScore += 10;
  }

  if (dtiRatio > 40) {
    calculatedScore -= 15;
  }

  const healthScore = Math.min(100, Math.max(0, calculatedScore));

  let healthLabel = "";
  let healthTier: "A+" | "B" | "C" | "D" = "A+";
  if (healthScore >= 80) {
    healthLabel = language === "es" ? "Salud Financiera Excelente (A+)" : "Excellent Financial Health (A+)";
    healthTier = "A+";
  } else if (healthScore >= 60) {
    healthLabel = language === "es" ? "Salud Financiera Estable (B)" : "Stable Financial Health (B)";
    healthTier = "B";
  } else if (healthScore >= 40) {
    healthLabel = language === "es" ? "En Observación (C)" : "Under Observation (C)";
    healthTier = "C";
  } else {
    healthLabel = language === "es" ? "Alerta Financiera (D)" : "Financial Alert (D)";
    healthTier = "D";
  }

  // Recomendaciones analíticas personalizadas
  const cashFlowRecommendation = (() => {
    const isEs = language === "es";
    const formattedNetFlow = money(Math.abs(netFlow));
    const marginPct = totalIncomes > 0 ? Math.round((Math.abs(netFlow) / totalIncomes) * 100) : 0;

    if (netFlow > 0) {
      return isEs
        ? `Superávit operativo mensual positivo de ${formattedNetFlow} (${marginPct}% de tus ingresos). Cuentas con cobertura suficiente para amortiguar desviaciones presupuestarias y mantener solvencia operativa sin comprometer liquidez.`
        : `Positive monthly operating surplus of ${formattedNetFlow} (${marginPct}% of revenue). Monthly coverage is adequate to absorb recurring operating obligations without straining liquidity.`;
    }
    if (netFlow === 0) {
      return isEs
        ? `Flujo de caja en punto de equilibrio (${money(0)}). Los ingresos cubren exactamente las salidas; se recomienda priorizar márgenes de holgura operativa para evitar déficits ante contingencias.`
        : `Operating cash flow is at break-even (${money(0)}). Incomes precisely balance expenses; generating operating buffer margin is advised to prevent potential deficits.`;
    }
    return isEs
      ? `Déficit operativo mensual de -${formattedNetFlow} (${marginPct}% por encima del ingreso). Las salidas superan la capacidad de generación del ciclo; audita las categorías con mayor desvío para restaurar el equilibrio de caja.`
      : `Monthly operating deficit of -${formattedNetFlow} (${marginPct}% above income). Expenses exceed period income; reduce non-essential discretionary categories to restore cash flow equilibrium.`;
  })();

  const savingsRecommendation = (() => {
    const isEs = language === "es";
    if (savingsRate >= 20) {
      return isEs
        ? `Tasa de ahorro robusta del ${savingsRate}%, superando el estándar institucional recomendado del 20%. Mantener este ritmo permite acumular o consolidar un fondo de tranquilidad de 3 a 6 meses de gastos fijos y potenciar metas de inversión.`
        : `Robust savings rate of ${savingsRate}%, exceeding the optimal 20% benchmark. Sustaining this pace strengthens your 3 to 6-month safety reserve and accelerates capital accumulation.`;
    }
    if (savingsRate >= 10) {
      return isEs
        ? `Tasa de ahorro moderada del ${savingsRate}%. Continúas acumulando excedentes netos, pero ajustar gastos secundarios te permitirá alcanzar el objetivo recomendado del 20% para tu fondo de tranquilidad.`
        : `Moderate savings rate of ${savingsRate}%. You maintain net accumulation; trimming secondary expenditures will help attain the recommended 20% emergency reserve target.`;
    }
    if (savingsRate > 0) {
      return isEs
        ? `Tasa de ahorro ajustada del ${savingsRate}%. La capitalización neta es vulnerable a imprevistos; se aconseja fijar techos de gasto por categoría para expandir el margen de reserva hacia al menos el 10-15%.`
        : `Tight savings rate of ${savingsRate}%. While net cash is positive, establishing strict category spending limits is suggested to expand your reserve margin toward 10-15%.`;
    }
    return isEs
      ? `Tasa de ahorro del 0% durante el ciclo. No se ha generado excedente neto para el fondo de tranquilidad; evalúa reasignar partidas presupuestarias para reactivar la capacidad de ahorro.`
      : `0% savings rate during this cycle. No net surplus was generated for safety reserves; consider reallocating budget categories to regain savings capacity.`;
  })();

  const debtRecommendation = (() => {
    const isEs = language === "es";
    const formattedDebts = money(totalDebts);
    const formattedNetWorth = money(netWorth);
    const formattedPayment = money(totalMonthlyDebtPayment);

    if (debts.length === 0) {
      return isEs
        ? `Sin pasivos ni deudas activas registradas (Carga DTI: 0%). Tu patrimonio neto operativo (${formattedNetWorth}) se encuentra al 100% libre de gravámenes, brindando máxima solvencia y autonomía financiera.`
        : `Zero active liabilities registered (DTI ratio: 0%). Your net operating worth (${formattedNetWorth}) is 100% unencumbered, offering prime solvency and financial autonomy.`;
    }
    if (dtiRatio <= 30) {
      return isEs
        ? `Carga financiera de deuda (DTI) controlada al ${dtiRatio}% del ingreso mensual (saldo pendiente total: ${formattedDebts}, cuotas: ${formattedPayment}/mes). Tu nivel de apalancamiento se mantiene dentro de los límites saludables recomendados (≤ 30%).`
        : `Debt-to-income (DTI) ratio well-managed at ${dtiRatio}% of monthly income (total remaining debt: ${formattedDebts}, installments: ${formattedPayment}/mo). Leverage remains strictly within healthy recommended guidelines (≤ 30%).`;
    }
    if (dtiRatio <= 40) {
      return isEs
        ? `Carga financiera de deuda (DTI) moderada al ${dtiRatio}% del ingreso (cuotas mensuales acumuladas de ${formattedPayment}). Mantén puntualidad en amortizaciones y evita contraer nuevos pasivos hasta reducir este ratio bajo el 30%.`
        : `Moderate debt burden (DTI) at ${dtiRatio}% of income (combined monthly debt payments of ${formattedPayment}). Keep timely payments and avoid taking on new liabilities until this ratio drops below 30%.`;
    }
    return isEs
      ? `Alerta en carga financiera (DTI del ${dtiRatio}%). Las cuotas de amortización (${formattedPayment}/mes) comprometen más del 40% de tus ingresos. Se recomienda implementar un plan acelerado de reducción de deudas (método bola de nieve o avalancha) para mitigar el riesgo de liquidez.`
      : `Debt burden alert (DTI of ${dtiRatio}%). Monthly debt installments (${formattedPayment}/mo) consume over 40% of income. Implementing an accelerated debt payoff plan (snowball or avalanche method) is strongly advised.`;
  })();

  // Desglose de gastos por categoría
  const expensesByCategory: { [cat: string]: number } = {};
  filteredExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  // CSV compatible con Excel (BOM UTF-8 para acentos) con las transacciones del alcance seleccionado
  const handleExportCSV = () => {
    const cell = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = language === "es"
      ? ["Fecha", "Tipo", "Descripción", "Categoría", "Cuenta", "Monto"]
      : ["Date", "Type", "Description", "Category", "Account", "Amount"];
    const rows = [...filteredIncomes, ...filteredExpenses]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map((tx) => [
        tx.date,
        tx.type === "income" ? (language === "es" ? "Ingreso" : "Income") : (language === "es" ? "Gasto" : "Expense"),
        tx.description,
        tx.category,
        tx.account,
        (tx.type === "income" ? tx.amount : -tx.amount).toFixed(2),
      ]);
    const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fydry-${reportScope === "current_cycle" ? cycleLabel.replace(/\s+/g, "-") : "historico"}${accountFilter !== "all" ? `-${accountFilter.replace(/\s+/g, "-")}` : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  const currentDate = new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const periodDisplayValue = reportScope === "current_cycle"
    ? `${cycleLabel} (Reinicia día ${budgetResetDay})`
    : (language === "es" ? "Histórico Consolidado Completo" : "Full Consolidated History");

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Reglas de impresión para forzar que ninguna tabla ni sección se corte a la mitad */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .avoid-break,
          .report-section,
          table,
          tr,
          tbody,
          .recommendations-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header bar en interfaz web (Oculto en PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-zinc-700" />
            <span>{t.reports.audited}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.reports.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Alcance del Reporte: Ciclo Seleccionado vs Historial Completo */}
          <div className="flex items-center bg-zinc-100/90 rounded-2xl p-1 border border-zinc-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setReportScope("current_cycle")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                reportScope === "current_cycle"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-950" />
              <span>
                {language === "es"
                  ? `Ciclo Seleccionado (${cycleLabel})`
                  : `Selected Cycle (${cycleLabel})`}
              </span>
            </button>

            {reportScope === "current_cycle" && (
              <div className="flex items-center gap-0.5 px-1 border-l border-zinc-200/80 ml-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title={language === "es" ? "Mes anterior" : "Previous month"}
                  aria-label="Previous month"
                  className="p-1 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCurrentMonth}
                  title={language === "es" ? "Volver al ciclo actual" : "Current cycle"}
                  className={`px-1.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isCurrentCycle
                      ? "text-zinc-950 font-bold bg-white/80"
                      : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/70"
                  }`}
                >
                  {language === "es" ? "Actual" : "Current"}
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title={language === "es" ? "Mes siguiente" : "Next month"}
                  aria-label="Next month"
                  className="p-1 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setReportScope("all_time")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                reportScope === "all_time"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-zinc-700" />
              <span>{language === "es" ? "Historial Completo" : "Full History"}</span>
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-700 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span className="sr-only">{lang === "es" ? "Filtrar por cuenta" : "Filter by account"}</span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-none cursor-pointer max-w-[160px]"
            >
              <option value="all">{lang === "es" ? "Todas las cuentas" : "All accounts"}</option>
              {accountNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{t.reports.exportPdf}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 py-2 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Sheet className="w-4 h-4" />
            <span>{language === "es" ? "Exportar CSV / Excel" : "Export CSV / Excel"}</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-6 print:w-full">
        {/* Document Formal Header */}
        <div className="report-section avoid-break flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                FD
              </div>
              <span className="font-extrabold text-xl tracking-tight text-zinc-950">
                {lang === "es" ? "Reporte financiero" : "Financial report"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {accountFilter === "all"
                ? (lang === "es" ? "Todas las cuentas" : "All accounts")
                : `${lang === "es" ? "Cuenta" : "Account"}: ${accountFilter}`}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-600 space-y-0.5">
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.periodLabel}</span>{" "}
              {periodDisplayValue}
            </div>
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.generatedOn}</span>{" "}
              {currentDate}
            </div>
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.accountHolder}</span>{" "}
              {holderName || (lang === "es" ? "Usuario FyDry" : "FyDry user")}
            </div>
          </div>
        </div>

        {/* SECTION 1: Resumen Ejecutivo de Flujo de Caja */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section1Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section1Desc}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.totalIncomes}</span>
              <div className="text-lg font-bold text-zinc-950">
                {money(totalIncomes)}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">
                {language === "es" ? `${filteredIncomes.length} ${filteredIncomes.length === 1 ? "ingreso registrado" : "ingresos registrados"}` : `${filteredIncomes.length} recorded income${filteredIncomes.length === 1 ? "" : "s"}`}
              </div>
              {reportScope === "current_cycle" && <DeltaBadge current={totalIncomes} previous={prevIncomes} goodWhenUp language={lang} />}
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.totalExpenses}</span>
              <div className="text-lg font-bold text-zinc-950">
                {money(totalExpenses)}
              </div>
              <div className="text-[10px] text-zinc-500">
                {totalIncomes > 0 ? Math.round((totalExpenses / totalIncomes) * 100) : 0}% {language === "es" ? "del ingreso" : "of income"}
              </div>
              {reportScope === "current_cycle" && <DeltaBadge current={totalExpenses} previous={prevExpenses} goodWhenUp={false} language={lang} />}
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.netOperatingFlow}</span>
              <div
                className={`text-lg font-bold ${
                  netFlow < 0 ? "text-rose-600" : "text-zinc-950"
                }`}
              >
                {money(netFlow)}
              </div>
              <div className="text-[10px] text-zinc-500 font-semibold">
                {netFlow >= 0
                  ? (language === "es" ? "Superávit Positivo" : "Positive Surplus")
                  : (language === "es" ? "Déficit Operativo" : "Operating Deficit")}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.savingsRate}</span>
              <div className="text-lg font-bold text-zinc-950">{savingsRate}%</div>
              <div className="text-[10px] text-zinc-500 font-medium">
                {language === "es" ? "Margen neto" : "Net margin"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                {language === "es" ? "Patrimonio Neto" : "Net Worth"}
              </span>
              <div className="text-lg font-bold text-zinc-950">
                {money(netWorth)}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">
                {language === "es" ? `Cuentas en ${mainCurrency} - deudas` : `${mainCurrency} accounts - debts`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                {language === "es" ? "Carga Financiera (DTI)" : "Debt Burden (DTI)"}
              </span>
              <div className="text-lg font-bold text-zinc-950">
                {dtiRatio}%
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">
                {language === "es" ? "Cuotas de Deuda / Ingreso" : "Debt Payments / Income"}
              </div>
            </div>
          </div>
        </div>

        {/* Tendencia de los últimos 6 periodos */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
                {lang === "es" ? "Tendencia de ingresos y gastos" : "Income & expense trend"}
              </h2>
              <p className="text-xs text-zinc-500">
                {lang === "es" ? "Últimos 6 periodos hasta el seleccionado. Toca una barra para ver el detalle." : "Last 6 periods up to the selected one. Tap a bar for details."}
              </p>
            </div>
          </div>
          <TrendChart data={trend} currency={mainCurrency} language={lang} />
        </div>

        {/* SECTION 2: Posición de Liquidez y Custodia Bancaria */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section2Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section2Desc}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
                  <th className="py-2.5 px-3 font-semibold">{t.reports.accountCol}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.reports.typeCol}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.reports.accountNumCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.balanceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="py-2.5 px-3 font-bold text-zinc-900">{acc.name}</td>
                    <td className="py-2.5 px-3 text-zinc-600 text-[11px] font-medium">
                      {ACCOUNT_TYPE_LABELS[acc.type]?.[lang] || acc.type}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                      {acc.accountNumber || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                      {isLiability(acc) ? "−" : ""}{formatMoney(acc.balance, acc.currency)}
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400 text-xs">
                      No hay cuentas bancarias registradas en este período contable.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-900 font-bold bg-zinc-50">
                  <td colSpan={3} className="py-2.5 px-3 text-zinc-950 uppercase">
                    {t.reports.totalCustody}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm text-zinc-950 space-y-0.5">
                    {Object.entries(netWorthCurrencies).map(([cur, total]) => (
                      <div key={cur}>{formatMoney(total, cur)}</div>
                    ))}
                    {accounts.length === 0 && formatMoney(0, mainCurrency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 3: Desglose Estructural de Gastos */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section3Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section3Desc}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 print:grid-cols-1">
            <div className="lg:col-span-3">
              <CategoryBars
                items={Object.entries(expensesByCategory)
                  .map(([category, amount]) => ({ category, amount }))
                  .sort((a, b) => b.amount - a.amount)}
                total={totalExpenses}
                currency={mainCurrency}
                emptyText={lang === "es" ? "Sin gastos en este periodo." : "No expenses in this period."}
              />
            </div>
            <div className="lg:col-span-2 space-y-2">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                {lang === "es" ? "Gastos más grandes" : "Largest expenses"}
              </h3>
              {topExpenses.length === 0 ? (
                <p className="text-xs text-zinc-400">{lang === "es" ? "Nada que mostrar todavía." : "Nothing to show yet."}</p>
              ) : (
                <ol className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200/80">
                  {topExpenses.map((e, i) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-zinc-900 truncate">{e.description}</span>
                          <span className="block text-[10px] text-zinc-400 truncate">{e.date} · {e.category}</span>
                        </span>
                      </span>
                      <span className="font-bold text-zinc-900 tabular-nums whitespace-nowrap">{money(e.amount)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Estructura de Pasivos y Deudas */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section4Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section4Desc}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
                  <th className="py-2.5 px-3 font-semibold">{t.reports.creditorCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.originalCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.remainingCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.quotaCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.progressCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {debts.map((d) => {
                  const paid = d.totalAmount - d.remainingAmount;
                  const percent = d.totalAmount > 0 ? Math.round((paid / d.totalAmount) * 100) : 0;
                  return (
                    <tr key={d.id}>
                      <td className="py-2.5 px-3 font-bold text-zinc-900">{d.creditor}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-zinc-600">
                        {money(d.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-950">
                        {money(d.remainingAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-zinc-800">
                        {money(d.monthlyPayment)}{lang === "es" ? "/mes" : "/mo"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-950">{percent}%</td>
                    </tr>
                  );
                })}
                {debts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                      Cero pasivos o deudas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: Diagnóstico y Recomendaciones FyDry */}
        <div className="report-section avoid-break space-y-4 pt-2">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section5Title}
            </h2>
          </div>

          {/* Badge o cápsula destacada del Score de Salud Financiera */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-900 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-black text-sm tracking-tight border border-white/15 shrink-0">
                {healthTier}
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  {language === "es" ? "Diagnóstico Algorítmico FyDry" : "FyDry Algorithmic Diagnostic"}
                </div>
                <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {language === "es" ? "Salud de este periodo" : "Health of this period"}: {healthScore} / 100 · {healthLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <div className="w-28 sm:w-36 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300 min-w-8 text-right">
                {healthScore}%
              </span>
            </div>
          </div>

          {/* Tres bullets de recomendación financiera personalizados y analíticos */}
          <div className="recommendations-box p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3.5 text-xs text-zinc-700">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 mt-1.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-zinc-950">
                  {language === "es" ? "1. Flujo de caja y cobertura mensual" : "1. Cash flow & monthly coverage"}
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  {cashFlowRecommendation}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 mt-1.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-zinc-950">
                  {language === "es" ? "2. Tasa de ahorro y proyección del fondo de tranquilidad" : "2. Savings rate & emergency reserve projection"}
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  {savingsRecommendation}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 mt-1.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-zinc-950">
                  {language === "es" ? "3. Nivel de endeudamiento y solvencia" : "3. Debt burden & solvency"}
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  {debtRecommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formal Footer Watermark */}
        <div className="report-section avoid-break pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span>{t.reports.footerWatermark}</span>
          <span>{lang === "es" ? "Generado con FyDry" : "Generated with FyDry"}</span>
        </div>
      </div>
    </div>
  );
}
