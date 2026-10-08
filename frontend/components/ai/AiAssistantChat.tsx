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
  Sparkles,
  KeyRound,
  RotateCcw,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isApiKeyWarning?: boolean;
}

const INITIAL_GREETING =
  "Hola. Soy tu asistente de bienestar financiero en FyDry. Estoy aquí para acompañarte a organizar tus gastos, revisar tus presupuestos o resolver inquietudes sobre tus finanzas con calma y claridad.\n\n¿En qué te gustaría que nos enfoquemos hoy?";

function splitAssistantResponse(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= 250 && !trimmed.includes("\n\n")) {
    return [trimmed];
  }

  // Dividir inicialmente por saltos de línea dobles
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];

  for (const p of paragraphs) {
    if (p.length <= 280) {
      chunks.push(p);
    } else {
      // Si el párrafo es extenso, dividir por oraciones con puntuación
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

export default function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiKeyError, setHasApiKeyError] = useState(false);

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
    setHasApiKeyError(false);
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
    setHasApiKeyError(false);

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
          messages: newHistory
            .filter((m) => !m.isApiKeyWarning)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();

      if (data?.error === "NO_API_KEY") {
        setIsLoading(false);
        setHasApiKeyError(true);
        const warningMsg: ChatMessage = {
          id: `apikey-warning-${Date.now()}`,
          role: "system",
          content:
            "Para conversar con el asistente, agrega tu clave `AI_API_KEY` en el archivo `.env.local`.",
          timestamp: new Date(),
          isApiKeyWarning: true,
        };
        setMessages((prev) => [...prev, warningMsg]);
        return;
      }

      if (!response.ok || data?.error) {
        setIsLoading(false);
        const fallbackMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            data?.message ||
            "No logré procesar tu mensaje en este momento. Por favor, intenta de nuevo en unos instantes.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        return;
      }

      const fullAssistantText = data.message || "";
      const chunks = splitAssistantResponse(fullAssistantText);

      setIsLoading(false);

      if (chunks.length === 1) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: chunks[0],
            timestamp: new Date(),
          },
        ]);
      } else {
        // Despliegue progresivo con pausas naturales
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
            "Parece que hubo una interrupción en la conexión. Puedes volver a escribir tu pregunta cuando gustes.",
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
                      className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 z-50 text-xs"
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
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-linear-to-b from-zinc-50/40 to-white">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const isSystemWarning = msg.isApiKeyWarning;

                if (isSystemWarning) {
                  return (
                    <div
                      key={msg.id}
                      className="my-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-700 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-zinc-900 font-medium">
                        <KeyRound className="w-4 h-4 text-zinc-600 shrink-0" />
                        <span>Configuración de clave de IA</span>
                      </div>
                      <p className="leading-relaxed text-zinc-600">
                        Para conversar con el asistente, agrega tu clave{" "}
                        <code className="px-1.5 py-0.5 rounded-md bg-zinc-200 text-zinc-900 font-mono text-[11px]">
                          AI_API_KEY
                        </code>{" "}
                        en el archivo{" "}
                        <code className="px-1.5 py-0.5 rounded-md bg-zinc-200 text-zinc-900 font-mono text-[11px]">
                          .env.local
                        </code>
                        .
                      </p>
                      <div className="text-[11px] text-zinc-500 bg-white/80 p-2 rounded-xl border border-zinc-150">
                        Puedes configurar cualquier proveedor compatible con
                        OpenAI (OpenAI, Groq, OpenRouter o compatible).
                      </div>
                    </div>
                  );
                }

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
                    </div>
                  </div>
                );
              })}

              {/* Indicador de "Escribiendo..." */}
              {isTyping && (
                <div className="flex items-center gap-1.5 py-1 px-3 bg-zinc-100 border border-zinc-200/50 rounded-2xl w-fit text-[11px] text-zinc-500 rounded-bl-xs animate-pulse">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                  <span className="ml-1 text-[11px] text-zinc-500">
                    escribiendo...
                  </span>
                </div>
              )}

              {/* Indicador de Carga General de Red */}
              {isLoading && !isTyping && (
                <div className="flex items-center gap-2 py-1 px-3 bg-zinc-100 border border-zinc-200/50 rounded-2xl w-fit text-[11px] text-zinc-500 rounded-bl-xs">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
                  <span>Pensando con calma...</span>
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
                placeholder="Pregunta sobre finanzas o FyDry..."
                disabled={isLoading || isTyping}
                className="flex-1 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-xs sm:text-[13px] text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={
                  !inputMessage.trim() || isLoading || isTyping
                }
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
