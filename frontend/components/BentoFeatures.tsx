"use client";

import { motion } from "motion/react";
import {
  Sparkles,
  Search,
  Zap,
  ShieldCheck,
  Smartphone,
  Layers,
  ArrowUpRight,
  TrendingDown,
  BrainCircuit,
  SlidersHorizontal,
} from "lucide-react";

const features = [
  {
    title: "Detección de Fugas y Gastos Hormiga",
    description:
      "Identifica micropagos inadvertidos, cafés diarios o suscripciones inactivas que drenan tu dinero cada mes sin que te des cuenta.",
    icon: TrendingDown,
    tag: "Ahorro Inteligente",
    colSpan: "md:col-span-2",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
        <div className="flex items-center justify-between text-zinc-600 mb-2">
          <span className="font-medium text-zinc-900">3 Suscripciones duplicadas detectadas</span>
          <span className="text-amber-600 font-semibold">-$28.99/mes</span>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-white rounded border border-zinc-200 text-[10px] text-zinc-700">Streaming A</span>
          <span className="px-2 py-1 bg-white rounded border border-zinc-200 text-[10px] text-zinc-700">Gym App</span>
          <span className="px-2 py-1 bg-white rounded border border-zinc-200 text-[10px] text-zinc-700">Cloud Storage</span>
        </div>
      </div>
    ),
  },
  {
    title: "Auto-Categorización con IA",
    description:
      "Escribe 'Cena con amigos 25' y FyDry interpretará el monto, fecha y categoría automáticamente en milisegundos.",
    icon: BrainCircuit,
    tag: "Automatización",
    colSpan: "md:col-span-1",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-zinc-900 text-white text-xs font-mono">
        <div className="text-zinc-400">&gt; Entrada rápida:</div>
        <div className="text-emerald-400 mt-1">&quot;Uber al aeropuerto $35&quot;</div>
        <div className="text-zinc-300 text-[10px] mt-2">✓ Guardado en Transporte</div>
      </div>
    ),
  },
  {
    title: "Diseño Libre de Estrés (Modo Paz Mental)",
    description:
      "Eliminamos el exceso de gráficos confusos. Solo ves lo que importa: cuánto puedes gastar hoy sin comprometer tu futuro.",
    icon: Sparkles,
    tag: "Minimalismo",
    colSpan: "md:col-span-1",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200/60 text-center">
        <div className="text-[11px] text-emerald-800 font-medium">Disponible para ocio hoy</div>
        <div className="text-xl font-bold text-emerald-950 mt-0.5">$84.50</div>
      </div>
    ),
  },
  {
    title: "Presupuestos Flexibles y Metas Claras",
    description:
      "Crea presupuestos que se adapten a tu estilo de vida real, no a fórmulas rígidas que te hagan sentir culpable.",
    icon: SlidersHorizontal,
    tag: "Flexibilidad",
    colSpan: "md:col-span-2",
    preview: (
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
          <div className="text-[10px] text-zinc-500">Meta Fondo Emergencia</div>
          <div className="text-xs font-bold text-zinc-900 mt-1">75% Completado</div>
          <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2">
            <div className="bg-zinc-900 h-1.5 rounded-full w-[75%]" />
          </div>
        </div>
        <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
          <div className="text-[10px] text-zinc-500">Presupuesto Supermercado</div>
          <div className="text-xs font-bold text-zinc-900 mt-1">$450 / $600</div>
          <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full w-[60%]" />
          </div>
        </div>
      </div>
    ),
  },
];

export default function BentoFeatures() {
  return (
    <section id="caracteristicas" className="py-20 md:py-28 bg-white border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold mb-3"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Diseñado con precisión</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900"
          >
            Todo lo que necesitas para dominar tus números
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base text-zinc-600"
          >
            Funcionalidades creadas bajo una premisa fundamental: brindarte el máximo control con la mínima fricción.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`${item.colSpan} p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100/80 px-2.5 py-1 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {item.preview}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
