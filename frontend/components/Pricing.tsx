"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Sparkles, Zap, ArrowRight, Shield } from "lucide-react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="precios" className="py-20 md:py-28 bg-zinc-50/50 border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold mb-3 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precios Simples y Transparentes</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900"
          >
            Invierte en tu tranquilidad mental
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base text-zinc-600"
          >
            Sin costos ocultos, sin comisiones sorpresa. Cancela o cambia de plan en cualquier momento.
          </motion.p>

          {/* Toggle Mensual / Anual */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-zinc-200/80 border border-zinc-300/60">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                !isAnnual
                  ? "bg-white text-zinc-950 shadow-xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? "bg-white text-zinc-950 shadow-xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <span>Anual</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Ahorra 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Plan Starter */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-sm font-bold text-zinc-900">Starter</div>
              <div className="text-xs text-zinc-500 mt-1">
                Ideal para quienes dan sus primeros pasos hacia el orden financiero.
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-zinc-950">$0</span>
                <span className="text-xs text-zinc-500 font-medium">/ gratis para siempre</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-zinc-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Registro manual ilimitado de gastos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasta 3 presupuestos activos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exportación en formato CSV</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 dispositivo</span>
                </li>
              </ul>
            </div>

            <a
              href="#empezar"
              className="mt-8 w-full block text-center py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs transition-colors"
            >
              Comenzar gratis
            </a>
          </motion.div>

          {/* Plan Pro (Featured) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="p-7 rounded-2xl bg-zinc-950 text-white border border-zinc-900 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            {/* Featured Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Más Elegido
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>FyDry Pro</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                La experiencia completa para automatizar y optimizar tus finanzas.
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  ${isAnnual ? "4.50" : "6.00"}
                </span>
                <span className="text-xs text-zinc-400 font-medium">/ mes (facturado {isAnnual ? "anual" : "mensual"})</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Auto-categorización con IA</strong> en tiempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Detector de gastos hormiga</strong> y suscripciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Presupuestos y metas de ahorro ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronización multi-dispositivo en la nube</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Modo Paz Mental y reportes ejecutivos en PDF</span>
                </li>
              </ul>
            </div>

            <a
              href="#empezar"
              className="mt-8 w-full block text-center py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
            >
              Comenzar prueba gratis de 14 días
            </a>
          </motion.div>

          {/* Plan Lifetime */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <span>Lifetime Pass</span>
                <Shield className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Paga una sola vez, úsalo de por vida. Sin suscripciones recurrentes.
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-zinc-950">$89</span>
                <span className="text-xs text-zinc-500 font-medium">/ pago único</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-zinc-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Todas las funciones del plan Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Actualizaciones mayores de por vida</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Acceso anticipado a nuevas funciones de IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Soporte prioritario VIP</span>
                </li>
              </ul>
            </div>

            <a
              href="#empezar"
              className="mt-8 w-full block text-center py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors"
            >
              Obtener acceso de por vida
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
