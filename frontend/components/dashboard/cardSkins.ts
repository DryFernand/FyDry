import type { AccountItem } from "./types";

export type CardNetwork = "visa" | "mastercard" | "amex" | null;

export interface CardSkin {
  /** CSS para background (gradiente o patrón de billete) */
  background: string;
  /** color de texto principal */
  fg: string;
  /** color de texto secundario (etiquetas) */
  sub: string;
  /** color de acento (nombre/marca de la tarjeta) */
  accent: string;
  /** gradiente del chip dorado; vacío oculta el chip (ahorro/efectivo) */
  chip: string;
  /** nombre a mostrar como "emisor" */
  issuer: string;
  /** estilo visual: card (banco/tarjeta), savings, cash (billete), wallet */
  kind: "card" | "savings" | "cash" | "wallet";
}

const GOLD = "linear-gradient(135deg,#f0d485,#c9a24a)";

/** Últimos 4 dígitos de la tarjeta o cuenta. */
export function lastFour(acc: AccountItem): string | null {
  const raw = (acc.cardNumber || acc.accountNumber || "").replace(/\D/g, "");
  return raw.length >= 4 ? raw.slice(-4) : null;
}

/** Detecta la red por el primer dígito del número (estándar ISO/IIN). */
export function detectNetwork(acc: AccountItem): CardNetwork {
  const raw = (acc.cardNumber || "").replace(/\D/g, "");
  if (!raw) return null;
  const d = raw[0];
  if (d === "4") return "visa";
  if (d === "5" || d === "2") return "mastercard";
  if (d === "3") return "amex";
  return null;
}

/** Devuelve el skin según banco (por nombre) y tipo de cuenta. */
export function getCardSkin(acc: AccountItem): CardSkin {
  const n = acc.name.toLowerCase();
  const isCardType = acc.type === "credit_card" || acc.type === "debit_card" || acc.type === "card" || acc.type === "bank";
  // El chip solo aparece en tarjetas plásticas (débito/crédito), no en una cuenta bancaria normal.
  const isPlastic = acc.type === "credit_card" || acc.type === "debit_card" || acc.type === "card";

  // Bancos conocidos (detección por nombre)
  if (isCardType && n.includes("popular")) {
    return { background: "linear-gradient(135deg,#002147,#003f87)", fg: "#ffffff", sub: "rgba(255,255,255,.72)", accent: "#ffffff", chip: isPlastic ? GOLD : "", issuer: "Popular", kind: "card" };
  }
  if (isCardType && n.includes("bhd")) {
    return { background: "linear-gradient(135deg,#023d22,#0a7a40)", fg: "#ffffff", sub: "rgba(255,255,255,.72)", accent: "#ffffff", chip: isPlastic ? GOLD : "", issuer: "BHD", kind: "card" };
  }
  if (isCardType && n.includes("qik")) {
    return { background: "linear-gradient(135deg,#0a0a0a,#15302e)", fg: "#ffffff", sub: "rgba(255,255,255,.6)", accent: "#2fd4c4", chip: isPlastic ? "linear-gradient(135deg,#9fe9e0,#2fd4c4)" : "", issuer: "qik", kind: "card" };
  }

  // Metas de ahorro / fondos: tarjeta FyDry (vino de marca)
  if (acc.type === "savings") {
    return { background: "linear-gradient(135deg,#5a1a28,#8f3148)", fg: "#ffffff", sub: "rgba(255,255,255,.72)", accent: "#ffffff", chip: "", issuer: "FyDry", kind: "savings" };
  }

  // Efectivo: estilo billete (verde grabado con guilloché)
  if (acc.type === "cash") {
    return {
      background:
        "repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 6px)," +
        "radial-gradient(120% 120% at 15% 10%,rgba(255,255,255,.08),transparent 45%)," +
        "linear-gradient(135deg,#1f3b2e,#315c43)",
      fg: "#eef5ef", sub: "rgba(238,245,239,.7)", accent: "#cfe7d4", chip: "", issuer: "Efectivo", kind: "cash",
    };
  }

  // Billetera digital: tarjeta negra
  if (acc.type === "wallet") {
    return { background: "linear-gradient(135deg,#111113,#2b2b30)", fg: "#ffffff", sub: "rgba(255,255,255,.6)", accent: "#ffffff", chip: "", issuer: "Billetera", kind: "wallet" };
  }

  // Banco/tarjeta sin banco reconocido: grafito sobrio
  return { background: "linear-gradient(135deg,#1e293b,#3a4a63)", fg: "#ffffff", sub: "rgba(255,255,255,.68)", accent: "#ffffff", chip: isPlastic ? GOLD : "", issuer: acc.name, kind: "card" };
}
