"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Calculator, Sparkles, TrendingUp, HeartHandshake, ShieldAlert } from "lucide-react";

export default function InteractiveCalculator() {
  const [ingreso, setIngreso] = useState<number>(3000);
  const [gastos, setGastos] = useState<number>(2400);

  // Estimación de ahorro con FyDry (fugas detectadas + mejor presupuestación promedio ~18%)
  const ahorroActual = Math.max(0, ingreso - gastos);
  const ahorroEstimadoConFyDry = Math.round(ahorroActual + gastos * 0.15);
  const ahorroAnualExtra = (ahorroEstimadoConFyDry - ahorroActual) * 12;
  const tasaAhorro = Math.min(100, Math.round((ahorroEstimadoConFyDry / ingreso) * 100)) || 0;

  return (
    <section id="simulador" className="py-20 md:py-28 bg-zinc-50/70 border-b border-zinc-200/80 relative overflow-hidden">
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
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulador Financiero en Tiempo Real</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900"
          >
            Calcula tu potencial de tranquilidad
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base text-zinc-600"
          >
            Descubre cuánto dinero puedes recuperar al mes eliminando fugas inconscientes con el método FyDry.
          </motion.p>
        </div>

        {/* Interactive Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Sliders Side */}
          <div className="lg:col-span-7 space-y-7">
            {/* Ingreso Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-zinc-800">
                  Tus Ingresos Mensuales
                </label>
                <span className="text-base font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-md">
                  ${ingreso.toLocaleString()} USD
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="200"
                value={ingreso}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIngreso(val);
                  if (gastos > val) setGastos(val);
                }}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                <span>$1,000</span>
                <span>$8,000</span>
                <span>$15,000+</span>
              </div>
            </div>

            {/* Gastos Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-zinc-800">
                  Tus Gastos Mensuales Estimados
                </label>
                <span className="text-base font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-md">
                  ${gastos.toLocaleString()} USD
                </span>
              </div>
              <input
                type="range"
                min="500"
                max={ingreso}
                step="100"
                value={gastos}
                onChange={(e) => setGastos(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                <span>$500</span>
                <span>${(ingreso / 2).toLocaleString()}</span>
                <span>${ingreso.toLocaleString()}</span>
              </div>
            </div>

            {/* Insight Note */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-600 leading-relaxed">
                Al tener claridad de tus gastos fijos y variables, los usuarios de FyDry reducen en promedio un <strong>15% de gastos innecesarios</strong> en sus primeros 60 días.
              </p>
            </div>
          </div>

          {/* Results Card Side */}
          <div className="lg:col-span-5 bg-zinc-950 text-white rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-md">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Proyección con FyDry
              </div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                +${ahorroAnualExtra.toLocaleString()}
                <span className="text-sm font-normal text-zinc-400 ml-1.5">/ año</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Ahorro recuperado por optimización de gastos
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Ahorro mensual proyectado:</span>
                <span className="font-semibold text-emerald-400">${ahorroEstimadoConFyDry.toLocaleString()} / mes</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Tasa de ahorro total:</span>
                <span className="font-semibold text-white">{tasaAhorro}% de tus ingresos</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Índice de Paz Mental:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  {tasaAhorro > 20 ? "Óptimo (Zen)" : "En crecimiento"}
                </span>
              </div>
            </div>

            <a
              href="#empezar"
              className="mt-6 w-full text-center py-2.5 px-4 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-100 transition-colors shadow-xs"
            >
              Comenzar a optimizar ahora
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
