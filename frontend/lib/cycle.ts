import { TransactionItem } from "@/components/dashboard/types";

export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export interface CycleRange {
  startDate: Date;
  endDate: Date;
  resetDay: number;
}

/**
 * Calcula el rango exacto de fechas [startDate, endDate] para un ciclo mensual basado en el día de reinicio (1 al 31).
 */
export function getCycleRange(baseDate: Date = new Date(), resetDay: number = 1): CycleRange {
  const validResetDay = Math.max(1, Math.min(31, resetDay || 1));

  if (validResetDay === 1) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate, resetDay: 1 };
  }

  const currentDay = baseDate.getDate();
  let startYear = baseDate.getFullYear();
  let startMonth = baseDate.getMonth();

  if (currentDay < validResetDay) {
    const prev = new Date(startYear, startMonth - 1, 1);
    startYear = prev.getFullYear();
    startMonth = prev.getMonth();
  }

  const maxDaysStart = new Date(startYear, startMonth + 1, 0).getDate();
  const actualStartDay = Math.min(validResetDay, maxDaysStart);
  const startDate = new Date(startYear, startMonth, actualStartDay, 0, 0, 0, 0);

  const next = new Date(startYear, startMonth + 1, 1);
  const endYear = next.getFullYear();
  const endMonth = next.getMonth();
  const maxDaysEnd = new Date(endYear, endMonth + 1, 0).getDate();
  const actualEndDay = Math.min(validResetDay - 1, maxDaysEnd);
  const endDate = new Date(endYear, endMonth, actualEndDay, 23, 59, 59, 999);

  return { startDate, endDate, resetDay: validResetDay };
}

/**
 * Extrae y normaliza el timestamp exacto de una transacción a partir de su fecha contable o de creación.
 */
export function getTransactionTimestamp(t: TransactionItem): number | null {
  if (t.date && typeof t.date === "string") {
    const trimmed = t.date.trim();

    // 1. Formato "YYYY-MM-DD" o "YYYY/MM/DD"
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/);
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 12, 0, 0).getTime();
      }
    }

    // 2. Formato "DD/MM/YYYY" o "DD-MM-YYYY"
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/);
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 12, 0, 0).getTime();
      }
    }

    // 3. Formato localizado ("28 ago", "1 sept", "15 oct", "12 Nov 2026", "Aug 28")
    const spanishMonths: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, sept: 8, oct: 9, nov: 10, dic: 11,
    };
    const englishMonths: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    };

    const words = trimmed.toLowerCase().split(/[\s,.-]+/);
    let detectedDay: number | null = null;
    let detectedMonth: number | null = null;
    let detectedYear: number | null = null;

    for (const w of words) {
      const num = parseInt(w, 10);
      if (!isNaN(num)) {
        if (num > 1000) {
          detectedYear = num;
        } else if (num >= 1 && num <= 31 && detectedDay === null) {
          detectedDay = num;
        }
      } else {
        for (const prefix in spanishMonths) {
          if (w.startsWith(prefix)) {
            detectedMonth = spanishMonths[prefix];
            break;
          }
        }
        if (detectedMonth === null) {
          for (const prefix in englishMonths) {
            if (w.startsWith(prefix)) {
              detectedMonth = englishMonths[prefix];
              break;
            }
          }
        }
      }
    }

    if (detectedDay !== null && detectedMonth !== null) {
      const year =
        detectedYear ||
        (t.createdAt ? new Date(t.createdAt).getFullYear() : new Date().getFullYear());
      return new Date(year, detectedMonth, detectedDay, 12, 0, 0).getTime();
    }
  }

  // 4. Fallback a createdAt
  if (t.createdAt) {
    const d = new Date(t.createdAt);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  return null;
}

/**
 * Valida si una transacción pertenece estrictamente a un rango de fechas [startDate, endDate].
 */
export function isTransactionInPeriod(t: TransactionItem, startDate: Date, endDate: Date): boolean {
  const timestamp = getTransactionTimestamp(t);
  if (timestamp === null) return false;
  return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
}

/**
 * Formatea la etiqueta legible de un ciclo de fechas según el idioma.
 */
export function formatCycleLabel(
  startDate: Date,
  endDate: Date,
  resetDay: number,
  language: "es" | "en" = "es"
): string {
  const monthNames = language === "es" ? MONTH_NAMES_ES : MONTH_NAMES_EN;

  if (resetDay === 1) {
    const monthIndex = startDate.getMonth();
    const year = startDate.getFullYear();
    return `${monthNames[monthIndex]} ${year}`;
  }

  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const endYear = endDate.getFullYear();

  const startMonthName = monthNames[startMonth].slice(0, 3);
  const endMonthName = monthNames[endMonth].slice(0, 3);

  return `${startDay} ${startMonthName} – ${endDay} ${endMonthName} ${endYear}`;
}
