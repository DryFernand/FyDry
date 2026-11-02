"use client";

import { motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { OnboardingAccountDraft, OnboardingFixedExpenseDraft, OnboardingFormData } from "./types";

interface StepMoneyProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const input =
  "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs";
const label = "block text-[11px] font-semibold text-zinc-600 mb-1";

const accountTypes: { id: OnboardingAccountDraft["type"]; label: string }[] = [
  { id: "bank", label: "Cuenta bancaria" },
  { id: "cash", label: "Efectivo" },
  { id: "savings", label: "Ahorro" },
  { id: "credit_card", label: "Tarjeta de crédito" },
];

const emptyAccount: OnboardingAccountDraft = { name: "", type: "bank", balance: "", credit_limit: "", cutoff_day: "", payment_day: "" };
const emptyFixed: OnboardingFixedExpenseDraft = { description: "", amount: "", day: "", category: "Vivienda & Alquiler" };

function DayInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="number" min={1} max={31} inputMode="numeric" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} className={input} />
  );
}

export default function StepMoney({ formData, updateData, onNext, onPrev }: StepMoneyProps) {
  const cur = formData.preferred_currency || "DOP";
  const { accounts, fixed_expenses: fixed } = formData;

  const setAccount = (i: number, fields: Partial<OnboardingAccountDraft>) =>
    updateData({ accounts: accounts.map((a, j) => (j === i ? { ...a, ...fields } : a)) });
  const setFixed = (i: number, fields: Partial<OnboardingFixedExpenseDraft>) =>
    updateData({ fixed_expenses: fixed.map((f, j) => (j === i ? { ...f, ...fields } : f)) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">Tu dinero hoy</h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Con esto tu panel arranca listo: presupuesto alineado a tu cobro, tus cuentas y tus gastos fijos. Todo es opcional y lo puedes cambiar después.
        </p>
      </div>

      {/* Día de cobro */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
          ¿Qué día del mes cobras?{formData.income_frequency === "biweekly" ? " (tu primer cobro del mes)" : ""}
        </label>
        <div className="w-28">
          <DayInput value={formData.pay_day} onChange={(v) => updateData({ pay_day: v })} placeholder="Ej. 15" />
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">Tu presupuesto se reiniciará ese día.</p>
      </div>

      {/* Cuentas */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-zinc-800">Tus cuentas principales</label>
        {accounts.map((a, i) => {
          const isCard = a.type === "credit_card";
          return (
            <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_8rem_auto] gap-2 items-end">
                <div>
                  <span className={label}>Nombre</span>
                  <input value={a.name} maxLength={255} onChange={(e) => setAccount(i, { name: e.target.value })}
                    placeholder="Ej. BHD Nómina" className={input} />
                </div>
                <div>
                  <span className={label}>Tipo</span>
                  <select value={a.type} onChange={(e) => setAccount(i, { type: e.target.value as OnboardingAccountDraft["type"] })}
                    className={`${input} cursor-pointer`}>
                    {accountTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <span className={label}>{isCard ? `Consumido (${cur})` : `Saldo (${cur})`}</span>
                  <input inputMode="decimal" value={a.balance} onChange={(e) => setAccount(i, { balance: e.target.value })}
                    placeholder="0.00" className={input} />
                </div>
                <button type="button" aria-label="Quitar cuenta" onClick={() => updateData({ accounts: accounts.filter((_, j) => j !== i) })}
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {isCard && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className={label}>Límite ({cur})</span>
                    <input inputMode="decimal" value={a.credit_limit} onChange={(e) => setAccount(i, { credit_limit: e.target.value })}
                      placeholder="0.00" className={input} />
                  </div>
                  <div>
                    <span className={label}>Día de corte</span>
                    <DayInput value={a.cutoff_day} onChange={(v) => setAccount(i, { cutoff_day: v })} placeholder="Ej. 5" />
                  </div>
                  <div>
                    <span className={label}>Día de pago</span>
                    <DayInput value={a.payment_day} onChange={(v) => setAccount(i, { payment_day: v })} placeholder="Ej. 28" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {accounts.length < 10 && (
          <button type="button" onClick={() => updateData({ accounts: [...accounts, { ...emptyAccount }] })}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Agregar cuenta
          </button>
        )}
      </div>

      {/* Gastos fijos */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-zinc-800">Gastos fijos de cada mes</label>
        {fixed.map((f, i) => (
          <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 grid grid-cols-2 sm:grid-cols-[1fr_7rem_4.5rem_auto] gap-2 items-end">
            <div className="col-span-2 sm:col-span-1">
              <span className={label}>Concepto</span>
              <input value={f.description} maxLength={255} onChange={(e) => setFixed(i, { description: e.target.value })}
                placeholder="Ej. Alquiler" className={input} />
            </div>
            <div>
              <span className={label}>Monto ({cur})</span>
              <input inputMode="decimal" value={f.amount} onChange={(e) => setFixed(i, { amount: e.target.value })}
                placeholder="0.00" className={input} />
            </div>
            <div>
              <span className={label}>Día</span>
              <DayInput value={f.day} onChange={(v) => setFixed(i, { day: v })} placeholder="1" />
            </div>
            <button type="button" aria-label="Quitar gasto fijo" onClick={() => updateData({ fixed_expenses: fixed.filter((_, j) => j !== i) })}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="col-span-2 sm:col-span-4">
              <span className={label}>Categoría</span>
              <select value={f.category} onChange={(e) => setFixed(i, { category: e.target.value })} className={`${input} cursor-pointer`}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        ))}
        {fixed.length < 15 && (
          <button type="button" onClick={() => updateData({ fixed_expenses: [...fixed, { ...emptyFixed }] })}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Agregar gasto fijo
          </button>
        )}
        {fixed.length > 0 && (
          <p className="text-[11px] text-zinc-400">
            Se registrarán solos cada mes{accounts.some((a) => a.type !== "credit_card" && a.name.trim()) ? " desde tu primera cuenta (no tarjeta)" : ""}. Puedes pausarlos en Plan y Metas.
          </p>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center gap-3 pt-3">
        <button type="button" onClick={onPrev}
          className="py-2.5 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer">
          Atrás
        </button>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>{accounts.length || fixed.length || formData.pay_day ? "Continuar" : "Lo hago luego"}</span>
          <span>&rarr;</span>
        </motion.button>
      </div>
    </form>
  );
}
