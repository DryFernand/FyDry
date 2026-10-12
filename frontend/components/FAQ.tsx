"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "¿Qué diferencia a FyDry de otras aplicaciones de finanzas?",
    answer:
      "La mayoría de apps financieras son complejas, están repletas de publicidad o te abruman con decenas de gráficos innecesarios. FyDry fue creada bajo una filosofía minimalista: darte una visión clara de tus finanzas en pesos y dólares, decirte cuánto puedes gastar hoy y avisarte antes de que una tarjeta o un presupuesto se salga de control.",
  },
  {
    question: "¿Están seguros mis datos financieros?",
    answer:
      "Tus datos viajan cifrados (HTTPS/TLS), tu contraseña se guarda con hash bcrypt y cada consulta está aislada a tu usuario. No pedimos claves de tu banco y no vendemos tus datos a terceros.",
  },
  {
    question: "¿Cómo funciona el asistente con inteligencia artificial?",
    answer:
      "Escríbele en el chat lo que hiciste (ejemplo: 'Cena con amigos 1,500 con la Visa'). El asistente identifica monto, cuenta y categoría, te pide lo que falte y prepara el registro para que lo confirmes antes de guardarlo.",
  },
  {
    question: "¿Puedo exportar mi información si decido cambiar de herramienta?",
    answer:
      "Sí, tus datos te pertenecen. Desde Reportes puedes exportar tus transacciones a CSV (se abre en Excel) o imprimir el reporte en PDF.",
  },
  {
    question: "¿Qué es el 'Modo Paz Mental'?",
    answer:
      "Es la vista Plan y Metas: toma el dinero de tus cuentas (sin tarjetas ni ahorros), le resta los gastos fijos que faltan este periodo y el aporte a tus metas, y lo divide entre los días que quedan. Así sabes cuánto puedes gastar hoy. Además te da un puntaje de 0 a 100.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Todo lo que FyDry hace hoy es gratis y sin tarjeta. Habrá un plan Pro con funciones extra (como leer los correos de tu banco), pero lo que hoy es gratis seguirá siéndolo.",
  },
  {
    question: "¿Se conecta automáticamente con mi banco?",
    answer:
      "Todavía no. Registras tus movimientos en segundos con el formulario rápido o pidiéndoselo al asistente, y tus gastos fijos se registran solos con los recurrentes. La lectura automática de correos bancarios está en camino.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-b border-zinc-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold mb-3"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Respuestas claras</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900"
          >
            Preguntas Frecuentes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-base text-zinc-600"
          >
            Todo lo que necesitas saber antes de empezar a ordenar tus finanzas con FyDry.
          </motion.p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs transition-colors hover:border-zinc-300"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-medium text-sm text-zinc-900"
                >
                  <span>{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-400 shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-4 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
