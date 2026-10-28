"use client";

import React from "react";

/** Pantallas del dashboard con esqueleto de carga propio. */
export type SkeletonScreen =
  | "home"
  | "movements"
  | "expenses"
  | "incomes"
  | "accounts"
  | "debts"
  | "budget"
  | "reports"
  | "planning"
  | "calculator";

const card = "bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs";
// Clases completas (Tailwind no detecta clases armadas en tiempo de ejecución)
const statCols = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;

const Bone = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-zinc-200/70 ${className}`} />
);

/** Cabecera blanca: título, subtítulo y botón(es) de acción. */
const Header = ({ actions = 1 }: { actions?: number }) => (
  <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
    <div className="space-y-2">
      <Bone className="h-7 w-56" />
      <Bone className="h-3 w-72 max-w-full" />
    </div>
    <div className="flex gap-2">
      {Array.from({ length: actions }, (_, i) => (
        <Bone key={i} className="h-10 w-32 rounded-xl" />
      ))}
    </div>
  </div>
);

const StatCards = ({ count }: { count: 3 | 4 }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 ${statCols[count]} gap-4`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${card} space-y-3`}>
        <div className="flex items-center justify-between">
          <Bone className="h-3 w-24" />
          <Bone className="h-6 w-6 rounded-md" />
        </div>
        <Bone className="h-7 w-32" />
        <Bone className="h-3 w-40" />
      </div>
    ))}
  </div>
);

/** Barra de búsqueda/filtros y filas de un listado. */
const ListCard = ({ rows = 6, filters = 2 }: { rows?: number; filters?: number }) => (
  <div className={`${card} space-y-4`}>
    <div className="flex flex-col sm:flex-row gap-3">
      <Bone className="h-10 flex-1 rounded-xl" />
      {Array.from({ length: filters }, (_, i) => (
        <Bone key={i} className="h-10 sm:w-40 rounded-xl" />
      ))}
    </div>
    <div className="divide-y divide-zinc-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Bone className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3 w-1/3" />
            <Bone className="h-2.5 w-1/2" />
          </div>
          <Bone className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

/** Rejilla de tarjetas (cuentas, deudas, categorías de presupuesto). */
const CardGrid = ({ count, tall = false }: { count: number; tall?: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${card} space-y-3 ${tall ? "min-h-44" : ""}`}>
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3 w-1/2" />
            <Bone className="h-2.5 w-1/3" />
          </div>
        </div>
        <Bone className="h-6 w-28" />
        <Bone className="h-2 w-full rounded-full" />
      </div>
    ))}
  </div>
);

/** Bloque de sección con título y algunas líneas. */
const Section = ({ lines = 3 }: { lines?: number }) => (
  <div className={`${card} space-y-3`}>
    <div className="flex items-center justify-between">
      <Bone className="h-4 w-48" />
      <Bone className="h-8 w-24 rounded-xl" />
    </div>
    {Array.from({ length: lines }, (_, i) => (
      <Bone key={i} className="h-10 w-full rounded-xl" />
    ))}
  </div>
);

function layout(screen: SkeletonScreen) {
  switch (screen) {
    case "home":
      return (
        <>
          <div className="rounded-3xl bg-emerald-700/90 p-6 sm:p-8 space-y-4">
            <div className="flex gap-2">
              <div className="animate-pulse h-5 w-28 rounded-full bg-white/20" />
              <div className="animate-pulse h-5 w-36 rounded-full bg-white/20" />
            </div>
            <div className="animate-pulse h-3 w-24 rounded bg-white/20" />
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="animate-pulse h-10 w-56 rounded-lg bg-white/25" />
              <div className="flex gap-2">
                <div className="animate-pulse h-10 w-36 rounded-xl bg-white/25" />
                <div className="animate-pulse h-10 w-36 rounded-xl bg-white/15" />
              </div>
            </div>
          </div>
          <Section lines={2} />
          <StatCards count={4} />
          <ListCard rows={4} filters={0} />
        </>
      );
    case "movements":
      return (
        <>
          <Header />
          <StatCards count={3} />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
          <ListCard filters={2} />
        </>
      );
    case "expenses":
    case "incomes":
      return (
        <>
          <Header actions={2} />
          <StatCards count={4} />
          <ListCard filters={2} />
        </>
      );
    case "accounts":
      return (
        <>
          <Header />
          <StatCards count={4} />
          <CardGrid count={6} tall />
        </>
      );
    case "debts":
      return (
        <>
          <Header />
          <StatCards count={3} />
          <CardGrid count={3} tall />
        </>
      );
    case "budget":
      return (
        <>
          <Header actions={2} />
          <div className={`${card} space-y-4`}>
            <div className="flex justify-between gap-4">
              <div className="space-y-2">
                <Bone className="h-3 w-48" />
                <Bone className="h-8 w-40" />
              </div>
              <Bone className="h-10 w-28" />
            </div>
            <Bone className="h-3 w-full rounded-full" />
          </div>
          <CardGrid count={6} />
        </>
      );
    case "reports":
      return (
        <>
          <Header actions={2} />
          <div className={`${card} space-y-5`}>
            <div className="flex justify-between gap-4">
              <Bone className="h-8 w-48" />
              <div className="space-y-2">
                <Bone className="h-3 w-48" />
                <Bone className="h-3 w-40" />
              </div>
            </div>
            <Bone className="h-4 w-72 max-w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Bone key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-8 w-full" />
            ))}
          </div>
        </>
      );
    case "planning":
      return (
        <>
          <Header actions={0} />
          <StatCards count={3} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section lines={1} />
            <Section lines={1} />
          </div>
          <Section lines={2} />
          <Section lines={2} />
        </>
      );
    case "calculator":
      return (
        <>
          <Header actions={2} />
          <div className={`${card} space-y-2`}>
            <Bone className="h-3 w-32" />
            <Bone className="h-10 w-64 max-w-full rounded-xl" />
          </div>
          <Section lines={1} />
          <Section lines={3} />
        </>
      );
  }
}

/** Esqueleto de carga con la forma de cada pantalla, mientras llegan sus datos. */
export default function ScreenSkeleton({ screen }: { screen: SkeletonScreen }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      {layout(screen)}
    </div>
  );
}
