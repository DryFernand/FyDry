"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Wallet, HeartPulse, Coffee, Repeat, CreditCard, Building2, Bot, Check, Target, ArrowUp } from "lucide-react";
import { CountUp } from "./primitives";

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
});

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[9px] font-semibold text-zinc-900">
      <span>9:41</span>
      <span className="flex gap-1 items-center" aria-hidden="true">
        <span className="w-3 h-1.5 rounded-sm bg-zinc-900" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
      </span>
    </div>
  );
}

function TabBar({ active }: { active: number }) {
  const tabs = [Wallet, CreditCard, Target, Bot];
  return (
    <div className="mt-auto mx-3 mb-3 flex items-center justify-around rounded-2xl bg-white border border-zinc-200 py-2.5 shadow-sm">
      {tabs.map((Icon, i) => (
        <span key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center ${i === active ? "bg-zinc-950 text-emerald-400" : "text-zinc-400"}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Pantalla "Plan y Metas": disponible hoy, puntaje y gastos hormiga. */
export function PlanScreen() {
  return (
    <div className="h-full flex flex-col text-zinc-900">
      <StatusBar />
      <div className="px-4 pt-4 space-y-2.5">
        <motion.div {...reveal(0)} className="text-[11px] font-bold">Plan y Metas</motion.div>

        <motion.div {...reveal(1)} className="rounded-2xl bg-zinc-950 text-white p-3.5">
          <div className="flex items-center justify-between text-[9px] text-zinc-400">
            <span>Disponible hoy</span>
            <Wallet className="w-3 h-3" aria-hidden="true" />
          </div>
          <div className="text-xl font-extrabold mt-0.5">
            <CountUp value={1250} prefix="RD$ " />
          </div>
          <div className="text-[8px] text-emerald-400 mt-0.5">RD$ 22,500 para 18 días</div>
        </motion.div>

        <motion.div {...reveal(2)} className="rounded-2xl bg-white border border-zinc-200 p-3">
          <div className="flex items-center justify-between text-[9px] text-zinc-500">
            <span>Puntaje Paz Mental</span>
            <HeartPulse className="w-3 h-3" aria-hidden="true" />
          </div>
          <div className="text-base font-bold mt-0.5"><CountUp value={82} suffix="/100" /></div>
          <div className="h-1.5 rounded-full bg-zinc-100 mt-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "82%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        <motion.div {...reveal(3)} className="rounded-2xl bg-white border border-zinc-200 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] text-zinc-500">
            <span>Gastos hormiga · 30 días</span>
            <Coffee className="w-3 h-3" aria-hidden="true" />
          </div>
          {[
            ["Café", "×12", "2,160"],
            ["Colmado", "×8", "1,440"],
            ["Uber", "×5", "1,250"],
          ].map(([name, n, amt]) => (
            <div key={name} className="flex justify-between text-[9px]">
              <span>{name} <span className="text-zinc-400">{n}</span></span>
              <span className="font-semibold">RD$ {amt}</span>
            </div>
          ))}
        </motion.div>

        <motion.div {...reveal(4)} className="rounded-2xl bg-white border border-zinc-200 p-3">
          <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
            <span>Fondo de emergencia</span>
            <Target className="w-3 h-3" aria-hidden="true" />
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <motion.div
              className="h-full bg-zinc-900 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "64%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="text-[8px] text-zinc-400 mt-1">RD$ 64,000 / 100,000</div>
        </motion.div>
      </div>
      <TabBar active={2} />
    </div>
  );
}

const CHAT_TEXT = "Cena con amigos 1,500 con la Visa";

/** Pantalla del asistente IA: escribe el mensaje y muestra la confirmación. */
export function ChatScreen() {
  const [typed, setTyped] = useState(0);
  const done = typed >= CHAT_TEXT.length;

  useEffect(() => {
    if (done) {
      const restart = setTimeout(() => setTyped(0), 4500);
      return () => clearTimeout(restart);
    }
    const t = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 700 : 55);
    return () => clearTimeout(t);
  }, [typed, done]);

  return (
    <div className="h-full flex flex-col text-zinc-900">
      <StatusBar />
      <div className="px-4 pt-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center">
          <Bot className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div>
          <div className="text-[11px] font-bold">Asistente FyDry</div>
          <div className="text-[8px] text-emerald-600">En línea</div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 space-y-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-zinc-200 px-3 py-2 text-[9px] text-zinc-600">
          ¿Qué registramos hoy?
        </div>
        {typed > 0 && (
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-950 text-white px-3 py-2 text-[9px]">
            {CHAT_TEXT.slice(0, typed)}
            {!done && <span className="inline-block w-[1px] h-2.5 bg-white ml-0.5 animate-pulse align-middle" />}
          </div>
        )}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white border border-zinc-200 p-3 space-y-1.5"
          >
            <div className="text-[9px] font-semibold">Confirma el gasto</div>
            <div className="grid grid-cols-2 gap-1 text-[8px]">
              <span className="text-zinc-400">Monto</span><span className="font-semibold">RD$ 1,500</span>
              <span className="text-zinc-400">Cuenta</span><span className="font-semibold">Visa</span>
              <span className="text-zinc-400">Categoría</span><span className="font-semibold">Restaurantes</span>
            </div>
            <div className="flex gap-1.5 pt-1">
              <span className="flex-1 text-center rounded-lg bg-zinc-950 text-white text-[8px] py-1.5 inline-flex items-center justify-center gap-1">
                <Check className="w-2.5 h-2.5" aria-hidden="true" /> Confirmar
              </span>
              <span className="flex-1 text-center rounded-lg border border-zinc-200 text-[8px] py-1.5">Editar</span>
            </div>
          </motion.div>
        )}
      </div>
      <div className="m-3 flex items-center gap-2 rounded-2xl bg-white border border-zinc-200 pl-3 pr-1.5 py-1.5 shadow-sm">
        <span className="flex-1 text-[9px] text-zinc-400">Escribe un gasto o pregunta…</span>
        <span className="w-7 h-7 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
          <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/** Pantalla de cuentas: pesos, dólares y tarjeta con consumo. */
export function AccountsScreen() {
  return (
    <div className="h-full flex flex-col text-zinc-900">
      <StatusBar />
      <div className="px-4 pt-4 space-y-2.5">
        <motion.div {...reveal(0)} className="text-[11px] font-bold">Mis cuentas</motion.div>
        <motion.div {...reveal(1)} className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white p-3.5">
          <div className="text-[9px] text-zinc-300">Balance total</div>
          <div className="text-lg font-extrabold"><CountUp value={48500} prefix="RD$ " /></div>
          <div className="text-[9px] text-zinc-300">US$ 320.00</div>
        </motion.div>
        {[
          { icon: Building2, name: "Banco Popular", type: "Cuenta corriente", amt: "RD$ 41,200" },
          { icon: Wallet, name: "Efectivo", type: "Billetera", amt: "RD$ 3,800" },
          { icon: Repeat, name: "Ahorros USD", type: "Ahorro", amt: "US$ 320" },
        ].map((a, i) => (
          <motion.div key={a.name} {...reveal(i + 2)} className="flex items-center gap-2.5 rounded-xl bg-white border border-zinc-200 p-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <a.icon className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-semibold">{a.name}</div>
              <div className="text-[8px] text-zinc-400">{a.type}</div>
            </div>
            <div className="text-[9px] font-bold">{a.amt}</div>
          </motion.div>
        ))}
        <motion.div {...reveal(5)} className="rounded-xl bg-white border border-zinc-200 p-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[9px] font-semibold flex-1">Visa ···· 4821</span>
            <span className="text-[8px] text-amber-700 bg-amber-50 rounded px-1">Corte en 2 días</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "38%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.7 }}
            />
          </div>
          <div className="text-[8px] text-zinc-400">Consumido RD$ 19,000 / 50,000</div>
        </motion.div>
      </div>
      <TabBar active={1} />
    </div>
  );
}
