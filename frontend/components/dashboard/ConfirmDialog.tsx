"use client";

import { useEffect, useId, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

/** Cierra con Escape mientras `active` sea true (para los modales de formulario). */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handlerRef = useRef(onEscape);
  useEffect(() => {
    handlerRef.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlerRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación accesible para acciones destructivas (reemplaza window.confirm). */
export default function ConfirmDialog({
  open,
  message,
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            // Evita que el Escape llegue a window y cierre también el modal de fondo.
            e.stopPropagation();
            onCancel();
          }
        }}
        className="w-full max-w-sm bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-4"
      >
        <h3 id={titleId} className="font-bold text-zinc-950 text-base">
          {title ?? (isEn ? "Are you sure?" : "¿Estás seguro?")}
        </h3>
        <p id={descId} className="text-xs text-zinc-600">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            {cancelLabel ?? (isEn ? "Cancel" : "Cancelar")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
          >
            {confirmLabel ?? (isEn ? "Delete" : "Eliminar")}
          </button>
        </div>
      </div>
    </div>
  );
}
