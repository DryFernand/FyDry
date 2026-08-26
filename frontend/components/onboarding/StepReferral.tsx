"use client";

import { motion } from "motion/react";
import { Check, Sparkles, Loader2, HeartHandshake } from "lucide-react";
import { OnboardingFormData } from "./types";

interface StepReferralProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const referralOptions = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "friend", label: "Recomendación de un amigo o familiar" },
  { id: "google", label: "Búsqueda en Google / Navegador" },
  { id: "x_twitter", label: "X (Twitter) o Threads" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "other", label: "Otro canal" },
];

export default function StepReferral({
  formData,
  updateData,
  onSubmit,
  onPrev,
  isLoading,
}: StepReferralProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referral_source) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          Última pregunta
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          ¿Cómo descubriste FyDry? Nos ayuda a seguir mejorando para nuestra comunidad.
        </p>
      </div>

      {/* Opciones de Referencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {referralOptions.map((opt) => {
          const isSelected = formData.referral_source === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => updateData({ referral_source: opt.id })}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-medium ${
                isSelected
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          );
        })}
      </div>

      {/* Detalle opcional si eligió amigo u otro */}
      {(formData.referral_source === "friend" || formData.referral_source === "other") && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            ¿Quién te lo recomendó o dónde lo viste? (opcional)
          </label>
          <input
            type="text"
            value={formData.referral_detail}
            onChange={(e) => updateData({ referral_detail: e.target.value })}
            placeholder="Ej. Mi hermano, podcast, foro..."
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
          />
        </motion.div>
      )}

      {/* Banner de Bienvenida */}
      <div className="p-3.5 rounded-2xl bg-zinc-100/70 border border-zinc-200/80 text-zinc-700 text-xs flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-zinc-950 shrink-0" />
        <span className="text-[11px] leading-relaxed">
          ¡Todo listo! Al finalizar, tu panel quedará configurado para empezar a ordenar tus gastos.
        </span>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading}
          className="py-2.5 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Atrás
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={!formData.referral_source || isLoading}
          className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>Finalizar y entrar a mi panel</span>
              <Sparkles className="w-3.5 h-3.5" />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
