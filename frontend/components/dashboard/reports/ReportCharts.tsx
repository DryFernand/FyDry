"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatMoney } from "@/lib/money";

// Paleta de referencia validada (slots 1 y 2: par adyacente con separación CVD suficiente)
const INCOME_COLOR = "#2a78d6";
const EXPENSE_COLOR = "#eb6834";
const BAR_COLOR = "#2a78d6";

/** 60000 -> "60K", 1500000 -> "1.5M" (etiquetas de eje). */
const compact = (v: number) =>
  v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : `${Math.round(v)}`;

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

/** Ingresos vs gastos por periodo: barras agrupadas, un solo eje, tooltip al pasar el cursor o tocar. */
export function TrendChart({ data, currency, language }: { data: TrendPoint[]; currency: string; language: "es" | "en" }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 28, left: 8 };
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const plotH = H - pad.top - pad.bottom;
  const groupW = (W - pad.left - pad.right) / data.length;
  const barW = Math.min(28, groupW * 0.32);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const es = language === "es";
  const gridValues = [0.5, 1].map((f) => max * f);

  /** Barra con extremo superior redondeado (4px) y base recta sobre el eje. */
  const bar = (x: number, v: number, color: string) => {
    const top = y(v);
    const h = pad.top + plotH - top;
    if (h <= 0) return null;
    const r = Math.min(4, h, barW / 2);
    const bottom = pad.top + plotH;
    return (
      <path
        d={`M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${bottom} Z`}
        fill={color}
      />
    );
  };

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] text-zinc-600" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />{es ? "Ingresos" : "Income"}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />{es ? "Gastos" : "Expenses"}</span>
      </div>
      <div className="relative max-w-3xl">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={es ? "Ingresos y gastos de los últimos periodos" : "Income and expenses over recent periods"}>
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#e4e4e7" strokeDasharray="3 4" />
              <text x={pad.left} y={y(v) - 4} fontSize="10" fill="#a1a1aa">{compact(v)}</text>
            </g>
          ))}
          <line x1={pad.left} x2={W - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} stroke="#d4d4d8" />
          {data.map((d, i) => {
            const gx = pad.left + i * groupW;
            const x1 = gx + groupW / 2 - barW - 1;
            const x2 = gx + groupW / 2 + 1;
            return (
              <g key={d.label}>
                {hover === i && <rect x={gx + 2} y={pad.top} width={groupW - 4} height={plotH} rx={6} fill="#f4f4f5" />}
                {bar(x1, d.income, INCOME_COLOR)}
                {bar(x2, d.expense, EXPENSE_COLOR)}
                <text x={gx + groupW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#71717a">{d.label}</text>
                {/* zona de contacto más grande que las barras */}
                <rect
                  x={gx}
                  y={0}
                  width={groupW}
                  height={H}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
        {active && hover !== null && (
          <div
            className="absolute top-0 pointer-events-none rounded-xl bg-emerald-700 text-white text-[11px] px-3 py-2 shadow-lg space-y-0.5 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <div className="font-semibold">{active.label}</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: INCOME_COLOR }} />{es ? "Ingresos" : "Income"}: {formatMoney(active.income, currency)}</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: EXPENSE_COLOR }} />{es ? "Gastos" : "Expenses"}: {formatMoney(active.expense, currency)}</div>
            <div className="text-zinc-400">{es ? "Neto" : "Net"}: {formatMoney(active.income - active.expense, currency)}</div>
          </div>
        )}
      </div>
      {/* Vista de tabla equivalente para lectores de pantalla */}
      <table className="sr-only">
        <caption>{es ? "Ingresos y gastos por periodo" : "Income and expenses by period"}</caption>
        <thead><tr><th>{es ? "Periodo" : "Period"}</th><th>{es ? "Ingresos" : "Income"}</th><th>{es ? "Gastos" : "Expenses"}</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>{formatMoney(d.income, currency)}</td><td>{formatMoney(d.expense, currency)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ranking de categorías: barras horizontales de un solo color con valor y porcentaje. */
export function CategoryBars({
  items,
  total,
  currency,
  emptyText,
}: {
  items: { category: string; amount: number }[];
  total: number;
  currency: string;
  emptyText: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-xs text-zinc-400">{emptyText}</p>;
  const max = Math.max(...items.map((i) => i.amount));
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
        return (
          <li key={item.category} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-xs" title={`${item.category}: ${formatMoney(item.amount, currency)} (${pct}%)`}>
            <span className="font-medium text-zinc-800 truncate">{item.category}</span>
            <span className="text-zinc-900 font-semibold tabular-nums">
              {formatMoney(item.amount, currency)} <span className="text-zinc-400 font-normal">· {pct}%</span>
            </span>
            <div className="col-span-2 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.amount / max) * 100}%`, background: BAR_COLOR }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Variación contra el periodo anterior. `goodWhenUp` indica si subir es bueno (ingresos) o malo (gastos).
 * Ícono + texto, nunca solo color.
 */
export function DeltaBadge({ current, previous, goodWhenUp, language }: { current: number; previous: number; goodWhenUp: boolean; language: "es" | "en" }) {
  const es = language === "es";
  if (previous <= 0) {
    return <span className="text-[10px] text-zinc-400">{es ? "Sin periodo anterior para comparar" : "No previous period"}</span>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
        <Minus className="w-3 h-3" aria-hidden="true" /> {es ? "Igual que el periodo anterior" : "Same as previous"}
      </span>
    );
  }
  const up = change > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${good ? "text-green-700" : "text-rose-700"}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {up ? "+" : ""}
      {change}% {es ? "vs. periodo anterior" : "vs. previous period"}
    </span>
  );
}
