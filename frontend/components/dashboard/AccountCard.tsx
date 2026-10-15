"use client";

import type { AccountItem } from "./types";
import { availableFunds, formatMoney } from "@/lib/money";
import { getCardSkin, detectNetwork, lastFour } from "./cardSkins";

function NetworkMark({ network, color }: { network: ReturnType<typeof detectNetwork>; color: string }) {
  if (network === "visa") return <span style={{ color, fontStyle: "italic", fontWeight: 700, letterSpacing: ".04em" }}>VISA</span>;
  if (network === "mastercard")
    return (
      <span style={{ display: "inline-flex", alignItems: "center" }} aria-label="Mastercard">
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#eb001b", display: "inline-block" }} />
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#f79e1b", display: "inline-block", marginLeft: -7, mixBlendMode: "screen" }} />
      </span>
    );
  if (network === "amex") return <span style={{ color, fontWeight: 700, fontSize: 11 }}>AMEX</span>;
  return null;
}

/** Tarjeta visual estilo físico. Muestra solo el monto disponible. */
export default function AccountCard({ acc, onClick }: { acc: AccountItem; onClick?: () => void }) {
  const skin = getCardSkin(acc);
  const network = detectNetwork(acc);
  const l4 = lastFour(acc);
  const avail = availableFunds(acc);
  const isCredit = acc.type === "credit_card";
  const availLabel = isCredit ? "Crédito disponible" : "Disponible";
  const availText = isFinite(avail) ? formatMoney(avail, acc.currency) : formatMoney(acc.balance, acc.currency);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: skin.background, color: skin.fg }}
      className="relative text-left w-full aspect-[1.586] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      {/* Encabezado: emisor + tipo */}
      <div className="flex items-start justify-between">
        <span className="text-[15px] font-semibold tracking-wide" style={{ color: skin.accent }}>
          {skin.issuer}
        </span>
        <span className="text-[11px]" style={{ color: skin.sub }}>
          {isCredit ? "Crédito" : acc.type === "savings" ? "Meta de ahorro" : acc.type === "cash" ? "Billete" : acc.type === "wallet" ? "Digital" : "Cuenta"}
        </span>
      </div>

      {/* Chip (solo tarjetas/banco) */}
      {skin.chip ? (
        <div className="w-9 h-7 rounded-md" style={{ background: skin.chip }} />
      ) : (
        <div className="h-7" />
      )}

      {/* Disponible + número/red */}
      <div>
        <div className="text-[10px] uppercase tracking-widest" style={{ color: skin.sub }}>
          {availLabel}
        </div>
        <div className="text-[21px] font-semibold leading-tight">{availText}</div>
        <div className="flex items-center justify-between mt-1.5 min-h-[18px]">
          <span className="text-[12px] tracking-[.14em]" style={{ color: skin.sub }}>
            {l4 ? `•••• ${l4}` : acc.name}
          </span>
          <NetworkMark network={network} color={skin.accent} />
        </div>
      </div>
    </button>
  );
}
