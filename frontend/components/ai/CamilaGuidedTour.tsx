"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Sparkles,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { DashboardTab } from "@/components/dashboard/types";
import { fetchAccountsApi } from "@/lib/api";
import CamilaFace, { CamilaExpression } from "./CamilaFace";

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
  speechText: string;
  actionHint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    stepNumber: 0,
    tab: "home",
    expression: "happy",
    badge: "Bienvenida a FyDry",
    title: "Hola, soy Camila. Construyamos tu orden financiero paso a paso",
    whatAndWhy:
      "Te acompañaré por cada sección de FyDry en el orden exacto en que se construye tu sistema financiero: primero tus Cuentas (donde vive tu dinero), luego tus Ingresos y Gastos (que alimentan o descuentan de esas cuentas), después tu Presupuesto, Movimientos, Deudas, Plan y finalmente tus Reportes.",
    howToDoIt:
      "En cada paso te llevaré a la pantalla real y podrás interactuar con los botones mientras te explico qué se hace y cómo funciona.",
    speechText:
      "Hola, soy Camila, tu asistente de bienestar financiero en FyDry. Vamos a recorrer tu espacio en el orden exacto en que se construye tu sistema financiero: primero crearemos tus Cuentas, luego veremos cómo registrar Ingresos y Gastos sobre esas cuentas, después tu Presupuesto, Movimientos, Deudas, tu Plan diario y finalmente tus Reportes. Toca comenzar recorrido cuando estés listo.",
    actionHint: "Comenzar recorrido paso a paso",
    icon: Sparkles,
  },
  {
    stepNumber: 1,
    tab: "accounts",
    expression: "listening",
    badge: "Paso 1 de 8 · Base del Sistema",
    title: "Primero lo primero: Tus Cuentas",
    whatAndWhy:
      "Aquí registras tus cuentas de Banco, Efectivo, Tarjetas de Crédito o Ahorros. Es obligatorio empezar por aquí porque cada ingreso, gasto o transferencia necesita saber a qué cuenta sumarse o restarse.",
    howToDoIt:
      "Haz clic en el botón «+ Añadir Cuenta» arriba a la derecha, escribe el nombre (por ejemplo Banreservas, Efectivo o Tarjeta Visa), elige el tipo, la moneda (RD$ o US$) y coloca tu saldo actual.",
    speechText:
      "Paso uno: Tus Cuentas. Empezamos aquí porque es la base de todo en FyDry: cada ingreso, gasto o transferencia necesita saber de qué cuenta sale o a qué cuenta entra el dinero. Para crear una ahora mismo, haz clic en el botón Añadir Cuenta arriba a la derecha, escribe el nombre como Banco, Efectivo o Tarjeta, elige la moneda y tu saldo inicial.",
    actionHint: "Botón «+ Añadir Cuenta» arriba a la derecha",
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
    speechText:
      "Paso dos: Registrar tus Ingresos. Con tu cuenta ya lista, aquí anotas tus entradas de dinero como sueldo, honorarios o ventas. Toca el botón Registrar Ingreso, escribe el monto, elige la categoría e indica a cuál de tus cuentas entra el dinero. Si es un ingreso fijo de cada mes o quincena, puedes marcarlo como recurrente.",
    actionHint: "Botón «+ Registrar Ingreso»",
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
    speechText:
      "Paso tres: Anotar tus Gastos. Cada compra o pago del día a día se registra aquí. Toca Registrar Gasto, coloca el monto, elige la categoría y selecciona con cuál de tus cuentas pagaste. Si usas banco o efectivo se resta de tu saldo, y si usas tarjeta de crédito se acumula en lo consumido de esa tarjeta.",
    actionHint: "Botón «+ Registrar Gasto»",
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
    speechText:
      "Paso cuatro: Tu Presupuesto. Aquí defines cuánto quieres permitirte gastar como máximo en cada categoría durante el mes, quincena o semana. Pulsa Nuevo Presupuesto, selecciona la categoría, el monto límite y el porcentaje de alerta. Cada gasto que registres actualizará estas barras automáticamente.",
    actionHint: "Botón «+ Nuevo Presupuesto»",
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
    speechText:
      "Paso cinco: Movimientos y Traspasos. Cuando pasas dinero de una cuenta tuya a otra, como del banco al efectivo o a tus ahorros, no es un gasto sino un traspaso. Usa los botones Transferir entre cuentas o Transferir a ahorros, elige cuenta de origen y destino, y FyDry ajustará ambos saldos al instante.",
    actionHint: "Botones «Transferir entre cuentas» / «Transferir a ahorros»",
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
    speechText:
      "Paso seis: Control de Deudas. Aquí registras préstamos o compromisos pendientes con el botón Nueva Deuda. FyDry te sugiere cómo priorizarlas con los métodos Bola de Nieve o Avalancha, y cuando pagues una cuota solo tocas Abonar indicando de qué cuenta sale el dinero.",
    actionHint: "Botones «+ Nueva Deuda» y «Abonar»",
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
    speechText:
      "Paso siete: Tu Plan y Metas. Aquí FyDry calcula cuánto puedes gastar hoy sin descuadrar tu mes, te muestra tu Puntaje de Paz Mental, detecta gastos hormiga y te permite crear Metas de Ahorro para ir abonándoles paso a paso.",
    actionHint: "Disponible hoy, Paz Mental y Metas de Ahorro",
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
    speechText:
      "Y paso ocho: Inicio, Reportes y nuestro chat. En Inicio tienes el resumen de tu patrimonio y flujo del mes; en Reportes descargas tus estados en PDF o Excel; y en el botón flotante con mi rostro abajo a la derecha puedes hablar conmigo siempre que quieras para registrar gastos, ingresos o resolver dudas. ¡Mucho éxito con tus finanzas!",
    actionHint: "Panel Principal, Reportes y Chat con Camila",
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
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [accountsCount, setAccountsCount] = useState(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = TOUR_STEPS[stepIndex] || TOUR_STEPS[0];

  const stopSpeech = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  const speakStep = useCallback(
    (text: string, enabled: boolean) => {
      stopSpeech();
      const estimatedMs = Math.min(18000, Math.max(4200, text.length * 52));

      if (!enabled) {
        // Incluso con audio en silencio, Camila articula durante unos segundos al cambiar de paso
        setIsSpeaking(true);
        fallbackTimerRef.current = setTimeout(() => {
          setIsSpeaking(false);
        }, Math.min(4500, estimatedMs));
        return;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "es-DO";
          utterance.rate = 1.02;
          utterance.pitch = 1.05;

          const voices = window.speechSynthesis.getVoices();
          const preferredVoice =
            voices.find(
              (v) =>
                v.lang.toLowerCase().startsWith("es") &&
                /helena|sabina|paulina|paloma|elvira|monica|dalia|laura|female|natural|google/i.test(
                  v.name
                )
            ) || voices.find((v) => v.lang.toLowerCase().startsWith("es"));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            if (fallbackTimerRef.current) {
              clearTimeout(fallbackTimerRef.current);
              fallbackTimerRef.current = null;
            }
            setIsSpeaking(false);
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
          };

          setIsSpeaking(true);
          window.speechSynthesis.speak(utterance);

          // Respaldo por si el navegador bloquea autoplay de TTS o no dispara onend
          fallbackTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
          }, estimatedMs);
          return;
        } catch {}
      }

      setIsSpeaking(true);
      fallbackTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, estimatedMs);
    },
    [stopSpeech]
  );

  // Sincronizar conteo de cuentas en tiempo real (especialmente útil en el Paso 1)
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
      stopSpeech();
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
  }, [isOpen, refreshAccountsCount, stopSpeech]);

  // Al abrir el tour, reiniciar al paso 0
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setIsMinimized(false);
    } else {
      stopSpeech();
    }
  }, [isOpen, stopSpeech]);

  // Navegar a la pestaña del paso y hablar
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;
    if (activeTab !== step.tab) {
      onNavigateTab(step.tab);
    }
    speakStep(step.speechText, voiceEnabled);
    return () => {
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stepIndex]);

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next) {
      stopSpeech();
    } else {
      speakStep(currentStep.speechText, true);
    }
  };

  const handleRepeat = () => {
    speakStep(currentStep.speechText, voiceEnabled);
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      stopSpeech();
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    stopSpeech();
    onClose();
  };

  if (!isOpen) return null;

  const firstName = userName ? userName.trim().split(/\s+/)[0] : "";
  const effectiveExpression: CamilaExpression =
    stepIndex === 1 && accountsCount > 0 ? "happy" : currentStep.expression;

  // PASO 0: Modal de Bienvenida con el rostro grande de Camila y mapa del orden de creación
  if (stepIndex === 0) {
    return (
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenida al recorrido guiado con Camila"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto"
          >
            {/* Cabecera oscura con el rostro de Camila en vivo */}
            <div className="relative bg-[#080A0E] px-6 pt-6 pb-5 flex flex-col items-center text-center border-b border-zinc-800">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title={voiceEnabled ? "Silenciar voz de Camila" : "Activar voz de Camila"}
                  aria-label={voiceEnabled ? "Silenciar voz de Camila" : "Activar voz de Camila"}
                  className="p-2 rounded-xl bg-zinc-900/90 text-cyan-400 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                </button>
                <button
                  type="button"
                  onClick={handleRepeat}
                  title="Repetir bienvenida"
                  aria-label="Repetir bienvenida"
                  className="p-2 rounded-xl bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  title="Cerrar guía"
                  aria-label="Cerrar guía"
                  className="p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-48 h-36 sm:w-56 sm:h-40 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-inner bg-[#080A0E]">
                <CamilaFace
                  expression={effectiveExpression}
                  speaking={isSpeaking}
                  interactiveGaze={true}
                />
              </div>

              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-[11px] font-semibold text-cyan-300">
                <Sparkles className="w-3 h-3" />
                Camila · Guía Interactiva de FyDry
              </span>

              <h2 className="mt-2.5 text-lg sm:text-xl font-bold text-white tracking-tight">
                {firstName
                  ? `¡Hola, ${firstName}! Soy Camila`
                  : "¡Hola! Soy Camila, tu guía en FyDry"}
              </h2>
              <p className="mt-1.5 text-xs sm:text-[13px] text-zinc-300 max-w-md leading-relaxed">
                {currentStep.whatAndWhy}
              </p>
            </div>

            {/* Mapa del orden lógico de creación */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Orden lógico en que recorreremos tu cuenta:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOUR_STEPS.slice(1).map((s) => {
                  const StepIcon = s.icon;
                  return (
                    <button
                      key={s.stepNumber}
                      type="button"
                      onClick={() => setStepIndex(s.stepNumber)}
                      className="flex flex-col items-start p-2.5 rounded-2xl border border-zinc-200/80 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                          Paso {s.stepNumber}
                        </span>
                        <StepIcon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-700" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 line-clamp-1">
                        {s.title.replace(/^.*:\s*/, "")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Saltar guía por ahora
                </button>

                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Comenzar recorrido paso a paso (Paso 1: Cuentas)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // PASOS 1 A 8: Tarjeta flotante interactiva (no bloquea la pantalla para que el usuario pueda crear cuentas/registros en vivo)
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
      {/* Cabecera compacta con el rostro de Camila */}
      <div className="bg-[#080A0E] px-4 py-3 flex items-center justify-between gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-16 h-13 rounded-2xl overflow-hidden border border-cyan-400/25 shrink-0 bg-[#080A0E]">
            <CamilaFace
              expression={effectiveExpression}
              speaking={isSpeaking}
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
              {currentStep.title}
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
            title="Cerrar recorrido"
            aria-label="Cerrar recorrido"
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
          style={{ width: `${(stepIndex / (TOUR_STEPS.length - 1)) * 100}%` }}
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
          {stepIndex === 1 && (
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
          {stepIndex === 8 && (
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
            {TOUR_STEPS.slice(1).map((s) => {
              const active = stepIndex === s.stepNumber;
              const done = stepIndex > s.stepNumber;
              return (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => setStepIndex(s.stepNumber)}
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
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
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
                {stepIndex === TOUR_STEPS.length - 1 ? "Finalizar recorrido" : "Siguiente paso"}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
