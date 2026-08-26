"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function CTASection() {
  return (
    <section id="empezar" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-zinc-950 text-white p-8 sm:p-14 overflow-hidden shadow-2xl border border-zinc-900"
        >
          {/* Subtle glow background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Únete a más de 12,000 usuarios libres de estrés financiero</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Ordena tus gastos, <br />
              tranquiliza tu mente.
            </h2>

            <p className="mt-4 text-base text-zinc-400 max-w-lg">
              Empieza en menos de 1 minuto sin necesidad de tarjeta de crédito. Descubre la paz de tener el control total de tu dinero.
            </p>

            {/* Email Capture or CTA Action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-sm transition-all shadow-md"
              >
                <span>Empezar Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Prueba gratuita de 14 días
              </span>
              <span>•</span>
              <span>Sin permanencia</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
