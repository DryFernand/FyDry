"use client";

import { motion } from "motion/react";
import { Coins, Bot, BellRing, FileDown } from "lucide-react";

const stats = [
  {
    icon: Coins,
    value: "RD$ · US$",
    label: "Pesos y dólares",
    subtext: "Cada cuenta en su moneda, sin mezclar totales",
  },
  {
    icon: Bot,
    value: "IA",
    label: "Asistente conversacional",
    subtext: "Pídele que registre un gasto y confírmalo",
  },
  {
    icon: BellRing,
    value: "5",
    label: "Tipos de alertas",
    subtext: "Corte, pago, sobregiro, saldo mínimo y presupuesto",
  },
  {
    icon: FileDown,
    value: "CSV · PDF",
    label: "Tus datos son tuyos",
    subtext: "Exporta tu historial cuando quieras",
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
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group flex flex-col items-center text-center p-4 rounded-xl bg-white border border-zinc-200/70 shadow-xs hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-[box-shadow,border-color]"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mb-2 transition-colors group-hover:bg-zinc-950 group-hover:text-emerald-400">
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
