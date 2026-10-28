"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, HeartPulse, Coffee, Repeat, Target, Plus, Trash2, Pause, Play, X } from "lucide-react";
import {
  fetchInsightsApi,
  fetchRecurringApi,
  createRecurringApi,
  updateRecurringApi,
  deleteRecurringApi,
  fetchGoalsApi,
  createGoalApi,
  contributeGoalApi,
  deleteGoalApi,
  fetchAccountsApi,
} from "@/lib/api";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { formatMoney, parseAmount, todayISO } from "@/lib/money";
import { useLanguage } from "@/context/LanguageContext";
import type { AccountItem, GoalItem, InsightsData, RecurringFrequency, RecurringItem } from "../types";
import { useEscapeKey } from "../ConfirmDialog";
import ScreenSkeleton from "../ScreenSkeleton";
import MoneyInput from "@/components/ui/MoneyInput";

const card = "bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs";
const input = "w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10";
const primaryBtn = "flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all font-semibold text-xs cursor-pointer disabled:opacity-50";

const FREQUENCIES: { id: RecurringFrequency; es: string; en: string }[] = [
  { id: "weekly", es: "Semanal", en: "Weekly" },
  { id: "biweekly", es: "Quincenal", en: "Biweekly" },
  { id: "monthly", es: "Mensual", en: "Monthly" },
  { id: "yearly", es: "Anual", en: "Yearly" },
];

const emptyRecurring = {
  kind: "expense" as "expense" | "income",
  description: "",
  category: EXPENSE_CATEGORIES[0] as string,
  amount: "",
  account: "",
  frequency: "monthly" as RecurringFrequency,
  nextDate: todayISO(),
};

export default function PlanningView() {
  const { language } = useLanguage();
  const en = language === "en";
  const tr = (es: string, eng: string) => (en ? eng : es);

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recForm, setRecForm] = useState(emptyRecurring);
  const [showRecForm, setShowRecForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", target: "", date: "" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [contribution, setContribution] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEscapeKey(showRecForm, () => setShowRecForm(false));
  useEscapeKey(showGoalForm, () => setShowGoalForm(false));

  const load = useCallback(async () => {
    const [ins, rec, gls, accs] = await Promise.all([fetchInsightsApi(), fetchRecurringApi(), fetchGoalsApi(), fetchAccountsApi()]);
    setInsights(ins);
    setRecurring(rec);
    setGoals(gls);
    setAccounts(accs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("fydry_refresh_data", load);
    return () => window.removeEventListener("fydry_refresh_data", load);
  }, [load]);

  const currency = insights?.currency || accounts[0]?.currency || "DOP";
  const money = (n: number) => formatMoney(n, currency);

  /** Ejecuta una acción mostrando el error del backend si falla y recargando datos si funciona. */
  const run = async (action: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Ocurrió un error.", "Something went wrong."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(recForm.amount);
    if (!recForm.description.trim() || isNaN(amount) || amount <= 0) {
      setError(tr("Completa la descripción y un monto válido.", "Enter a description and a valid amount."));
      return;
    }
    const acc = accounts.find((a) => a.name === recForm.account);
    const ok = await run(() =>
      createRecurringApi({
        kind: recForm.kind,
        description: recForm.description.trim(),
        category: recForm.category,
        amount,
        account: recForm.account,
        accountId: acc?.id,
        frequency: recForm.frequency,
        nextDate: recForm.nextDate,
      })
    );
    if (ok) {
      setRecForm(emptyRecurring);
      setShowRecForm(false);
    }
  };

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseAmount(goalForm.target);
    if (!goalForm.name.trim() || isNaN(target) || target <= 0) {
      setError(tr("Completa el nombre y un monto objetivo válido.", "Enter a name and a valid target amount."));
      return;
    }
    const ok = await run(() =>
      createGoalApi({ name: goalForm.name.trim(), targetAmount: target, targetDate: goalForm.date || undefined, color: "bg-green-500" })
    );
    if (ok) {
      setGoalForm({ name: "", target: "", date: "" });
      setShowGoalForm(false);
    }
  };

  const contribute = async (goal: GoalItem, sign: 1 | -1) => {
    const amount = parseAmount(contribution[goal.id] || "");
    if (isNaN(amount) || amount <= 0) {
      setError(tr("Ingresa un monto válido.", "Enter a valid amount."));
      return;
    }
    const ok = await run(() => contributeGoalApi(goal.id, sign * amount));
    if (ok) setContribution((prev) => ({ ...prev, [goal.id]: "" }));
  };

  const convertToRecurring = (description: string, amount: number) => {
    setRecForm({ ...emptyRecurring, description, amount: String(amount), category: "Suscripciones Digitales" });
    setShowRecForm(true);
  };

  if (loading) return <ScreenSkeleton screen="planning" />;

  const score = insights?.peace_score ?? 0;
  const scoreColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  const categories = recForm.kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className={`${card} sm:p-6`}>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{tr("Plan y Metas", "Plan & Goals")}</h1>
        <p className="text-xs text-zinc-500 mt-1">
          {tr(
            "Cuánto puedes gastar hoy, tus gastos fijos, suscripciones y metas de ahorro.",
            "How much you can spend today, your fixed costs, subscriptions and savings goals."
          )}
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs">
          {error}
        </div>
      )}

      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${card} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{tr("Disponible hoy", "Available today")}</span>
              <Wallet className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950">{money(insights.daily_allowance)}</div>
            <p className="text-[11px] text-zinc-500">
              {money(insights.available_to_spend)} {tr("para los próximos", "for the next")} {insights.days_left}{" "}
              {tr("días del periodo", "days of this period")}
            </p>
          </div>

          <div className={`${card} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{tr("Puntaje Paz Mental", "Peace of Mind score")}</span>
              <HeartPulse className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950">{score}/100</div>
            <div
              className="h-2 rounded-full bg-zinc-100 overflow-hidden"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
              aria-label={tr("Puntaje Paz Mental", "Peace of Mind score")}
            >
              <div className={`h-full ${scoreColor}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">
              {tr(
                "Combina tu ahorro del periodo, presupuestos sin exceder, uso de tarjetas y tu colchón diario.",
                "Combines period savings, budgets kept, card usage and your daily buffer."
              )}
            </p>
          </div>

          <div className={`${card} space-y-1.5 text-xs`}>
            <div className="flex justify-between"><span className="text-zinc-500">{tr("Ingresos del periodo", "Period income")}</span><span className="font-semibold text-zinc-900">{money(insights.income_period)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{tr("Gastos del periodo", "Period expenses")}</span><span className="font-semibold text-zinc-900">{money(insights.expenses_period)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{tr("Fijos pendientes", "Pending fixed costs")}</span><span className="font-semibold text-zinc-900">{money(insights.fixed_pending)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{tr("Aporte a metas este mes", "Goals this month")}</span><span className="font-semibold text-zinc-900">{money(insights.goals_monthly_need)}</span></div>
            <p className="text-[11px] text-zinc-400 pt-1">
              {tr("Disponible = saldo en cuentas (sin tarjetas ni ahorro) − fijos pendientes − metas.", "Available = account balance (excl. cards and savings) − pending fixed costs − goals.")}
            </p>
          </div>
        </div>
      )}

      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className={`${card} space-y-3`} aria-labelledby="hormiga-title">
            <div className="flex items-center justify-between">
              <h2 id="hormiga-title" className="text-sm font-bold text-zinc-950">{tr("Gastos hormiga (30 días)", "Small leaks (30 days)")}</h2>
              <Coffee className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            </div>
            <p className="text-xs text-zinc-500">
              {insights.small_expenses.count} {tr("gastos de hasta", "expenses up to")} {money(insights.small_expenses.threshold)}{" "}
              {tr("suman", "add up to")} <strong className="text-zinc-900">{money(insights.small_expenses.total)}</strong>.
            </p>
            {insights.small_expenses.top.length === 0 ? (
              <p className="text-xs text-zinc-400">{tr("Sin gastos pequeños recientes.", "No recent small expenses.")}</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {insights.small_expenses.top.map((g) => (
                  <li key={g.description} className="flex justify-between py-2 text-xs">
                    <span className="text-zinc-700">{g.description} <span className="text-zinc-400">×{g.count}</span></span>
                    <span className="font-semibold text-zinc-900">{money(g.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${card} space-y-3`} aria-labelledby="subs-title">
            <div className="flex items-center justify-between">
              <h2 id="subs-title" className="text-sm font-bold text-zinc-950">{tr("Suscripciones y cargos fijos", "Subscriptions & fixed charges")}</h2>
              <Repeat className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            </div>
            {insights.subscriptions.length === 0 ? (
              <p className="text-xs text-zinc-400">
                {tr("No detectamos cargos repetidos. Registra tus fijos abajo.", "No repeated charges found. Add your fixed costs below.")}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {insights.subscriptions.map((s) => (
                  <li key={`${s.source}-${s.description}`} className="flex items-center justify-between gap-2 py-2 text-xs">
                    <span className="text-zinc-700">
                      {s.description}
                      {s.source === "detected" && (
                        <span className="ml-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                          {tr("detectada", "detected")}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900">{money(s.amount)}</span>
                      {s.source === "detected" && (
                        <button type="button" onClick={() => convertToRecurring(s.description, s.amount)} className="text-[11px] underline text-zinc-600 hover:text-zinc-950 cursor-pointer">
                          {tr("Registrar", "Track")}
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <section className={`${card} space-y-4`} aria-labelledby="rec-title">
        <div className="flex items-center justify-between">
          <h2 id="rec-title" className="text-sm font-bold text-zinc-950">{tr("Gastos e ingresos recurrentes", "Recurring expenses & income")}</h2>
          <button type="button" className={primaryBtn} onClick={() => setShowRecForm(true)}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {tr("Programar", "Schedule")}
          </button>
        </div>

        {recurring.length === 0 ? (
          <p className="text-xs text-zinc-400">
            {tr("Aún no tienes recurrentes. Se registran solos en su fecha.", "No recurring items yet. They post automatically on their date.")}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recurring.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs ${r.isActive ? "" : "opacity-50"}`}>
                <div>
                  <div className="font-semibold text-zinc-900">{r.description}</div>
                  <div className="text-[11px] text-zinc-400">
                    {FREQUENCIES.find((f) => f.id === r.frequency)?.[en ? "en" : "es"]} · {tr("próximo", "next")} {r.nextDate}
                    {r.account ? ` · ${r.account}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${r.kind === "income" ? "text-green-700" : "text-zinc-900"}`}>
                    {r.kind === "income" ? "+" : "-"}{money(r.amount)}
                  </span>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
                    onClick={() => run(() => updateRecurringApi(r.id, { isActive: !r.isActive }))}
                    aria-label={r.isActive ? tr(`Pausar ${r.description}`, `Pause ${r.description}`) : tr(`Reanudar ${r.description}`, `Resume ${r.description}`)}
                    disabled={busy}
                  >
                    {r.isActive ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                    onClick={() => run(() => deleteRecurringApi(r.id))}
                    aria-label={tr(`Eliminar ${r.description}`, `Delete ${r.description}`)}
                    disabled={busy}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} space-y-4`} aria-labelledby="goals-title">
        <div className="flex items-center justify-between">
          <h2 id="goals-title" className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Target className="w-4 h-4" aria-hidden="true" />
            {tr("Metas de ahorro", "Savings goals")}
          </h2>
          <button type="button" className={primaryBtn} onClick={() => setShowGoalForm(true)}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {tr("Nueva meta", "New goal")}
          </button>
        </div>

        {goals.length === 0 ? (
          <p className="text-xs text-zinc-400">{tr("Crea tu primera meta: fondo de emergencia, viaje, inicial de vivienda…", "Create your first goal: emergency fund, trip, down payment…")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
              return (
                <div key={g.id} className="p-4 rounded-2xl border border-zinc-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">{g.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {money(g.savedAmount)} / {money(g.targetAmount)}
                        {g.targetDate ? ` · ${tr("para el", "by")} ${g.targetDate}` : ""}
                      </div>
                    </div>
                    <button type="button" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer" onClick={() => run(() => deleteGoalApi(g.id))} aria-label={tr(`Eliminar meta ${g.name}`, `Delete goal ${g.name}`)} disabled={busy}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={g.name}>
                    <div className={`h-full ${g.color || "bg-green-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-2">
                    <MoneyInput
                      className={input}
                      placeholder={tr("Monto", "Amount")}
                      aria-label={tr(`Monto para ${g.name}`, `Amount for ${g.name}`)}
                      value={contribution[g.id] || ""}
                      onChange={(e) => setContribution((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    />
                    <button type="button" className={primaryBtn} onClick={() => contribute(g, 1)} disabled={busy}>{tr("Aportar", "Add")}</button>
                    <button type="button" className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer disabled:opacity-50" onClick={() => contribute(g, -1)} disabled={busy}>
                      {tr("Revertir", "Revert")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showRecForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="rec-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 id="rec-modal-title" className="font-bold text-zinc-950 text-base">
                  {tr("Gastos e ingresos recurrentes", "Recurring expenses & income")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRecForm(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                  aria-label={tr("Cerrar", "Close")}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={submitRecurring} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Tipo", "Type")}</span>
                  <select
                    className={input}
                    value={recForm.kind}
                    onChange={(e) => {
                      const kind = e.target.value as "expense" | "income";
                      setRecForm({ ...recForm, kind, category: (kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0] });
                    }}
                  >
                    <option value="expense">{tr("Gasto", "Expense")}</option>
                    <option value="income">{tr("Ingreso", "Income")}</option>
                  </select>
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Descripción", "Description")}</span>
                  <input className={input} value={recForm.description} maxLength={255} onChange={(e) => setRecForm({ ...recForm, description: e.target.value })} placeholder={tr("Ej. Alquiler, Netflix", "e.g. Rent, Netflix")} required />
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Monto", "Amount")}</span>
                  <MoneyInput className={input} value={recForm.amount} onChange={(e) => setRecForm({ ...recForm, amount: e.target.value })} placeholder="0.00" required />
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Categoría", "Category")}</span>
                  <select className={input} value={recForm.category} onChange={(e) => setRecForm({ ...recForm, category: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Cuenta", "Account")}</span>
                  <select className={input} value={recForm.account} onChange={(e) => setRecForm({ ...recForm, account: e.target.value })}>
                    <option value="">{tr("Sin cuenta", "No account")}</option>
                    {accounts.map((a) => <option key={a.id} value={a.name}>{a.name} ({a.currency})</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Frecuencia", "Frequency")}</span>
                  <select className={input} value={recForm.frequency} onChange={(e) => setRecForm({ ...recForm, frequency: e.target.value as RecurringFrequency })}>
                    {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{en ? f.en : f.es}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Próxima fecha", "Next date")}</span>
                  <input type="date" className={input} value={recForm.nextDate} onChange={(e) => setRecForm({ ...recForm, nextDate: e.target.value })} required />
                </label>
                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button type="button" onClick={() => setShowRecForm(false)} className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
                    {tr("Cancelar", "Cancel")}
                  </button>
                  <button type="submit" className={primaryBtn} disabled={busy}>{tr("Guardar", "Save")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGoalForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="goal-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 id="goal-modal-title" className="font-bold text-zinc-950 text-base flex items-center gap-2">
                  <Target className="w-4 h-4" aria-hidden="true" />
                  {tr("Metas de ahorro", "Savings goals")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                  aria-label={tr("Cerrar", "Close")}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={submitGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-[11px] text-zinc-500 space-y-1 sm:col-span-2">
                  <span>{tr("Nombre", "Name")}</span>
                  <input className={input} value={goalForm.name} maxLength={255} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} placeholder={tr("Ej. Fondo de emergencia", "e.g. Emergency fund")} required />
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Monto objetivo", "Target amount")}</span>
                  <MoneyInput className={input} value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} placeholder="0.00" required />
                </label>
                <label className="text-[11px] text-zinc-500 space-y-1">
                  <span>{tr("Fecha objetivo (opcional)", "Target date (optional)")}</span>
                  <input type="date" className={input} value={goalForm.date} min={todayISO()} onChange={(e) => setGoalForm({ ...goalForm, date: e.target.value })} />
                </label>
                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button type="button" onClick={() => setShowGoalForm(false)} className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
                    {tr("Cancelar", "Cancel")}
                  </button>
                  <button type="submit" className={primaryBtn} disabled={busy}>{tr("Guardar", "Save")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
