"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  History,
  Copy,
  FilePlus2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  X,
  Check,
  CopyPlus,
  Wallet,
} from "lucide-react";
import type { AccountItem } from "../types";
import {
  fetchAccountsApi,
  fetchUserSettingsApi,
  fetchPlansApi,
  fetchPlanApi,
  savePlanApi,
  deletePlanApi,
  type PlannerSummaryItem,
} from "@/lib/api";
import { formatMoney, isLiability, DEFAULT_TRANSFER_TAX_RATE } from "@/lib/money";
import {
  computePlan,
  autoPlanName,
  planSummaryText,
  type PlanData,
  type PlanAccount,
  type PlanTransfer,
  type PlanExpense,
  type AccountResult,
} from "@/lib/planner";
import ConfirmDialog, { useEscapeKey } from "../ConfirmDialog";
import MoneyInput from "@/components/ui/MoneyInput";

const DRAFT_KEY = "fydry_planner_draft_v1";
const CURRENCY = "DOP";

const card = "bg-white rounded-3xl border border-zinc-200/80 shadow-xs";
const input =
  "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";
const ghostBtn =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50";

const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n: number) => formatMoney(n, CURRENCY);

function toPlanAccount(a: AccountItem): PlanAccount {
  return { id: a.id, name: a.name, currency: a.currency || CURRENCY, realBalance: a.balance, startBalance: String(a.balance), keep: "0" };
}

function newPlan(accounts: AccountItem[], taxRate: number): PlanData {
  const first = accounts[0];
  return {
    version: 1,
    taxRate,
    accounts: first ? [toPlanAccount(first)] : [],
    incomes: [{ id: uid(), label: "Quincena", amount: "", accountId: first?.id || "" }],
    expenses: [],
    transfers: [],
  };
}

/** Agrega la cuenta al plan si aún no está (con su saldo real como punto de partida). */
function withAccount(plan: PlanData, accountId: string, real: AccountItem[]): PlanData {
  if (!accountId || plan.accounts.some((a) => a.id === accountId)) return plan;
  const acc = real.find((a) => a.id === accountId);
  return acc ? { ...plan, accounts: [...plan.accounts, toPlanAccount(acc)] } : plan;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? "bg-zinc-950" : "bg-zinc-300"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function CalculatorView() {
  const [realAccounts, setRealAccounts] = useState<AccountItem[]>([]);
  const [cards, setCards] = useState<AccountItem[]>([]);
  const [taxRate, setTaxRate] = useState(DEFAULT_TRANSFER_TAX_RATE);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planName, setPlanName] = useState(autoPlanName());
  const [planId, setPlanId] = useState<string | null>(null);
  const [summaryView, setSummaryView] = useState<"preview" | "applied">("preview");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<PlannerSummaryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PlannerSummaryItem | null>(null);
  const [addAccountId, setAddAccountId] = useState("");

  // Carga cuentas reales (solo lectura) y la tasa DGII; restaura el borrador si existe
  useEffect(() => {
    (async () => {
      const [accs, settings] = await Promise.all([fetchAccountsApi(), fetchUserSettingsApi()]);
      const rate = typeof settings?.transfer_tax_rate === "number" ? settings.transfer_tax_rate : DEFAULT_TRANSFER_TAX_RATE;
      const usable = accs.filter((a) => !isLiability(a) && (a.currency || CURRENCY) === CURRENCY);
      setRealAccounts(usable);
      setCards(accs.filter((a) => isLiability(a) && a.balance > 0));
      setTaxRate(rate);
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (draft?.plan?.version === 1) {
          setPlan({ ...draft.plan, taxRate: rate });
          setPlanName(draft.name || autoPlanName());
          setPlanId(draft.id || null);
          return;
        }
      } catch {
        // borrador corrupto o sin acceso: se empieza de cero
      }
      setPlan(newPlan(usable, rate));
    })();
  }, []);

  // Si cambias la tasa DGII en Configuración, el cálculo se actualiza al momento
  useEffect(() => {
    const onSettings = async () => {
      const settings = await fetchUserSettingsApi();
      if (typeof settings?.transfer_tax_rate !== "number") return;
      const rate = settings.transfer_tax_rate;
      setTaxRate(rate);
      setPlan((p) => (p ? { ...p, taxRate: rate } : p));
    };
    window.addEventListener("fydry_storage_updated", onSettings);
    return () => window.removeEventListener("fydry_storage_updated", onSettings);
  }, []);

  // Borrador automático para no perder lo escrito al cambiar de pantalla
  useEffect(() => {
    if (!plan) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ plan, name: planName, id: planId }));
    } catch {
      // sin almacenamiento: el plan sigue en memoria
    }
  }, [plan, planName, planId]);

  useEscapeKey(historyOpen && !pendingDelete, () => setHistoryOpen(false));

  const result = useMemo(() => (plan ? computePlan(plan) : null), [plan]);

  if (!plan || !result) {
    return (
      <div className="flex items-center justify-center py-24 text-xs text-zinc-400" role="status">
        Cargando calculadora…
      </div>
    );
  }

  const update = (fn: (p: PlanData) => PlanData) => {
    setMessage(null);
    setPlan((p) => (p ? fn(p) : p));
  };
  const resultFor = (id: string) => result.accounts.find((r) => r.id === id);
  const notInPlan = realAccounts.filter((a) => !plan.accounts.some((p) => p.id === a.id));
  const ratePct = Math.round(taxRate * 100000) / 1000;

  // ---------- acciones ----------
  const setIncome = (id: string, patch: Partial<PlanData["incomes"][number]>) =>
    update((p) => {
      const next = { ...p, incomes: p.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
      return patch.accountId ? withAccount(next, patch.accountId, realAccounts) : next;
    });
  const setAccount = (id: string, patch: Partial<PlanAccount>) =>
    update((p) => ({ ...p, accounts: p.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const removeAccount = (id: string) =>
    update((p) => ({
      ...p,
      accounts: p.accounts.filter((a) => a.id !== id),
      incomes: p.incomes.map((i) => (i.accountId === id ? { ...i, accountId: "" } : i)),
      expenses: p.expenses.filter((e) => e.accountId !== id),
      transfers: p.transfers.filter((t) => t.fromId !== id && t.toId !== id),
    }));
  const addExpense = (accountId: string, preset?: Partial<PlanExpense>) =>
    update((p) => ({
      ...p,
      expenses: [...p.expenses, { id: uid(), accountId, label: "", amount: "", kind: "gasto", applyTax: false, ...preset }],
    }));
  const setExpense = (id: string, patch: Partial<PlanExpense>) =>
    update((p) => ({ ...p, expenses: p.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const addTransfer = (fromId: string) =>
    update((p) => {
      const target = p.accounts.find((a) => a.id !== fromId) || realAccounts.find((a) => a.id !== fromId);
      const hasRest = p.transfers.some((t) => t.fromId === fromId && t.mode === "rest");
      const t: PlanTransfer = { id: uid(), fromId, toId: target?.id || "", mode: hasRest ? "fixed" : "rest", amount: "", applyTax: true };
      return withAccount({ ...p, transfers: [...p.transfers, t] }, t.toId, realAccounts);
    });
  const setTransfer = (id: string, patch: Partial<PlanTransfer>) =>
    update((p) => {
      const next = { ...p, transfers: p.transfers.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
      return patch.toId ? withAccount(next, patch.toId, realAccounts) : next;
    });

  const startNew = () => {
    setPlan(newPlan(realAccounts, taxRate));
    setPlanName(autoPlanName());
    setPlanId(null);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = {
        ...plan,
        summary: {
          total_income: result.totals.income,
          final_total: result.totals.finalTotal,
          transferred: result.totals.transferred,
          taxes: result.totals.taxes,
        },
      };
      const saved = await savePlanApi(planName.trim() || autoPlanName(), data, planId || undefined);
      setPlanId(saved.id);
      setMessage({ ok: true, text: planId ? "Cambios guardados en el historial." : "Planificación guardada en el historial." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(planSummaryText(planName, result, money));
      setMessage({ ok: true, text: "Resumen copiado. Puedes pegarlo en WhatsApp o en tus notas." });
    } catch {
      setMessage({ ok: false, text: "No se pudo copiar el resumen." });
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setHistory(await fetchPlansApi());
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo cargar el historial." });
    } finally {
      setHistoryLoading(false);
    }
  };

  /** Abrir: ver/editar el plan tal como se guardó. Duplicar: nueva quincena con saldos reales de hoy. */
  const loadFromHistory = async (item: PlannerSummaryItem, duplicate: boolean) => {
    try {
      const full = await fetchPlanApi(item.id);
      const data = full.data as PlanData;
      let accounts = data.accounts;
      if (duplicate) {
        accounts = data.accounts
          .filter((a) => realAccounts.some((r) => r.id === a.id))
          .map((a) => {
            const real = realAccounts.find((r) => r.id === a.id)!;
            return { ...a, name: real.name, realBalance: real.balance, startBalance: String(real.balance) };
          });
      }
      const ids = new Set(accounts.map((a) => a.id));
      setPlan({
        version: 1,
        taxRate,
        accounts,
        incomes: data.incomes.map((i) => (ids.has(i.accountId) ? i : { ...i, accountId: "" })),
        expenses: data.expenses.filter((e) => ids.has(e.accountId)),
        transfers: data.transfers.filter((t) => ids.has(t.fromId) && ids.has(t.toId)),
      });
      setPlanName(duplicate ? autoPlanName() : full.name);
      setPlanId(duplicate ? null : full.id);
      setHistoryOpen(false);
      setMessage({ ok: true, text: duplicate ? `Duplicada "${full.name}" con tus saldos de hoy.` : `Abriste "${full.name}".` });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo abrir la planificación." });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deletePlanApi(pendingDelete.id);
      setHistory((h) => h.filter((x) => x.id !== pendingDelete.id));
      if (planId === pendingDelete.id) setPlanId(null);
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo eliminar." });
    } finally {
      setPendingDelete(null);
    }
  };

  const activeAccounts = result.accounts.filter((r) => r.incomes.length || r.incoming.length || r.outgoing.length || r.expenses.length);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className={`${card} p-5 sm:p-6 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
              <Calculator className="w-6 h-6" aria-hidden="true" /> Calculadora de quincena
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Planifica cuánto dejar y cuánto transferir a cada cuenta. Usa tus saldos reales como punto de partida, pero nada de esto se registra en tus cuentas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ghostBtn} onClick={startNew}>
              <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" /> Nueva
            </button>
            <button type="button" className={ghostBtn} onClick={openHistory}>
              <History className="w-3.5 h-3.5" aria-hidden="true" /> Historial
            </button>
            <button type="button" className={ghostBtn} onClick={copySummary}>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copiar resumen
            </button>
            <button type="button" className={primaryBtn} onClick={save} disabled={saving}>
              <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saving ? "Guardando…" : planId ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex-1 text-[11px] text-zinc-500 space-y-1">
            <span>Nombre de la planificación</span>
            <input className={input} value={planName} maxLength={120} onChange={(e) => setPlanName(e.target.value)} />
          </label>
          <div className="text-[11px] text-zinc-500 sm:pt-4">
            Impuesto DGII: <strong className="text-zinc-800">{ratePct}%</strong> por transferencia (cámbialo en Configuración → Impuestos)
          </div>
        </div>
        {message && (
          <div role="status" className={`p-2.5 rounded-xl text-xs ${message.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70" : "bg-rose-50 text-rose-700 border border-rose-200/70"}`}>
            {message.text}
          </div>
        )}
        {result.errors.map((e) => (
          <div key={e} role="alert" className="p-2.5 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200/70 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {e}
          </div>
        ))}
      </div>

      {realAccounts.length === 0 ? (
        <div className={`${card} p-10 text-center text-xs text-zinc-500`}>
          Necesitas al menos una cuenta en pesos (que no sea tarjeta de crédito) para planificar. Créala en Cuentas.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 space-y-6">
            {/* Ingresos */}
            <section className={`${card} p-5 space-y-3`} aria-labelledby="calc-incomes">
              <h2 id="calc-incomes" className="text-sm font-bold text-zinc-950">1. ¿Qué dinero entra?</h2>
              {plan.incomes.map((inc) => (
                <div key={inc.id} className="grid grid-cols-12 gap-2 items-center">
                  <input className={`${input} col-span-12 sm:col-span-4`} value={inc.label} placeholder="Quincena, freelance…" aria-label="Concepto del ingreso" onChange={(e) => setIncome(inc.id, { label: e.target.value })} />
                  <MoneyInput className={`${input} col-span-5 sm:col-span-3 font-bold`} value={inc.amount} placeholder="30,000" aria-label="Monto del ingreso" onChange={(e) => setIncome(inc.id, { amount: e.target.value })} />
                  <select className={`${input} col-span-6 sm:col-span-4`} value={inc.accountId} aria-label="Cuenta donde entra" onChange={(e) => setIncome(inc.id, { accountId: e.target.value })}>
                    <option value="">Entra a…</option>
                    {realAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button type="button" className="col-span-1 p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Quitar ingreso" onClick={() => update((p) => ({ ...p, incomes: p.incomes.filter((i) => i.id !== inc.id) }))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" className={ghostBtn} onClick={() => update((p) => ({ ...p, incomes: [...p.incomes, { id: uid(), label: "", amount: "", accountId: p.accounts[0]?.id || "" }] }))}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar ingreso
              </button>
            </section>

            {/* Cuentas */}
            <section className="space-y-4" aria-labelledby="calc-accounts">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="calc-accounts" className="text-sm font-bold text-zinc-950">2. ¿Qué haces en cada cuenta?</h2>
                {notInPlan.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select className={`${input} w-48`} value={addAccountId} aria-label="Cuenta para agregar" onChange={(e) => setAddAccountId(e.target.value)}>
                      <option value="">Agregar cuenta…</option>
                      {notInPlan.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button type="button" className={ghostBtn} disabled={!addAccountId} onClick={() => { update((p) => withAccount(p, addAccountId, realAccounts)); setAddAccountId(""); }}>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar
                    </button>
                  </div>
                )}
              </div>

              {plan.accounts.map((acc) => {
                const r = resultFor(acc.id)!;
                const expenses = plan.expenses.filter((e) => e.accountId === acc.id);
                const transfers = plan.transfers.filter((t) => t.fromId === acc.id);
                const changed = Number(acc.startBalance.replace(/,/g, "")) !== acc.realBalance;
                return (
                  <div key={acc.id} className={`${card} p-5 space-y-4 ${r.issues.length ? "border-rose-300" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center"><Wallet className="w-4 h-4" aria-hidden="true" /></div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-950">{acc.name}</h3>
                          <p className="text-[11px] text-zinc-400">Saldo real hoy: {money(acc.realBalance)}</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="text-[10px] text-zinc-500 space-y-1 w-32">
                          <span>Saldo de partida</span>
                          <MoneyInput allowNegative className={input} value={acc.startBalance} onChange={(e) => setAccount(acc.id, { startBalance: e.target.value })} />
                        </label>
                        {changed && (
                          <button type="button" title="Volver al saldo real" aria-label="Volver al saldo real" className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer" onClick={() => setAccount(acc.id, { startBalance: String(acc.realBalance) })}>
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <label className="text-[10px] text-zinc-500 space-y-1 w-28">
                          <span>Dejar mínimo</span>
                          <MoneyInput className={input} value={acc.keep} onChange={(e) => setAccount(acc.id, { keep: e.target.value })} />
                        </label>
                        <button type="button" className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label={`Quitar ${acc.name} del plan`} onClick={() => removeAccount(acc.id)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {(r.incomes.length > 0 || r.incoming.length > 0) && (
                      <div className="text-[11px] text-zinc-600 flex flex-wrap gap-1.5">
                        {r.incomes.map((i, idx) => <span key={`i${idx}`} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800">+ {i.label}: {money(i.amount)}</span>)}
                        {r.incoming.map((i, idx) => <span key={`t${idx}`} className="px-2 py-1 rounded-lg bg-sky-50 text-sky-800">+ desde {i.from}: {money(i.amount)}</span>)}
                      </div>
                    )}

                    {/* Gastos planificados */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gastos planificados en esta cuenta</div>
                      {expenses.map((e) => {
                        const er = r.expenses.find((x) => x.id === e.id);
                        return (
                          <div key={e.id} className="grid grid-cols-12 gap-2 items-center">
                            <input className={`${input} col-span-12 sm:col-span-4`} value={e.label} placeholder="ITLA, pasaje, tarjeta…" aria-label="Concepto del gasto" onChange={(ev) => setExpense(e.id, { label: ev.target.value })} />
                            <MoneyInput className={`${input} col-span-4 sm:col-span-2`} value={e.amount} placeholder="0.00" aria-label="Monto del gasto" onChange={(ev) => setExpense(e.id, { amount: ev.target.value })} />
                            <select className={`${input} col-span-4 sm:col-span-2`} value={e.kind} aria-label="Tipo" onChange={(ev) => setExpense(e.id, { kind: ev.target.value as PlanExpense["kind"] })}>
                              <option value="gasto">Gasto</option>
                              <option value="ahorro">Ahorro</option>
                            </select>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <Toggle checked={e.applyTax} onChange={(v) => setExpense(e.id, { applyTax: v })} label="Cobra impuesto DGII" />
                              <span>{e.applyTax && er ? `+${money(er.tax)}` : "Sin impuesto"}</span>
                            </div>
                            <button type="button" className="col-span-1 p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Quitar gasto" onClick={() => update((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== e.id) }))}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" className={ghostBtn} onClick={() => addExpense(acc.id)}>
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Gasto
                        </button>
                        {cards.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addExpense(acc.id, { label: `Pago tarjeta ${c.name}`, amount: String(c.balance), applyTax: true })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200/70 text-[11px] font-medium text-sky-800 hover:bg-sky-100 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" aria-hidden="true" /> Pagar {c.name} ({money(c.balance)})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transferencias */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Transferir desde esta cuenta</div>
                      {transfers.map((t) => {
                        const tr = r.outgoing.find((x) => x.id === t.id);
                        return (
                          <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                              <select className={input} value={t.toId} aria-label="Cuenta destino" onChange={(ev) => setTransfer(t.id, { toId: ev.target.value })}>
                                {realAccounts.filter((a) => a.id !== acc.id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </div>
                            <select className={`${input} col-span-4 sm:col-span-2`} value={t.mode} aria-label="Tipo de monto" onChange={(ev) => setTransfer(t.id, { mode: ev.target.value as PlanTransfer["mode"] })}>
                              <option value="rest">El resto</option>
                              <option value="fixed">Monto fijo</option>
                            </select>
                            {t.mode === "fixed" ? (
                              <MoneyInput className={`${input} col-span-4 sm:col-span-2 font-bold`} value={t.amount} placeholder="0.00" aria-label="Monto a transferir" onChange={(ev) => setTransfer(t.id, { amount: ev.target.value })} />
                            ) : (
                              <div className="col-span-4 sm:col-span-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900" aria-label="Monto calculado">
                                {money(tr?.amount || 0)}
                              </div>
                            )}
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <Toggle checked={t.applyTax} onChange={(v) => setTransfer(t.id, { applyTax: v })} label="Cobra impuesto DGII" />
                              <span>{t.applyTax && tr ? `+${money(tr.tax)}` : "Sin impuesto"}</span>
                            </div>
                            <button type="button" className="col-span-1 p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Quitar transferencia" onClick={() => update((p) => ({ ...p, transfers: p.transfers.filter((x) => x.id !== t.id) }))}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {realAccounts.length > 1 && (
                        <button type="button" className={ghostBtn} onClick={() => addTransfer(acc.id)}>
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Transferencia
                        </button>
                      )}
                    </div>

                    <AccountFooter result={r} />
                  </div>
                );
              })}
            </section>
          </div>

          {/* Resumen */}
          <aside className={`${card} p-5 space-y-4 xl:sticky xl:top-6`} aria-labelledby="calc-summary">
            <h2 id="calc-summary" className="text-sm font-bold text-zinc-950">3. Resumen</h2>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 text-xs font-semibold" role="tablist">
              {([["preview", "Vista previa"], ["applied", "Con gastos aplicados"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={summaryView === id}
                  onClick={() => setSummaryView(id)}
                  className={`py-1.5 rounded-lg cursor-pointer ${summaryView === id ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeAccounts.length === 0 && <p className="text-xs text-zinc-400">Agrega un ingreso, gastos o transferencias para ver el resumen.</p>}
            <div className="space-y-3">
              {activeAccounts.map((r) => (
                <div key={r.id} className={`p-3 rounded-2xl border text-xs space-y-1.5 ${r.final < 0 || r.beforeExpenses < 0 ? "border-rose-300 bg-rose-50/50" : "border-zinc-200/80"}`}>
                  <div className="flex justify-between font-bold text-zinc-950">
                    <span>{r.name}</span>
                    <span>{money(summaryView === "preview" ? r.beforeExpenses : r.final)}</span>
                  </div>
                  {r.outgoing.map((t) => (
                    <div key={t.id} className="text-sky-800">
                      <div className="flex justify-between gap-2">
                        <span>→ Transferir a {t.to}</span>
                        <span className="font-semibold whitespace-nowrap">{money(t.amount)}</span>
                      </div>
                      {t.tax > 0 && <div className="text-[10px] text-sky-700/80 text-right">+ impuesto {money(t.tax)}</div>}
                    </div>
                  ))}
                  {summaryView === "preview" ? (
                    <>
                      <div className="text-[10px] text-zinc-500">Disponible antes de pagar. Gastos planificados:</div>
                      {r.expenses.length === 0 && <div className="text-zinc-400">Ninguno</div>}
                      {r.expenses.map((e) => (
                        <div key={e.id} className="flex justify-between text-zinc-600">
                          <span>• {e.label}{e.kind === "ahorro" ? " (ahorro)" : ""}</span>
                          <span>{money(e.amount)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-zinc-500">
                        <span>Antes de pagar</span>
                        <span>{money(r.beforeExpenses)}</span>
                      </div>
                      {r.expenses.map((e) => (
                        <div key={e.id} className="flex justify-between text-zinc-600">
                          <span>− {e.label}</span>
                          <span>{money(e.amount + e.tax)}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between font-bold pt-1 border-t border-zinc-100 ${r.final < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        <span>Queda</span>
                        <span>{money(r.final)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <dl className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
              {[
                ["Ingresos", result.totals.income],
                ["Transferencias", result.totals.transferred],
                ["Impuestos DGII", result.totals.taxes],
                ["Gastos", result.totals.expenses],
                ["Ahorro", result.totals.savings],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between text-zinc-600">
                  <dt>{label}</dt>
                  <dd className="font-semibold text-zinc-900">{money(value as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-100 text-sm font-bold">
                <dt>Te quedan en total</dt>
                <dd className={result.totals.finalTotal < 0 ? "text-rose-600" : "text-zinc-950"}>{money(result.totals.finalTotal)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}

      {/* Historial */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setHistoryOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="calc-history-title" className="w-full max-w-lg bg-white rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 id="calc-history-title" className="text-base font-bold text-zinc-950">Planificaciones guardadas</h3>
              <button type="button" aria-label="Cerrar historial" className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 cursor-pointer" onClick={() => setHistoryOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyLoading ? (
              <p className="text-xs text-zinc-400" role="status">Cargando…</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-zinc-400">Aún no has guardado planificaciones.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {history.map((h) => (
                  <li key={h.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                        {h.name} {h.id === planId && <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="Abierta" />}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(h.createdAt).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                        {typeof h.summary.total_income === "number" && ` · Ingresos ${money(h.summary.total_income)}`}
                        {typeof h.summary.final_total === "number" && ` · Quedan ${money(h.summary.final_total)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className={ghostBtn} onClick={() => loadFromHistory(h, false)}>Abrir</button>
                      <button type="button" className={ghostBtn} onClick={() => loadFromHistory(h, true)} title="Usar como base para una nueva quincena">
                        <CopyPlus className="w-3.5 h-3.5" aria-hidden="true" /> Duplicar
                      </button>
                      <button type="button" className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label={`Eliminar ${h.name}`} onClick={() => setPendingDelete(h)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Eliminar planificación"
        message={`¿Eliminar "${pendingDelete?.name}" del historial? No afecta tus cuentas.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function AccountFooter({ result }: { result: AccountResult }) {
  return (
    <div className="pt-3 border-t border-zinc-100 space-y-1.5">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-[10px] text-zinc-500">Tendrá antes de pagar</div>
          <div className={`font-bold ${result.beforeExpenses < 0 ? "text-rose-600" : "text-zinc-900"}`}>{money(result.beforeExpenses)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500">Queda al final</div>
          <div className={`text-base font-extrabold ${result.final < 0 ? "text-rose-600" : "text-emerald-700"}`}>{money(result.final)}</div>
        </div>
      </div>
      {result.issues.map((i) => (
        <p key={i} role="alert" className="text-[11px] text-rose-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" /> {i}
        </p>
      ))}
    </div>
  );
}
