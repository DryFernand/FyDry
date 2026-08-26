"use client";

import { motion } from "motion/react";
import { Sparkles, Clock, Smile, Lock } from "lucide-react";

const stats = [
  {
    icon: Smile,
    value: "99.2%",
    label: "Menos estrés financiero",
    subtext: "Claridad total de finanzas en 1 solo vistazo",
  },
  {
    icon: Clock,
    value: "< 30s",
    label: "Tiempo diario invertido",
    subtext: "Registro veloz y categorización con IA",
  },
  {
    icon: Sparkles,
    value: "+24%",
    label: "Ahorro promedio mensual",
    subtext: "Detección de fugas y gastos hormiga",
  },
  {
    icon: Lock,
    value: "256-bit",
    label: "Cifrado de grado bancario",
    subtext: "Tus datos nunca se venden ni se comparten",
  },
];

export default function StatsBar() {
  return (
    <section className="py-14 border-b border-zinc-200/80 bg-zinc-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
        >
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-zinc-200/70 shadow-xs hover:border-zinc-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                  {item.value}
                </div>
                <div className="text-xs font-semibold text-zinc-800 mt-1">
                  {item.label}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 max-w-[160px]">
                  {item.subtext}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
