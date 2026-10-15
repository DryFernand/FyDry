"use client";

import type { ChangeEvent, InputHTMLAttributes } from "react";
import { formatAmountInput } from "@/lib/money";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & {
  value: string | number | null | undefined;
  /** Permite saldos negativos (ej. saldo inicial de una cuenta sobregirada) */
  allowNegative?: boolean;
};

/** Campo de monto con separador de miles. `onChange` recibe el evento con el valor ya formateado. */
export default function MoneyInput({ value, onChange, allowNegative = false, ...rest }: MoneyInputProps) {
  const display = value === null || value === undefined || value === "" ? "" : formatAmountInput(String(value), allowNegative);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    // Conserva la posición del cursor contando dígitos/punto antes de él (las comas se mueven solas)
    const significantBefore = el.value.slice(0, caret).replace(/[^\d.-]/g, "").length;
    const formatted = formatAmountInput(el.value, allowNegative);
    el.value = formatted;
    let pos = 0;
    for (let seen = 0; pos < formatted.length && seen < significantBefore; pos++) {
      if (/[\d.-]/.test(formatted[pos])) seen++;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // algunos navegadores no permiten mover el cursor en ciertos tipos de campo
    }
    onChange?.(e);
  };

  return <input {...rest} type="text" inputMode="decimal" autoComplete="off" value={display} onChange={handleChange} />;
}
