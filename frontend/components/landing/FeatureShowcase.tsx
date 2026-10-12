"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wallet, Bot, CreditCard, Check } from "lucide-react";
import { PhoneFrame } from "./primitives";
import { PlanScreen, ChatScreen, AccountsScreen } from "./AppScreens";

const steps = [
  {
    icon: Wallet,
    kicker: "Plan y Metas",
    title: "Sabe cuánto puedes gastar hoy",
    text: "FyDry toma tu saldo, descuenta los gastos fijos que faltan y lo que quieres ahorrar, y te dice un número para hoy. Sin fórmulas.",
    bullets: ["Puntaje Paz Mental de 0 a 100", "Gastos hormiga de los últimos 30 días", "Metas de ahorro con fecha"],
    Screen: PlanScreen,
  },
  {
    icon: Bot,
    kicker: "Asistente IA",
    title: "Registra conversando",
    text: "Escribe lo que pasó como se lo dirías a un amigo. El asistente arma el gasto con monto, cuenta y categoría, y tú confirmas.",
    bullets: ["Te pregunta lo que falte", "Nada se guarda sin tu confirmación", "Gastos, ingresos, traspasos y deudas"],
    Screen: ChatScreen,
  },
  {
    icon: CreditCard,
    kicker: "Cuentas y tarjetas",
    title: "Pesos, dólares y tarjetas en un lugar",
    text: "Cada cuenta en su moneda, tarjetas con su consumo y límite, y alertas antes del corte y del pago para no pagar intereses.",
    bullets: ["RD$ y US$ sin mezclar totales", "Alertas de corte, pago y sobregiro", "Traspasos con impuesto incluido"],
    Screen: AccountsScreen,
  },
];

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const ActiveScreen = steps[active].Screen;

  return (
    <section id="como-funciona" className="relative py-20 md:py-28 bg-white border-b border-zinc-200/80 overflow-x-clip">
      <div className="absolute -left-40 top-1/3 w-[28rem] h-[28rem] rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-4">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900"
          >
            Así se ve tu dinero en FyDry
          </motion.h2>
          <p className="mt-4 text-base text-zinc-600">Tres pantallas que cambian cómo decides cada día.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Pasos (en móvil cada uno lleva su teléfono) */}
          <div>
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.6 }}
                className="md:min-h-[80vh] flex flex-col justify-center py-8"
              >
                <motion.div
                  animate={{ opacity: active === i ? 1 : 0.35 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 max-md:!opacity-100"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold">
                    <step.icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {step.kicker}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">{step.title}</h3>
                  <p className="text-base text-zinc-600 leading-relaxed">{step.text}</p>
                  <ul className="space-y-2">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-zinc-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" aria-hidden="true" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <div className="md:hidden mt-8 flex justify-center">
                  <PhoneFrame>
                    <step.Screen />
                  </PhoneFrame>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Teléfono fijo en escritorio */}
          <div className="hidden md:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-tr from-emerald-200/50 via-white to-zinc-200/60 blur-2xl" aria-hidden="true" />
                <PhoneFrame className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 24, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full"
                    >
                      <ActiveScreen />
                    </motion.div>
                  </AnimatePresence>
                </PhoneFrame>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2" aria-hidden="true">
                  {steps.map((s, i) => (
                    <span key={s.title} className={`w-1.5 rounded-full transition-all duration-300 ${active === i ? "h-8 bg-zinc-900" : "h-1.5 bg-zinc-300"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
