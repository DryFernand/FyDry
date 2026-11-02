"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ArrowLeftRight,
  ShieldAlert,
  Target,
  Home,
  FileText,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { DashboardTab } from "@/components/dashboard/types";
import { fetchAccountsApi } from "@/lib/api";
import CamilaFace, { CamilaExpression } from "./CamilaFace";
import { CAMILA_STEP_ENVELOPES } from "./camilaAudioData";

export interface CamilaGuidedTourProps {
  isOpen: boolean;
  activeTab: DashboardTab;
  onNavigateTab: (tab: DashboardTab) => void;
  onClose: () => void;
  userName?: string;
}

interface TourStepConfig {
  stepNumber: number;
  tab: DashboardTab;
  expression: CamilaExpression;
  badge: string;
  title: string;
  whatAndWhy: string;
  howToDoIt: string;
  audioUrl: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    stepNumber: 1,
    tab: "accounts",
    expression: "listening",
    badge: "Paso 1 de 8 · Base del Sistema",
    title: "Primero lo primero: Tus Cuentas",
    whatAndWhy:
      "Hola, soy Camila. Empezamos aquí porque Tus Cuentas son la base de todo en FyDry: cada ingreso, gasto o transferencia necesita saber de qué cuenta sale o a qué cuenta entra el dinero.",
    howToDoIt:
      "Haz clic en el botón «+ Añadir Cuenta» arriba a la derecha, escribe el nombre (por ejemplo Banreservas, Efectivo o Tarjeta Visa), elige el tipo, la moneda (RD$ o US$) y coloca tu saldo inicial.",
    audioUrl: "/audio/camila/step-1.wav",
    icon: CreditCard,
  },
  {
    stepNumber: 2,
    tab: "incomes",
    expression: "happy",
    badge: "Paso 2 de 8 · Entradas de Dinero",
    title: "Registrar tus Ingresos",
    whatAndWhy:
      "Con tu cuenta ya creada, aquí anotas todas tus entradas de dinero como salario, honorarios, ventas o cobros para que el saldo de tu cuenta suba automáticamente.",
    howToDoIt:
      "Toca «+ Registrar Ingreso», coloca el monto, elige la categoría y selecciona a cuál de tus cuentas entra el dinero. También puedes activarlo como recurrente si lo cobras cada mes o quincena.",
    audioUrl: "/audio/camila/step-2.wav",
    icon: ArrowUpRight,
  },
  {
    stepNumber: 3,
    tab: "expenses",
    expression: "thinking",
    badge: "Paso 3 de 8 · Salidas y Compras",
    title: "Anotar tus Gastos",
    whatAndWhy:
      "Cada compra, factura o pago se registra aquí. Si pagas con banco o efectivo, se descuenta de tu saldo disponible; si pagas con tarjeta de crédito, se suma al saldo consumido de esa tarjeta.",
    howToDoIt:
      "Toca «+ Registrar Gasto», indica el monto, la categoría (ej. Supermercado o Transporte) y con qué cuenta pagaste. Si es un pago fijo mensual, márcalo como recurrente.",
    audioUrl: "/audio/camila/step-3.wav",
    icon: ArrowDownRight,
  },
  {
    stepNumber: 4,
    tab: "budget",
    expression: "asking",
    badge: "Paso 4 de 8 · Límites Saludables",
    title: "Tope saludable: Presupuesto",
    whatAndWhy:
      "Aquí defines cuánto quieres permitirte gastar como máximo en cada categoría (mensual, quincenal o semanal). Los gastos que registres en el Paso 3 alimentan estas barras automáticamente.",
    howToDoIt:
      "Pulsa «+ Nuevo Presupuesto», selecciona la categoría que quieres cuidar, escribe tu monto límite y define el porcentaje de alerta (por ejemplo 80%) para que te avisemos antes de pasarte.",
    audioUrl: "/audio/camila/step-4.wav",
    icon: PieChart,
  },
  {
    stepNumber: 5,
    tab: "movements",
    expression: "neutral",
    badge: "Paso 5 de 8 · Entre tus Cuentas",
    title: "Movimientos y Traspasos",
    whatAndWhy:
      "Cuando pasas dinero de una cuenta tuya a otra (por ejemplo, retirar del banco a efectivo o pasar dinero a ahorros) no es un gasto: es un traspaso entre tus propias cuentas.",
    howToDoIt:
      "Usa «Transferir entre cuentas» o «Transferir a ahorros», elige tu cuenta origen y tu cuenta destino, y FyDry moverá el saldo calculando incluso el impuesto DGII (0.15%) si aplica.",
    audioUrl: "/audio/camila/step-5.wav",
    icon: ArrowLeftRight,
  },
  {
    stepNumber: 6,
    tab: "debts",
    expression: "thinking",
    badge: "Paso 6 de 8 · Compromisos y Cuotas",
    title: "Control de Deudas",
    whatAndWhy:
      "Aquí llevas el control de préstamos, financiamientos o dinero pendiente por pagar. FyDry los ordena con estrategias Bola de Nieve o Avalancha para ayudarte a salir de deudas más rápido.",
    howToDoIt:
      "Registra tus compromisos con «+ Nueva Deuda». Cada vez que pagues una cuota, toca el botón «Abonar» en esa deuda e indica de qué cuenta sale el pago.",
    audioUrl: "/audio/camila/step-6.wav",
    icon: ShieldAlert,
  },
  {
    stepNumber: 7,
    tab: "planning",
    expression: "happy",
    badge: "Paso 7 de 8 · Inteligencia Diaria",
    title: "Plan, Disponible Hoy y Metas",
    whatAndWhy:
      "Esta pantalla calcula cuánto puedes gastar hoy sin descuadrar tu mes (Disponible hoy), mide tu Puntaje de Paz Mental, detecta gastos hormiga y organiza tus Metas de Ahorro.",
    howToDoIt:
      "Revisa tu indicador diario arriba, configura pagos fijos automáticos y crea tus objetivos en «Metas de Ahorro» para abonarles dinero directamente desde tus cuentas.",
    audioUrl: "/audio/camila/step-7.wav",
    icon: Target,
  },
  {
    stepNumber: 8,
    tab: "home",
    expression: "happy",
    badge: "Paso 8 de 8 · Visión Completa",
    title: "Inicio, Reportes y Chat con Camila",
    whatAndWhy:
      "En Inicio ves tu patrimonio neto y flujo de caja en tiempo real; en Reportes descargas tus estados en PDF o CSV; y en el botón flotante abajo a la derecha puedes hablar conmigo cuando quieras.",
    howToDoIt:
      "Escríbeme frases naturales como «Gasté 1,200 en supermercado con Banreservas» y yo prepararé el registro por ti. ¡Tu espacio financiero ya está listo!",
    audioUrl: "/audio/camila/step-8.wav",
    icon: Home,
  },
];

export default function CamilaGuidedTour({
  isOpen,
  activeTab,
  onNavigateTab,
  onClose,
  userName,
}: CamilaGuidedTourProps) {
  // Inicia directamente en el Paso 1 (índice 0 = Cuentas) sin pantalla previa de espera
  const [stepIdx, setStepIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthLevel, setMouthLevel] = useState<number | undefined>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [accountsCount, setAccountsCount] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentStep = TOUR_STEPS[stepIdx] || TOUR_STEPS[0];

  const stopAudio = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      } catch {}
      audioRef.current = null;
    }
    if (preloadAudioRef.current) {
      try {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.src = "";
      } catch {}
      preloadAudioRef.current = null;
    }
    setIsSpeaking(false);
    setMouthLevel(0);
  }, []);

  const playStepAudio = useCallback(
    (step: TourStepConfig, enabled: boolean) => {
      stopAudio();
      if (!enabled || typeof window === "undefined") {
        return;
      }

      const envelope = CAMILA_STEP_ENVELOPES[step.stepNumber] || [];
      const audio = new Audio(step.audioUrl);
      audio.preload = "auto";
      audioRef.current = audio;

      // Precargar el siguiente paso en segundo plano para transición instantánea
      const nextStep = TOUR_STEPS.find((s) => s.stepNumber === step.stepNumber + 1);
      if (nextStep) {
        const pre = new Audio(nextStep.audioUrl);
        pre.preload = "auto";
        preloadAudioRef.current = pre;
      }

      const syncMouth = () => {
        const a = audioRef.current;
        if (!a || a.paused || a.ended) {
          setMouthLevel(0);
          return;
        }
        const frameIdx = Math.floor(a.currentTime * 50);
        const level = envelope[frameIdx] ?? 0;
        setMouthLevel(level);
        rafRef.current = requestAnimationFrame(syncMouth);
      };

      audio.onplay = () => {
        setAutoplayBlocked(false);
        setIsSpeaking(true);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(syncMouth);
      };

      audio.onended = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setIsSpeaking(false);
        setMouthLevel(0);
      };

      audio.onerror = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setIsSpeaking(false);
        setMouthLevel(0);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si el navegador bloquea el autoplay antes del primer gesto, desbloquear en el primer clic
          setAutoplayBlocked(true);
          setIsSpeaking(false);
          setMouthLevel(0);
        });
      }
    },
    [stopAudio]
  );

  // Desbloqueo automático de audio al primer clic en cualquier parte si el navegador bloqueó autoplay
  useEffect(() => {
    if (!isOpen || !autoplayBlocked || !voiceEnabled) return;
    const unlock = () => {
      setAutoplayBlocked(false);
      playStepAudio(currentStep, true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [isOpen, autoplayBlocked, voiceEnabled, currentStep, playStepAudio]);

  // Sincronizar conteo de cuentas en tiempo real
  const refreshAccountsCount = useCallback(async () => {
    try {
      const list = await fetchAccountsApi();
      if (Array.isArray(list)) {
        setAccountsCount(list.length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      return;
    }
    refreshAccountsCount();
    const onStorageUpdate = () => {
      refreshAccountsCount();
    };
    window.addEventListener("fydry_storage_updated", onStorageUpdate);
    window.addEventListener("fydry_refresh_data", onStorageUpdate);
    return () => {
      window.removeEventListener("fydry_storage_updated", onStorageUpdate);
      window.removeEventListener("fydry_refresh_data", onStorageUpdate);
    };
  }, [isOpen, refreshAccountsCount, stopAudio]);

  // Al abrir el tour, comenzar inmediatamente en el Paso 1 (índice 0)
  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
      setIsMinimized(false);
    } else {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

  // Navegar a la pestaña del paso y reproducir la voz neuronal de Camila
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[stepIdx];
    if (!step) return;
    if (activeTab !== step.tab) {
      onNavigateTab(step.tab);
    }
    playStepAudio(step, voiceEnabled);
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stepIdx]);

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next) {
      stopAudio();
    } else {
      playStepAudio(currentStep, true);
    }
  };

  const handleRepeat = () => {
    playStepAudio(currentStep, voiceEnabled);
  };

  const handleNext = () => {
    if (stepIdx < TOUR_STEPS.length - 1) {
      setStepIdx((prev) => prev + 1);
    } else {
      stopAudio();
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) {
      setStepIdx((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    stopAudio();
    onClose();
  };

  if (!isOpen) return null;

  const firstName = userName ? userName.trim().split(/\s+/)[0] : "";
  const effectiveExpression: CamilaExpression =
    currentStep.stepNumber === 1 && accountsCount > 0 ? "happy" : currentStep.expression;
  const StepIcon = currentStep.icon;

  return (
    <motion.div
      key="camila-floating-tour"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      role="region"
      aria-label={`Guía de Camila: ${currentStep.title}`}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] bg-white rounded-3xl border border-zinc-200/90 shadow-2xl shadow-zinc-950/25 overflow-hidden print:hidden"
    >
      {/* Cabecera con el rostro vivo de Camila sincronizado a 50Hz con su voz neuronal */}
      <div className="bg-[#080A0E] px-4 py-3 flex items-center justify-between gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-16 h-13 rounded-2xl overflow-hidden border border-cyan-400/25 shrink-0 bg-[#080A0E]">
            <CamilaFace
              expression={effectiveExpression}
              speaking={isSpeaking}
              mouthLevel={mouthLevel}
              interactiveGaze={true}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 truncate">
                {currentStep.badge}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate">
              {currentStep.stepNumber === 1 && firstName
                ? `¡Hola, ${firstName}! ${currentStep.title}`
                : currentStep.title}
            </h3>
          </div>
        </div>

        {/* Controles de voz, minimizar y cerrar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleVoice}
            title={voiceEnabled ? "Silenciar voz" : "Activar voz"}
            aria-label={voiceEnabled ? "Silenciar voz" : "Activar voz"}
            className="p-1.5 rounded-lg bg-zinc-900 text-cyan-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          <button
            type="button"
            onClick={handleRepeat}
            title="Repetir explicación"
            aria-label="Repetir explicación"
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            title={isMinimized ? "Expandir guía" : "Minimizar guía"}
            aria-label={isMinimized ? "Expandir guía" : "Minimizar guía"}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            title="Saltar y cerrar guía"
            aria-label="Saltar y cerrar guía"
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 w-full bg-zinc-100">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${((stepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
        />
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3">
          {/* Qué se hace aquí */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-900 flex items-center gap-1.5">
              <StepIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>¿Qué se hace en esta pantalla?</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {currentStep.whatAndWhy}
            </p>
          </div>

          {/* Cómo se hace */}
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1">
            <div className="text-[11px] font-bold text-emerald-800">
              ¿Cómo hacerlo paso a paso?
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {currentStep.howToDoIt}
            </p>
          </div>

          {/* Feedback en vivo en el Paso 1 si el usuario ya creó una cuenta */}
          {currentStep.stepNumber === 1 && (
            <div
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                accountsCount > 0
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50/80 text-amber-800 border border-amber-200/80"
              }`}
            >
              {accountsCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ✓ ¡Excelente! Ya tienes {accountsCount} cuenta(s) lista(s).
                </span>
              ) : (
                <span>
                  Puedes tocar «+ Añadir Cuenta» en la pantalla de atrás para crear tu primera cuenta ahora.
                </span>
              )}
            </div>
          )}

          {/* En el paso 8, botón rápido para ver Reportes también */}
          {currentStep.stepNumber === 8 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab("reports")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ver pantalla de Reportes</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("home")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ver Inicio</span>
              </button>
            </div>
          )}

          {/* Selector rápido de pasos (1..8) */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {TOUR_STEPS.map((s, idx) => {
              const active = stepIdx === idx;
              const done = stepIdx > idx;
              return (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => setStepIdx(idx)}
                  title={`Ir al Paso ${s.stepNumber}: ${s.title}`}
                  className={`flex-1 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : done
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200/70"
                  }`}
                >
                  {s.stepNumber}
                </button>
              );
            })}
          </div>

          {/* Botonera Inferior: Anterior / Saltar / Siguiente */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIdx === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="px-2.5 py-2 rounded-xl text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              Saltar guía
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>
                {stepIdx === TOUR_STEPS.length - 1 ? "Finalizar recorrido" : "Siguiente paso"}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
