import { CreditCard, Coins, Bot, BellRing, Target, Repeat, Coffee, FileDown, PieChart, ShieldCheck } from "lucide-react";

const items = [
  { icon: Coins, label: "Pesos y dólares" },
  { icon: CreditCard, label: "Tarjetas con corte y pago" },
  { icon: Bot, label: "Asistente IA" },
  { icon: Coffee, label: "Gastos hormiga" },
  { icon: Repeat, label: "Gastos recurrentes" },
  { icon: Target, label: "Metas de ahorro" },
  { icon: PieChart, label: "Presupuestos" },
  { icon: BellRing, label: "Alertas inteligentes" },
  { icon: FileDown, label: "CSV y PDF" },
  { icon: ShieldCheck, label: "Sin claves de tu banco" },
];

/** Cinta infinita de funciones. Se pausa al pasar el cursor y con "reducir movimiento". */
export default function Marquee() {
  return (
    <section aria-label="Funciones de FyDry" className="relative py-6 bg-zinc-950 overflow-hidden marquee-mask">
      <div className="marquee-track flex w-max gap-3">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-200 text-sm font-medium whitespace-nowrap"
          >
            <item.icon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
