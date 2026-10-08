"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  X,
  MoreVertical,
  Maximize2,
  Minimize2,
  Trash2,
  Send,
  Settings,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Wallet,
  PieChart,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import {
  createExpenseApi,
  createIncomeApi,
  createMovementApi,
  createAccountApi,
  createBudgetApi,
  createDebtApi,
  payDebtApi,
  fetchDebtsApi,
  fetchAccountsApi,
} from "@/lib/api";
import { AccountItem } from "@/components/dashboard/types";

export interface PendingAction {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: "pending" | "executing" | "completed" | "cancelled" | "failed";
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  pendingAction?: PendingAction;
}

const ALLOWED_TOOLS = new Set([
  "create_expense",
  "create_income",
  "create_transfer",
  "create_account",
  "create_budget",
  "create_debt",
  "pay_debt",
]);

const ALLOWED_ACCOUNT_TYPES = new Set([
  "bank",
  "cash",
  "credit_card",
  "savings",
  "wallet",
  "investment",
]);

function parseStrictAmount(val: any): number {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("El monto debe ser un número válido y estrictamente mayor a 0.");
  }
  return Math.round(num * 100) / 100;
}

function parseInitialBalance(val: any): number {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0));
  if (!Number.isFinite(num) || num < 0) {
    throw new Error("El balance inicial debe ser un número válido mayor o igual a 0.");
  }
  return Math.round(num * 100) / 100;
}

function sanitizeDate(dateStr?: any): string {
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  return new Date().toISOString().split("T")[0];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function findClosestCategory(
  categoryInput: string,
  type: "expense" | "income"
): string {
  const categories = (type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES) as readonly string[];
  const defaultCategory = type === "expense" ? "Otros Gastos" : "Otros Ingresos";

  if (!categoryInput || !categoryInput.trim()) {
    return defaultCategory;
  }

  const raw = categoryInput.trim();

  // 1. Coincidencia exacta
  const exact = categories.find((c) => c === raw);
  if (exact) return exact;

  const normalizedInput = normalizeText(raw);

  // 2. Coincidencia normalizada exacta (sin tildes ni mayúsculas)
  const normExact = categories.find((c) => normalizeText(c) === normalizedInput);
  if (normExact) return normExact;

  // 3. Contención directa (categoría contiene input o viceversa)
  const containsMatch = categories.find((c) => {
    const normC = normalizeText(c);
    return normC.includes(normalizedInput) || normalizedInput.includes(normC);
  });
  if (containsMatch) return containsMatch;

  // 4. Mapeo semántico y heurístico de palabras clave comunes
  const keywordsMap: Record<string, string[]> =
    type === "expense"
      ? {
          "Vivienda & Alquiler": ["alquiler", "renta", "casa", "depa", "departamento", "hipoteca", "vivienda", "arriendo"],
          "Supermercado & Alimentación": ["super", "mercado", "supermercado", "despensa", "mandado", "viveres", "compras", "alimento", "alimentos"],
          "Restaurantes & Bares": ["restaurante", "bar", "comida", "almuerzo", "cena", "desayuno", "cafe", "cafeteria", "starbucks", "mcdonalds", "pizza", "hamburguesa", "tragos", "cerveza"],
          "Servicios Públicos (Luz/Agua/Gas)": ["luz", "agua", "gas", "electricidad", "cfe", "servicio", "servicios"],
          "Telefonía & Internet": ["telefono", "telefonia", "celular", "internet", "wifi", "recarga", "movistar", "claro", "telcel"],
          "Gasolina & Combustible": ["gasolina", "combustible", "nafta", "diesel", "tanque"],
          "Transporte Público & Taxi": ["transporte", "uber", "taxi", "didi", "cabify", "metro", "bus", "camion", "pasaje", "peaje", "estacionamiento"],
          "Salud & Farmacia": ["salud", "farmacia", "medicina", "medicamento", "doctor", "medico", "consulta", "dentista", "optica", "hospital", "clinica"],
          "Seguros & Pólizas": ["seguro", "seguros", "poliza", "aseguradora"],
          "Gimnasio & Deporte": ["gym", "gimnasio", "deporte", "fitness", "crossfit", "entrenamiento", "padel", "futbol"],
          "Ropa & Calzado": ["ropa", "calzado", "zapatos", "zapatillas", "vestimenta", "moda", "tienda"],
          "Cuidado Personal & Barbería": ["barberia", "peluqueria", "corte", "estetica", "belleza", "skincare", "cuidado", "unas"],
          "Educación & Cursos": ["educacion", "curso", "cursos", "universidad", "colegio", "escuela", "udemy", "platzi", "matricula", "libro", "libros"],
          "Entretenimiento & Cine": ["cine", "pelicula", "entretenimiento", "concierto", "fiesta", "salida", "juegos", "videojuegos", "steam"],
          "Suscripciones Digitales": ["suscripcion", "suscripciones", "netflix", "spotify", "youtube", "amazon", "disney", "apple", "icloud"],
          "Viajes & Vacaciones": ["viaje", "viajes", "vacaciones", "hotel", "vuelo", "pasajes", "airbnb", "turismo"],
          "Mascotas & Veterinario": ["mascota", "mascotas", "perro", "gato", "veterinario", "veterinaria", "croquetas"],
          "Tecnología & Gadgets": ["tecnologia", "gadget", "gadgets", "laptop", "computadora", "celular", "audifonos"],
          "Mantenimiento del Hogar": ["mantenimiento", "reparacion", "plomero", "electricista", "pintura", "ferreteria", "hogar"],
          "Regalos & Celebraciones": ["regalo", "regalos", "cumpleanos", "celebracion", "aniversario", "navidad"],
          "Impuestos & Tasas": ["impuesto", "impuestos", "sat", "tasas", "tributo"],
          "Pago de Deudas & Préstamos": ["deuda", "prestamo", "tarjeta", "credito", "interes", "intereses", "abono"],
          "Imprevistos & Emergencias": ["imprevisto", "imprevistos", "emergencia", "urgencia"],
          "Inversiones": ["inversion", "inversiones", "acciones", "cetes", "fondos"],
          "Ahorro Programado": ["ahorro", "ahorros"],
          "Otros Gastos": ["otros", "otro", "gasto", "general", "varios"],
        }
      : {
          "Salario / Nómina Principal": ["salario", "sueldo", "nomina", "quincena", "pago", "empleo", "trabajo"],
          "Horas Extras & Guardias": ["horas extras", "guardias", "hora extra"],
          "Bonificaciones & Comisiones": ["bono", "bonos", "comision", "comisiones", "aguinaldo", "prima"],
          "Servicios Freelance": ["freelance", "proyecto", "trabajo independiente", "freelancer", "chamba"],
          "Consultoría & Asesoría": ["consultoria", "asesoria", "asesor"],
          "Negocio Propio / Ventas": ["negocio", "venta", "ventas", "comercio", "tienda", "emprendimiento"],
          "Dividendos & Acciones": ["dividendo", "dividendos", "acciones", "bolsa"],
          "Rentas / Alquileres de Inmuebles": ["renta", "alquiler", "arriendo", "inmueble"],
          "Rendimientos & Intereses Bancarios": ["rendimiento", "rendimientos", "interes", "intereses", "banco", "plazo fijo"],
          "Reembolsos & Devoluciones": ["reembolso", "devolucion", "retorno"],
          "Venta de Artículos de Segunda Mano": ["segunda mano", "usado", "garage", "marketplace"],
          "Premios & Sorteos": ["premio", "premios", "sorteo", "sorteos", "loteria"],
          "Regalos & Ayudas Familiares": ["regalo", "regalos", "ayuda", "familiar", "remesa", "donacion"],
          "Criptomonedas & Staking": ["cripto", "crypto", "bitcoin", "staking", "usdt", "ethereum"],
          "Otros Ingresos": ["otros", "otro", "ingreso", "general", "varios"],
        };

  const words = normalizedInput.split(/[\s,+/&-]+/).filter((w) => w.length >= 3);
  for (const [cat, kws] of Object.entries(keywordsMap)) {
    for (const kw of kws) {
      const normKw = normalizeText(kw);
      if (normalizedInput.includes(normKw) || words.some((w) => normKw.includes(w) || w.includes(normKw))) {
        return cat;
      }
    }
  }

  // 5. Comparación token por token con los nombres de categorías oficiales
  for (const cat of categories) {
    const catWords = normalizeText(cat).split(/[\s,+/&()-]+/).filter((w) => w.length >= 3);
    for (const w of words) {
      if (catWords.some((cw) => cw.includes(w) || w.includes(cw))) {
        return cat;
      }
    }
  }

  return defaultCategory;
}

export function findMatchingAccount(
  accountInput: string,
  accounts: AccountItem[]
): AccountItem | null {
  if (!accountInput || !accountInput.trim() || !accounts || accounts.length === 0) {
    return null;
  }

  const validAccounts = accounts.filter(
    (a) => a && typeof a?.name === "string" && a.name.trim().length > 0
  );
  if (validAccounts.length === 0) return null;

  const raw = accountInput.trim();
  const normInput = normalizeText(raw);
  if (!normInput) return null;

  // 1. Coincidencia exacta por nombre
  const exact = validAccounts.find((a) => a.name.trim().toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  // 2. Coincidencia normalizada exacta
  const normExact = validAccounts.find((a) => normalizeText(a.name) === normInput);
  if (normExact) return normExact;

  // 3. Coincidencia si el nombre de la cuenta contiene el término buscado (ej. "popular" dentro de "Banco Popular")
  if (normInput.length >= 3) {
    const nameContainsInput = validAccounts.find((a) => {
      const normA = normalizeText(a.name);
      return normA.includes(normInput);
    });
    if (nameContainsInput) return nameContainsInput;
  }

  // 4. Coincidencia si el input del usuario contiene el nombre completo de la cuenta
  const inputContainsName = validAccounts.find((a) => {
    const normA = normalizeText(a.name);
    return normA.length >= 3 && normInput.includes(normA);
  });
  if (inputContainsName) return inputContainsName;

  // 5. Coincidencia por palabras clave no genéricas si el input tiene varias palabras
  const GENERIC_WORDS = new Set(["banco", "tarjeta", "cuenta", "de", "del", "la", "el", "los", "las", "mi", "mis"]);
  const inputWords = normInput
    .split(/[\s,+/&-]+/)
    .filter((w) => w.length >= 3 && !GENERIC_WORDS.has(w));

  if (inputWords.length > 0) {
    const wordMatch = validAccounts.find((a) => {
      const normA = normalizeText(a.name);
      return inputWords.some((w) => normA.includes(w));
    });
    if (wordMatch) return wordMatch;
  }

  return null;
}

const INITIAL_GREETING =
  "Hola. Soy tu asistente de bienestar financiero en FyDry. Estoy aquí para acompañarte a organizar tus gastos, revisar tus presupuestos o resolver inquietudes sobre tus finanzas con calma y claridad.\n\n¿En qué te gustaría que nos enfoquemos hoy?";

function splitAssistantResponse(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= 250 && !trimmed.includes("\n\n")) {
    return [trimmed];
  }

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];

  for (const p of paragraphs) {
    if (p.length <= 280) {
      chunks.push(p);
    } else {
      const sentences = p.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [p];
      let currentChunk = "";

      for (const sentence of sentences) {
        const trimmedSent = sentence.trim();
        if (!trimmedSent) continue;

        if (
          currentChunk &&
          currentChunk.length + trimmedSent.length + 1 > 260
        ) {
          chunks.push(currentChunk.trim());
          currentChunk = trimmedSent;
        } else {
          currentChunk = currentChunk
            ? `${currentChunk} ${trimmedSent}`
            : trimmedSent;
        }
      }

      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

interface ActionCardProps {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
}

function ActionCard({ action, onConfirm, onCancel }: ActionCardProps) {
  const args = action.arguments || {};
  let title = "Operación Financiera";
  let badge = "Acción";
  let icon = <Bot className="w-4 h-4 text-zinc-900" />;
  const details: { label: string; value: string }[] = [];

  switch (action.name) {
    case "create_expense": {
      title = "Registrar Gasto";
      badge = "Gasto";
      icon = <ArrowDownRight className="w-4 h-4 text-rose-600" />;
      const amt = Number(args.amount) || 0;
      details.push({ label: "Monto", value: `$${amt.toFixed(2)}` });
      details.push({ label: "Concepto", value: args.description || "Gasto" });
      details.push({
        label: "Categoría",
        value: findClosestCategory(String(args.category || ""), "expense"),
      });
      details.push({ label: "Cuenta", value: args.account || "Efectivo" });
      if (args.date) details.push({ label: "Fecha", value: args.date });
      break;
    }
    case "create_income": {
      title = "Registrar Ingreso";
      badge = "Ingreso";
      icon = <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
      const amt = Number(args.amount) || 0;
      details.push({ label: "Monto", value: `$${amt.toFixed(2)}` });
      details.push({ label: "Concepto", value: args.description || "Ingreso" });
      details.push({
        label: "Categoría",
        value: findClosestCategory(String(args.category || ""), "income"),
      });
      details.push({ label: "Cuenta", value: args.account || "Banco" });
      if (args.date) details.push({ label: "Fecha", value: args.date });
      break;
    }
    case "create_transfer": {
      title = "Transferencia";
      badge = "Movimiento";
      icon = <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      const amt = Number(args.amount) || 0;
      details.push({ label: "Monto", value: `$${amt.toFixed(2)}` });
      details.push({ label: "Origen", value: args.from_account || "Cuenta Origen" });
      details.push({ label: "Destino", value: args.to_account || "Cuenta Destino" });
      if (args.description) details.push({ label: "Concepto", value: args.description });
      break;
    }
    case "create_account": {
      title = "Nueva Cuenta";
      badge = "Cuenta";
      icon = <Wallet className="w-4 h-4 text-purple-600" />;
      details.push({ label: "Nombre", value: args.name || "Cuenta" });
      details.push({ label: "Tipo", value: args.type || "bank" });
      const bal = Number(args.initial_balance) || 0;
      details.push({ label: "Saldo Inicial", value: `$${bal.toFixed(2)}` });
      break;
    }
    case "create_budget": {
      title = "Nuevo Presupuesto";
      badge = "Presupuesto";
      icon = <PieChart className="w-4 h-4 text-amber-600" />;
      details.push({
        label: "Categoría",
        value: findClosestCategory(String(args.category || ""), "expense"),
      });
      const lim = Number(args.limit_amount) || 0;
      details.push({ label: "Límite Mensual", value: `$${lim.toFixed(2)}` });
      break;
    }
    case "create_debt": {
      title = "Registrar Deuda";
      badge = "Deuda";
      icon = <CreditCard className="w-4 h-4 text-orange-600" />;
      details.push({ label: "Acreedor", value: args.creditor || "Acreedor" });
      const tot = Number(args.total_amount) || 0;
      details.push({ label: "Monto Total", value: `$${tot.toFixed(2)}` });
      if (args.due_date) details.push({ label: "Fecha Límite", value: args.due_date });
      break;
    }
    case "pay_debt": {
      title = "Abono a Deuda";
      badge = "Pago Deuda";
      icon = <Banknote className="w-4 h-4 text-teal-600" />;
      details.push({ label: "Deuda", value: args.debt_id_or_name || "Deuda" });
      const amt = Number(args.amount) || 0;
      details.push({ label: "Monto Abono", value: `$${amt.toFixed(2)}` });
      details.push({ label: "Cuenta Origen", value: args.from_account || "Cuenta" });
      break;
    }
    default:
      title = "Acción del Asistente";
      break;
  }

  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2.5 text-zinc-900 w-full select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-xs font-semibold text-zinc-900 tracking-tight">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/60 shrink-0">
          {badge}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
        {details.map((d, idx) => (
          <div key={idx} className="flex flex-col min-w-0">
            <span className="text-[10px] text-zinc-400 font-medium">
              {d.label}
            </span>
            <span className="text-zinc-800 font-semibold truncate" title={d.value}>
              {d.value}
            </span>
          </div>
        ))}
      </div>

      {action.status === "pending" && (
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirmar</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cancelar</span>
          </button>
        </div>
      )}

      {action.status === "executing" && (
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 text-zinc-600 text-[11px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
          <span>Registrando en FyDry...</span>
        </div>
      )}

      {action.status === "completed" && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 text-emerald-700 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Registrado exitosamente</span>
        </div>
      )}

      {action.status === "cancelled" && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 text-zinc-500 text-[11px]">
          <X className="w-3.5 h-3.5 text-zinc-400" />
          <span>Operación cancelada</span>
        </div>
      )}

      {action.status === "failed" && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 text-rose-600 text-[11px] font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>No se pudo procesar la solicitud</span>
        </div>
      )}
    </div>
  );
}

export default function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountItem[]>([]);

  // Cargar cuentas registradas del usuario
  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccountsApi();
      if (Array.isArray(data)) {
        setAccountsList(data);
      }
    } catch (err) {
      console.error("[AiAssistantChat] Error al cargar cuentas:", err);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    const handleRefresh = () => {
      loadAccounts();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("fydry_refresh_data", handleRefresh);
      window.addEventListener("fydry_storage_updated", handleRefresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("fydry_refresh_data", handleRefresh);
        window.removeEventListener("fydry_storage_updated", handleRefresh);
      }
    };
  }, [loadAccounts]);

  // Inicializar preferencia de confirmación desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fydry_ai_confirm_actions");
      if (saved !== null) {
        setRequireConfirmation(saved === "true");
      }
    }
  }, []);

  const handleToggleConfirmation = (checked: boolean) => {
    setRequireConfirmation(checked);
    if (typeof window !== "undefined") {
      localStorage.setItem("fydry_ai_confirm_actions", String(checked));
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial-greeting",
      role: "assistant",
      content: INITIAL_GREETING,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const abortTimeoutsRef = useRef<number[]>([]);

  // Limpiar temporizadores pendientes si el componente se desmonta
  const clearPendingTimeouts = useCallback(() => {
    abortTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    abortTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  // Scroll automático hacia el final del chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Reiniciar conversación al saludo inicial
  const handleClearChat = () => {
    clearPendingTimeouts();
    setIsTyping(false);
    setIsLoading(false);
    setMessages([
      {
        id: `initial-greeting-${Date.now()}`,
        role: "assistant",
        content: INITIAL_GREETING,
        timestamp: new Date(),
      },
    ]);
    setMenuOpen(false);
  };

  // Ejecución segura de las herramientas de FyDry
  const executeAction = async (action: PendingAction, messageId?: string) => {
    if (messageId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.pendingAction
            ? { ...m, pendingAction: { ...m.pendingAction, status: "executing" } }
            : m
        )
      );
    }

    try {
      const { name, arguments: args } = action;
      let confirmNote = "";

      if (!ALLOWED_TOOLS.has(name)) {
        throw new Error(`Acción desconocida o no permitida: ${name}`);
      }

      if (name === "create_expense") {
        const amount = parseStrictAmount(args.amount);
        const description = String(args.description || "Gasto general");
        const category = findClosestCategory(String(args.category || ""), "expense");
        let account = String(args.account || "Efectivo");
        if (accountsList.length > 0) {
          const matched = findMatchingAccount(account, accountsList);
          if (!matched) {
            throw new Error(`La cuenta "${account}" no está registrada en tus cuentas de FyDry.`);
          }
          account = matched.name;
        }
        const date = sanitizeDate(args.date);

        await createExpenseApi({
          amount,
          description,
          category,
          account,
          date,
        });
        confirmNote = `Listo, he registrado el gasto de $${amount.toFixed(2)} (${description}) en la categoría "${category}" y cuenta ${account}.`;
      } else if (name === "create_income") {
        const amount = parseStrictAmount(args.amount);
        const description = String(args.description || "Ingreso general");
        const category = findClosestCategory(String(args.category || ""), "income");
        let account = String(args.account || "Efectivo");
        if (accountsList.length > 0) {
          const matched = findMatchingAccount(account, accountsList);
          if (!matched) {
            throw new Error(`La cuenta "${account}" no está registrada en tus cuentas de FyDry.`);
          }
          account = matched.name;
        }
        const date = sanitizeDate(args.date);

        await createIncomeApi({
          amount,
          description,
          category,
          account,
          date,
        });
        confirmNote = `Listo, he registrado el ingreso de $${amount.toFixed(2)} (${description}) en la categoría "${category}" y cuenta ${account}.`;
      } else if (name === "create_transfer") {
        const amount = parseStrictAmount(args.amount);
        let fromAccount = String(args.from_account || "Cuenta Origen");
        let toAccount = String(args.to_account || "Cuenta Destino");
        if (accountsList.length > 0) {
          const matchedFrom = findMatchingAccount(fromAccount, accountsList);
          if (!matchedFrom) {
            throw new Error(`La cuenta "${fromAccount}" no está registrada en tus cuentas de FyDry.`);
          }
          fromAccount = matchedFrom.name;

          const matchedTo = findMatchingAccount(toAccount, accountsList);
          if (!matchedTo) {
            throw new Error(`La cuenta "${toAccount}" no está registrada en tus cuentas de FyDry.`);
          }
          toAccount = matchedTo.name;
        }
        const description = String(args.description || `Transferencia de ${fromAccount} a ${toAccount}`);
        const date = sanitizeDate(args.date);

        await createMovementApi({
          amount,
          fromAccount,
          toAccount,
          description,
          date,
        });
        confirmNote = `Listo, he registrado la transferencia de $${amount.toFixed(2)} de ${fromAccount} hacia ${toAccount}.`;
      } else if (name === "create_account") {
        const nameAcc = String(args.name || "Nueva Cuenta");
        const accountType = ALLOWED_ACCOUNT_TYPES.has(String(args.type).toLowerCase())
          ? (String(args.type).toLowerCase() as any)
          : "bank";
        const balance = parseInitialBalance(args.initial_balance);

        await createAccountApi({
          name: nameAcc,
          type: accountType,
          balance,
          currency: "USD",
        });
        confirmNote = `Listo, he creado la cuenta "${nameAcc}" con un saldo inicial de $${balance.toFixed(2)}.`;
      } else if (name === "create_budget") {
        const category = findClosestCategory(String(args.category || ""), "expense");
        const limit = parseStrictAmount(args.limit_amount);

        await createBudgetApi({
          category,
          allocated: limit,
          color: "bg-zinc-900",
        });
        confirmNote = `Listo, he creado el presupuesto para "${category}" con un límite mensual de $${limit.toFixed(2)}.`;
      } else if (name === "create_debt") {
        const creditor = String(args.creditor || "Acreedor");
        const total = parseStrictAmount(args.total_amount);
        const dueDate = args.due_date ? sanitizeDate(args.due_date) : "Fin de mes";

        await createDebtApi({
          creditor,
          type: "Préstamo Personal",
          totalAmount: total,
          remainingAmount: total,
          monthlyPayment: 0,
          interestRate: 0,
          dueDate,
        });
        confirmNote = `Listo, he registrado la deuda con ${creditor} por un monto de $${total.toFixed(2)}.`;
      } else if (name === "pay_debt") {
        const debtRef = String(args.debt_id_or_name || "");
        if (!debtRef || debtRef.trim().length === 0) {
          throw new Error("Debe indicarse el nombre o identificador de la deuda a abonar.");
        }
        const amount = parseStrictAmount(args.amount);
        let fromAccount = String(args.from_account || "Cuenta Principal");
        if (accountsList.length > 0) {
          const matchedFrom = findMatchingAccount(fromAccount, accountsList);
          if (!matchedFrom) {
            throw new Error(`La cuenta "${fromAccount}" no está registrada en tus cuentas de FyDry.`);
          }
          fromAccount = matchedFrom.name;
        }

        const debtsList = await fetchDebtsApi();
        const search = debtRef.toLowerCase().trim();
        const found = debtsList.find(
          (d) =>
            d.id === debtRef ||
            d.creditor.toLowerCase().trim() === search ||
            (search.length >= 3 && d.creditor.toLowerCase().includes(search))
        );
        if (!found) {
          throw new Error(`No se encontró ninguna deuda activa correspondiente a "${debtRef}".`);
        }
        const targetDebtId = found.id;

        await payDebtApi(targetDebtId, {
          amount,
          account_name: fromAccount,
          date: sanitizeDate(args.date),
          description: `Abono a deuda ${found.creditor || debtRef}`,
        });
        confirmNote = `Listo, he registrado el abono de $${amount.toFixed(2)} a la deuda desde ${fromAccount}.`;
      } else {
        throw new Error(`Acción desconocida: ${name}`);
      }

      // Sincronización en tiempo real
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fydry_refresh_data"));
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      loadAccounts();

      if (messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.pendingAction
              ? { ...m, pendingAction: { ...m.pendingAction, status: "completed" } }
              : m
          )
        );
      }

      if (confirmNote) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-confirm-${Date.now()}`,
            role: "assistant",
            content: confirmNote,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("[AiAssistantChat] Error al ejecutar la acción:", err);
      if (messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.pendingAction
              ? { ...m, pendingAction: { ...m.pendingAction, status: "failed" } }
              : m
          )
        );
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "No se puede procesar su solicitud en este momento por favor intente luego",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleCancelAction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingAction
          ? { ...m, pendingAction: { ...m.pendingAction, status: "cancelled" } }
          : m
      )
    );
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-cancel-${Date.now()}`,
        role: "assistant",
        content: "Entendido, no realizaré ningún cambio. Si necesitas algo más, dime.",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");
    setIsLoading(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("fydry_token") ||
            localStorage.getItem("fydry_access_token")
          : null;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userAccounts: accountsList.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: a.balance,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.error || (!data?.message && !data?.tool_call)) {
        setIsLoading(false);
        const fallbackMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "No se puede procesar su solicitud en este momento por favor intente luego",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        return;
      }

      const fullAssistantText = data.message || "";
      const toolCall = data.tool_call;
      const chunks = splitAssistantResponse(fullAssistantText);

      setIsLoading(false);

      const isValidToolCall = Boolean(
        toolCall &&
          typeof toolCall.name === "string" &&
          ALLOWED_TOOLS.has(toolCall.name)
      );

      // Si no hay tool call o la herramienta no está permitida, mostrar como mensaje conversacional normal
      if (!isValidToolCall) {
        if (chunks.length <= 1) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: chunks[0] || "",
              timestamp: new Date(),
            },
          ]);
        } else {
          // Despliegue progresivo
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}-0`,
              role: "assistant",
              content: chunks[0],
              timestamp: new Date(),
            },
          ]);

          let accumulatedDelay = 0;
          for (let i = 1; i < chunks.length; i++) {
            const chunk = chunks[i];
            const isLast = i === chunks.length - 1;

            accumulatedDelay += 500;
            const tid1 = window.setTimeout(() => {
              setIsTyping(true);
            }, accumulatedDelay - 350);
            abortTimeoutsRef.current.push(tid1);

            const tid2 = window.setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `assistant-${Date.now()}-${i}`,
                  role: "assistant",
                  content: chunk,
                  timestamp: new Date(),
                },
              ]);
              if (isLast) {
                setIsTyping(false);
              }
            }, accumulatedDelay);
            abortTimeoutsRef.current.push(tid2);
          }
        }
        return;
      }

      // Hay una herramienta para ejecutar
      const toolArgs = { ...(toolCall.arguments || {}) };
      if (toolCall.name === "create_expense" || toolCall.name === "create_budget") {
        toolArgs.category = findClosestCategory(String(toolArgs.category || ""), "expense");
      } else if (toolCall.name === "create_income") {
        toolArgs.category = findClosestCategory(String(toolArgs.category || ""), "income");
      }

      // Validación y verificación de cuentas y métodos de pago registrados
      if (toolCall.name === "create_expense") {
        if (accountsList.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content:
                "Aún no tienes cuentas registradas en FyDry. Para registrar este gasto, primero necesitas crear una cuenta. ¿Deseas que registremos una cuenta primero?",
              timestamp: new Date(),
            },
          ]);
          return;
        }

        const rawAccount = String(toolArgs.account || "").trim();
        const matchedAcc = findMatchingAccount(rawAccount, accountsList);

        if (!matchedAcc) {
          const available = accountsList.map((a) => a.name).join(", ");
          const methodStr = rawAccount || "ese método de pago";
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content: `Veo que mencionas pagar con "${methodStr}", pero no lo tienes registrado entre tus cuentas de FyDry. Tus cuentas disponibles son: ${available}. ¿Deseas asociar el movimiento a alguna de estas o prefieres que primero registremos "${methodStr}" como una nueva cuenta?`,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        toolArgs.account = matchedAcc.name;
      } else if (toolCall.name === "create_income") {
        if (accountsList.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content:
                "Aún no tienes cuentas registradas en FyDry. Para registrar este ingreso, primero necesitas crear una cuenta. ¿Deseas que registremos una cuenta primero?",
              timestamp: new Date(),
            },
          ]);
          return;
        }

        const rawAccount = String(toolArgs.account || "").trim();
        const matchedAcc = findMatchingAccount(rawAccount, accountsList);

        if (!matchedAcc) {
          const available = accountsList.map((a) => a.name).join(", ");
          const methodStr = rawAccount || "esa cuenta";
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content: `Veo que mencionas recibir el ingreso en "${methodStr}", pero no lo tienes registrado entre tus cuentas de FyDry. Tus cuentas disponibles son: ${available}. ¿Deseas asociar el movimiento a alguna de estas o prefieres que primero registremos "${methodStr}" como una nueva cuenta?`,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        toolArgs.account = matchedAcc.name;
      } else if (toolCall.name === "create_transfer") {
        if (accountsList.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content:
                "Aún no tienes cuentas registradas en FyDry. Para realizar una transferencia, primero necesitas crear cuentas. ¿Deseas que registremos una cuenta primero?",
              timestamp: new Date(),
            },
          ]);
          return;
        }

        const rawFrom = String(toolArgs.from_account || "").trim();
        const rawTo = String(toolArgs.to_account || "").trim();
        const matchedFrom = findMatchingAccount(rawFrom, accountsList);
        const matchedTo = findMatchingAccount(rawTo, accountsList);

        if (!matchedFrom || !matchedTo) {
          const available = accountsList.map((a) => a.name).join(", ");
          const missing = !matchedFrom
            ? rawFrom || "la cuenta de origen"
            : rawTo || "la cuenta de destino";
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-warn-${Date.now()}`,
              role: "assistant",
              content: `Veo que mencionas la cuenta "${missing}", pero no la tienes registrada entre tus cuentas de FyDry. Tus cuentas disponibles son: ${available}. ¿Deseas asociar la transferencia a alguna de estas o prefieres que primero registremos "${missing}" como una nueva cuenta?`,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        toolArgs.from_account = matchedFrom.name;
        toolArgs.to_account = matchedTo.name;
      } else if (toolCall.name === "pay_debt") {
        if (accountsList.length > 0) {
          const rawFrom = String(toolArgs.from_account || "").trim();
          const matchedFrom = findMatchingAccount(rawFrom, accountsList);

          if (!matchedFrom) {
            const available = accountsList.map((a) => a.name).join(", ");
            const fromAccountName = toolArgs.from_account || rawFrom || "esa cuenta";
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-warn-${Date.now()}`,
                role: "assistant",
                content: `Veo que deseas abonar a la deuda usando "${fromAccountName}", pero no lo tienes registrado entre tus cuentas de FyDry. Tus cuentas disponibles son: ${available}. ¿Deseas asociar el pago a alguna de estas o prefieres registrar esa cuenta primero?`,
                timestamp: new Date(),
              },
            ]);
            return;
          }

          toolArgs.from_account = matchedFrom.name;
        }
      }

      const pendingAction: PendingAction = {
        id: `act-${Date.now()}`,
        name: toolCall.name,
        arguments: toolArgs,
        status: requireConfirmation ? "pending" : "executing",
      };

      if (requireConfirmation) {
        // Flujo con confirmación del usuario
        const msgContent =
          fullAssistantText.trim() || "He preparado los datos de la operación para tu confirmación:";

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-action-${Date.now()}`,
            role: "assistant",
            content: msgContent,
            timestamp: new Date(),
            pendingAction,
          },
        ]);
      } else {
        // Flujo automático sin confirmación intermedia
        if (fullAssistantText.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-text-${Date.now()}`,
              role: "assistant",
              content: fullAssistantText,
              timestamp: new Date(),
            },
          ]);
        }
        // Ejecución inmediata
        await executeAction(pendingAction);
      }
    } catch (error) {
      console.error("[AiAssistantChat] Error al comunicarse con la IA:", error);
      setIsLoading(false);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `network-error-${Date.now()}`,
          role: "assistant",
          content:
            "No se puede procesar su solicitud en este momento por favor intente luego",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <>
      {/* 1. Botón Flotante con Icono de Robot */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="floating-ai-button"
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            title="Asistente de Bienestar Financiero"
            aria-label="Abrir asistente de IA"
            className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-40 bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl rounded-2xl w-13 h-13 min-w-[52px] min-h-[52px] flex items-center justify-center transition-all cursor-pointer group"
          >
            <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed bottom-20 md:bottom-6 right-5 md:right-6 z-50 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-2xl shadow-zinc-950/20 flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-2.5rem)] sm:w-[600px] h-[680px] max-h-[calc(100vh-6rem)]"
                : "w-[calc(100vw-2.5rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-7rem)]"
            }`}
          >
            {/* Header del Chat */}
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 backdrop-blur-sm select-none relative shrink-0">
              {/* Lado Izquierdo: Menú de Tres Puntos */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  title="Opciones de chat"
                  aria-label="Opciones de chat"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown del Menú */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 z-50 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded((prev) => !prev);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors cursor-pointer text-left"
                      >
                        {isExpanded ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Restaurar tamaño</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Agrandar chat</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Configuración</span>
                      </button>

                      <div className="h-px bg-zinc-100 my-1" />

                      <button
                        type="button"
                        onClick={handleClearChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50/70 transition-colors cursor-pointer text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Limpiar chat</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Centro: Identidad del Asistente */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-900 tracking-tight leading-tight">
                    FyDry AI
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Bienestar Financiero
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Derecho: Botón Cerrar (X) */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setMenuOpen(false);
                  setIsSettingsOpen(false);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal de Configuración Accesible */}
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md flex flex-col p-5"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-900 tracking-tight">
                          Configuración del Asistente
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Preferencias de ejecución y seguridad
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-100 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor="confirm-actions-toggle"
                          className="text-xs font-semibold text-zinc-900 block cursor-pointer"
                        >
                          Pedir confirmación antes de registrar acciones
                        </label>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Al estar activo, el asistente mostrará una tarjeta de confirmación antes de registrar gastos, ingresos, transferencias, presupuestos o deudas. Si lo desactivas, se registrarán de inmediato al tener todos los datos.
                        </p>
                      </div>

                      <button
                        id="confirm-actions-toggle"
                        type="button"
                        role="switch"
                        aria-checked={requireConfirmation}
                        onClick={() => handleToggleConfirmation(!requireConfirmation)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          requireConfirmation ? "bg-zinc-950" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            requireConfirmation ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Guardar y volver
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-linear-to-b from-zinc-50/40 to-white">
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`text-xs sm:text-[13px] leading-relaxed max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs whitespace-pre-line ${
                        isUser
                          ? "bg-zinc-950 text-white rounded-br-xs"
                          : "bg-zinc-100 text-zinc-800 rounded-bl-xs border border-zinc-200/50"
                      }`}
                    >
                      {msg.content}

                      {/* Tarjeta interactiva de acción si existe */}
                      {msg.pendingAction && (
                        <ActionCard
                          action={msg.pendingAction}
                          onConfirm={() => executeAction(msg.pendingAction!, msg.id)}
                          onCancel={() => handleCancelAction(msg.id)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Indicador visual de carga y escritura unificado (Tres puntos en movimiento) */}
              {(isLoading || isTyping) && (
                <div className="flex items-center gap-1.5 py-2 px-3 bg-zinc-100 border border-zinc-200/50 rounded-2xl w-fit rounded-bl-xs">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input y Enviar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-zinc-100 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregunta o pide una acción en FyDry..."
                disabled={isLoading || isTyping}
                className="flex-1 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-xs sm:text-[13px] text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || isTyping}
                title="Enviar mensaje"
                aria-label="Enviar mensaje"
                className="p-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
