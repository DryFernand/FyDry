"use client";

import { motion } from "motion/react";
import { Briefcase, Laptop, Store, GraduationCap, Compass } from "lucide-react";
import { OnboardingFormData } from "./types";

interface StepWorkProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const employmentTypes = [
  {
    id: "employed",
    title: "Empleado por cuenta ajena",
    desc: "Recibo un sueldo fijo en una empresa u organización.",
    icon: Briefcase,
  },
  {
    id: "freelance",
    title: "Freelancer / Autónomo",
    desc: "Presto servicios independientes y tengo ingresos variables.",
    icon: Laptop,
  },
  {
    id: "business_owner",
    title: "Dueño de Negocio / Emprendedor",
    desc: "Gestiono una empresa, comercio o proyecto propio.",
    icon: Store,
  },
  {
    id: "student",
    title: "Estudiante",
    desc: "En etapa de formación o primeras experiencias laborales.",
    icon: GraduationCap,
  },
  {
    id: "other",
    title: "Otra situación",
    desc: "Búsqueda activa, año sabático o ingresos mixtos.",
    icon: Compass,
  },
];

export default function StepWork({
  formData,
  updateData,
  onNext,
  onPrev,
}: StepWorkProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employment_type) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          ¿A qué te dedicas actualmente?
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Esto nos ayuda a adaptar los flujos de cobro y presupuestos a tu ritmo de trabajo.
        </p>
      </div>

      {/* Selector de situación laboral */}
      <div className="space-y-2.5">
        {employmentTypes.map((item) => {
          const Icon = item.icon;
          const isSelected = formData.employment_type === item.id;
          return (
            <div
              key={item.id}
              onClick={() => updateData({ employment_type: item.id })}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                isSelected
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                  : "border-zinc-200/90 bg-white hover:border-zinc-300 text-zinc-900"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isSelected ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold leading-snug">{item.title}</h4>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    isSelected ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Puesto o Área / Industria */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
          Puesto o industria (opcional)
        </label>
        <input
          type="text"
          value={formData.industry_or_role}
          onChange={(e) => updateData({ industry_or_role: e.target.value })}
          placeholder="Ej. Desarrollador, Diseñador, Marketing, Salud, Ventas"
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
        />
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
          disabled={!formData.employment_type}
          className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>Continuar</span>
          <span>&rarr;</span>
        </motion.button>
      </div>
    </form>
  );
}
