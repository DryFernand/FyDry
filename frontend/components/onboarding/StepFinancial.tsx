"use client";

import { motion } from "motion/react";
import { Check, Wallet, Calendar, TrendingUp } from "lucide-react";
import { OnboardingFormData } from "./types";

interface StepFinancialProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const incomeRanges = [
  { id: "under_800", label: "Menos de $800 / mes" },
  { id: "800_2000", label: "$800 - $2,000 / mes" },
  { id: "2000_4500", label: "$2,000 - $4,500 / mes" },
  { id: "over_4500", label: "Más de $4,500 / mes" },
];

const incomeSourcesList = [
  { id: "salary", label: "Sueldo o Nómina fija" },
  { id: "freelance_clients", label: "Clientes / Trabajos independientes" },
  { id: "business_sales", label: "Ventas de mi negocio o comercio" },
  { id: "investments", label: "Inversiones / Dividendos / Rentas" },
  { id: "support_allowance", label: "Ayuda familiar, beca o pensión" },
];

const frequencies = [
  { id: "monthly", label: "Mensual" },
  { id: "biweekly", label: "Quincenal" },
  { id: "weekly", label: "Semanal" },
  { id: "irregular", label: "Variable / Sin fecha fija" },
];

export default function StepFinancial({
  formData,
  updateData,
  onNext,
  onPrev,
}: StepFinancialProps) {
  const toggleSource = (sourceId: string) => {
    const current = formData.income_sources || [];
    if (current.includes(sourceId)) {
      updateData({ income_sources: current.filter((s) => s !== sourceId) });
    } else {
      updateData({ income_sources: [...current, sourceId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.monthly_income_range) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          Tus ingresos y finanzas
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Tus datos son 100% privados y encriptados. Los usamos solo para calibrar tus presupuestos.
        </p>
      </div>

      {/* Rango de Ingresos */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          Rango aproximado de ingresos mensuales
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {incomeRanges.map((range) => {
            const isSelected = formData.monthly_income_range === range.id;
            return (
              <div
                key={range.id}
                onClick={() => updateData({ monthly_income_range: range.id })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-medium ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fuentes de Ingreso (Multi-select) */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          ¿De dónde provienen tus ingresos? (Puedes seleccionar varios)
        </label>
        <div className="space-y-2">
          {incomeSourcesList.map((source) => {
            const isSelected = formData.income_sources?.includes(source.id);
            return (
              <div
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 font-semibold text-zinc-950 ring-1 ring-zinc-900/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                }`}
              >
                <span>{source.label}</span>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                    isSelected
                      ? "bg-zinc-950 border-zinc-950 text-white"
                      : "border-zinc-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frecuencia de cobro */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          ¿Con qué frecuencia sueles recibir tus ingresos?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {frequencies.map((freq) => {
            const isSelected = formData.income_frequency === freq.id;
            return (
              <button
                key={freq.id}
                type="button"
                onClick={() => updateData({ income_frequency: freq.id })}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                }`}
              >
                {freq.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={onPrev}
          className="py-2.5 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          Atrás
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={!formData.monthly_income_range}
          className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>Continuar</span>
          <span>&rarr;</span>
        </motion.button>
      </div>
    </form>
  );
}
