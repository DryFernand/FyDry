"use client";

import { motion } from "motion/react";
import { Check, ShieldAlert, Target, Sparkles, TrendingUp } from "lucide-react";
import { OnboardingFormData } from "./types";

interface StepGoalsProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const situations = [
  {
    id: "stressful",
    title: "Vivo al día y me genera estrés",
    desc: "Llego justo a fin de mes y los imprevistos me desestabilizan.",
  },
  {
    id: "living_paycheck",
    title: "Gano bien pero no sé en qué se va el dinero",
    desc: "Ingresos suficientes pero se diluyen en gastos hormiga o descontrol.",
  },
  {
    id: "stable_growing",
    title: "Tengo control básico y quiero optimizar",
    desc: "Quiero maximizar mi ahorro mensual y tener métricas claras.",
  },
  {
    id: "wealth_building",
    title: "Buscando acelerar inversiones y patrimonio",
    desc: "Tengo orden y busco estructurar flujos para invertir más rápido.",
  },
];

const goalsList = [
  { id: "emergency_fund", label: "Construir o blindar mi fondo de emergencia" },
  { id: "debt_payoff", label: "Pagar y eliminar deudas pendientes" },
  { id: "stop_living_paycheck", label: "Romper el ciclo de vivir al día" },
  { id: "save_specific_goal", label: "Ahorrar para una meta (casa, viaje, coche)" },
  { id: "expense_clarity", label: "Entender con precisión mis gastos fijos vs variables" },
  { id: "invest_more", label: "Tener excedente mensual garantizado para invertir" },
];

export default function StepGoals({
  formData,
  updateData,
  onNext,
  onPrev,
}: StepGoalsProps) {
  const toggleGoal = (goalId: string) => {
    const current = formData.primary_goals || [];
    if (current.includes(goalId)) {
      updateData({ primary_goals: current.filter((g) => g !== goalId) });
    } else {
      updateData({ primary_goals: [...current, goalId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.financial_situation_status) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          Situación actual y tus metas
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Diseñaremos alertas inteligentes para ayudarte a cumplir tus prioridades sin esfuerzo.
        </p>
      </div>

      {/* Situación Económica Actual */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          ¿Cómo describirías tu situación financiera hoy?
        </label>
        <div className="space-y-2">
          {situations.map((sit) => {
            const isSelected = formData.financial_situation_status === sit.id;
            return (
              <div
                key={sit.id}
                onClick={() => updateData({ financial_situation_status: sit.id })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{sit.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    isSelected ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {sit.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metas Principales (Multi-select) */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          ¿Qué esperas lograr principalmente con FyDry? (Elige las que apliquen)
        </label>
        <div className="space-y-2">
          {goalsList.map((goal) => {
            const isSelected = formData.primary_goals?.includes(goal.id);
            return (
              <div
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 font-semibold text-zinc-950 ring-1 ring-zinc-900/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                }`}
              >
                <span>{goal.label}</span>
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
          disabled={!formData.financial_situation_status}
          className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>Continuar</span>
          <span>&rarr;</span>
        </motion.button>
      </div>
    </form>
  );
}
