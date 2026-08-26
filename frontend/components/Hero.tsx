"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  PieChart,
  Wallet,
  Sparkles,
  CheckCircle2,
  BellRing,
  HeartHandshake,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function Hero() {
  const [activeTab, setActiveTab] = useState<"mensual" | "categorias" | "ahorro">("mensual");

  return (
    <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden border-b border-zinc-200/60 bg-gradient-to-b from-zinc-50/50 via-white to-white">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* ======================================================== */}
      {/* FLOATING ANIMATED CARDS (DESKTOP / TABLET)               */}
      {/* ======================================================== */}
      
      {/* Floating Card 1: Gasto Hormiga Detectado (Top Left) */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: -10 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -12, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.2 },
          x: { duration: 0.8, delay: 0.2 },
          y: {
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
          },
        }}
        className="hidden lg:flex items-center gap-3 absolute top-24 left-8 xl:left-16 z-20 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/5"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-zinc-900 flex items-center gap-1">
            <span>Gasto hormiga detectado</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
            <span className="font-bold text-zinc-900">-$24.50</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.2 rounded">
              Evitado
            </span>
          </div>
        </div>
      </motion.div>

      {/* Floating Card 2: Índice de Paz Mental (Top Right) */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 10 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, 14, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.3 },
          x: { duration: 0.8, delay: 0.3 },
          y: {
            repeat: Infinity,
            duration: 5.5,
            ease: "easeInOut",
          },
        }}
        className="hidden lg:flex items-center gap-3 absolute top-28 right-8 xl:right-16 z-20 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/5"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-zinc-900 flex items-center gap-1">
            <span>Paz Mental</span>
            <span className="text-[10px] text-emerald-600 font-bold">98.4%</span>
          </div>
          <div className="text-[11px] text-zinc-500">Cero estrés financiero</div>
        </div>
      </motion.div>

      {/* Floating Card 3: Auto-categorización IA (Mid-Right Floating Badge) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -10, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.4 },
          y: {
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
          },
        }}
        className="hidden xl:flex items-center gap-2.5 absolute bottom-44 right-10 z-20 py-2.5 px-4 rounded-xl bg-zinc-900 text-white shadow-xl text-xs"
      >
        <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "8s" }} />
        <span>Categorizado con IA en 0.2s</span>
      </motion.div>

      {/* Floating Card 4: Ahorro Promedio Mensual (Mid-Left Floating Badge) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, 10, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.5 },
          y: {
            repeat: Infinity,
            duration: 6.5,
            ease: "easeInOut",
          },
        }}
        className="hidden xl:flex items-center gap-2.5 absolute bottom-36 left-12 z-20 py-2.5 px-4 rounded-xl bg-white border border-zinc-200 shadow-lg text-xs font-semibold text-zinc-800"
      >
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        <span>+$380 Ahorro promedio/mes</span>
      </motion.div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Centered Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.1]"
          >
            Ordena tus gastos, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
              tranquiliza tu mente.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl font-normal leading-relaxed"
          >
            Una experiencia minimalista e intuitiva para registrar, categorizar y optimizar tus finanzas personales sin estrés ni hojas de cálculo complicadas.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
          >
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all"
            >
              <span>Comenzar gratis hoy</span>
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#simulador"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-sm border border-zinc-200 shadow-sm transition-all"
            >
              <span>Explorar simulador</span>
            </motion.a>
          </motion.div>

          {/* Quick Value Props */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cifrado de grado bancario</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Exportación instantánea</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive Dashboard Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 sm:mt-18 relative rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/5 overflow-hidden"
        >
          {/* Mockup Window Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 pb-3 mb-4 px-1 sm:px-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
              </div>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-400 truncate">app.fydry.io/dashboard</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab("mensual")}
                className={`px-2.5 py-1 text-[11px] sm:text-xs rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "mensual"
                    ? "bg-zinc-900 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Vista General
              </button>
              <button
                onClick={() => setActiveTab("categorias")}
                className={`px-2.5 py-1 text-[11px] sm:text-xs rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "categorias"
                    ? "bg-zinc-900 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Categorías
              </button>
              <button
                onClick={() => setActiveTab("ahorro")}
                className={`px-2.5 py-1 text-[11px] sm:text-xs rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "ahorro"
                    ? "bg-zinc-900 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Paz Mental 98%
              </button>
            </div>
          </div>

          {/* Interactive Mockup Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Overview Card */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Balance Disponible</span>
                  <Wallet className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 tracking-tight">$3,450.00</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% ahorro este mes</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200/60">
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Presupuesto Consumido</span>
                  <span className="font-semibold text-zinc-800">58%</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-zinc-900 h-2 rounded-full w-[58%]" />
                </div>
              </div>
            </motion.div>

            {/* Categorías Desglosadas */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>Desglose por Categoría</span>
                  <PieChart className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                      Vivienda & Servicios
                    </span>
                    <span className="font-semibold text-zinc-900">$1,200.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                      Alimentación & Super
                    </span>
                    <span className="font-semibold text-zinc-900">$480.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                      Ocio & Suscripciones
                    </span>
                    <span className="font-semibold text-zinc-900">$190.00</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-500">
                <span>Gastos Hormiga Detectados</span>
                <span className="text-amber-600 font-medium">$42.50 / semana</span>
              </div>
            </motion.div>

            {/* Transacciones Recientes */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>Últimos Movimientos</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Sincronizado
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-800">Supermercado Local</div>
                      <div className="text-[10px] text-zinc-400">Hoy, 10:45 AM</div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900">-$64.20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-800">Ingreso Freelance / Proyecto</div>
                      <div className="text-[10px] text-zinc-400">Ayer, 4:12 PM</div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">+$1,400.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-800">Suscripción Música</div>
                      <div className="text-[10px] text-zinc-400">24 Ago, 8:00 AM</div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900">-$9.99</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-zinc-900" />
                  Auto-categorizado
                </span>
                <span className="text-xs font-medium text-zinc-900">100% al día</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
