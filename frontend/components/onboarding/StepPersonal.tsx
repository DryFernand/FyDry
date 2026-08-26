"use client";

import { motion } from "motion/react";
import { Globe2, Phone, MapPin, DollarSign, Euro, Coins } from "lucide-react";
import { OnboardingFormData } from "./types";

interface StepPersonalProps {
  formData: OnboardingFormData;
  updateData: (fields: Partial<OnboardingFormData>) => void;
  onNext: () => void;
}

const currencies = [
  { code: "USD", symbol: "$", label: "Dólar estadounidense (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "MXN", symbol: "$", label: "Peso Mexicano (MXN)" },
  { code: "COP", symbol: "$", label: "Peso Colombiano (COP)" },
  { code: "ARS", symbol: "$", label: "Peso Argentino (ARS)" },
  { code: "CLP", symbol: "$", label: "Peso Chileno (CLP)" },
];

const countries = [
  "España",
  "México",
  "Colombia",
  "Argentina",
  "Chile",
  "Perú",
  "Ecuador",
  "Estados Unidos",
  "Venezuela",
  "Uruguay",
  "Otro",
];

export default function StepPersonal({
  formData,
  updateData,
  onNext,
}: StepPersonalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          Cuéntanos un poco sobre ti
        </h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Personalizaremos tu experiencia y moneda para que tus balances reflejen tu realidad.
        </p>
      </div>

      {/* País y Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            País de residencia
          </label>
          <div className="relative">
            <select
              value={formData.country}
              onChange={(e) => updateData({ country: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs cursor-pointer appearance-none"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Globe2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            Ciudad (opcional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateData({ city: e.target.value })}
              placeholder="Ej. Madrid, CDMX, Bogotá"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
            />
            <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Teléfono / WhatsApp */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
          Teléfono o WhatsApp (opcional para alertas de gastos)
        </label>
        <div className="relative">
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+34 600 000 000"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
          />
          <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Moneda Principal */}
      <div>
        <label className="block text-xs font-semibold text-zinc-800 mb-2">
          Moneda principal preferida
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {currencies.map((curr) => {
            const isSelected = formData.preferred_currency === curr.code;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => updateData({ preferred_currency: curr.code })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{curr.code}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${isSelected ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-600"}`}>
                    {curr.symbol}
                  </span>
                </div>
                <div className={`text-[11px] truncate ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                  {curr.label.split("(")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <div className="pt-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continuar</span>
          <span>&rarr;</span>
        </motion.button>
      </div>
    </form>
  );
}
