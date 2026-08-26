"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CreditCard,
  Building2,
  Wallet,
  Coins,
  Plus,
  X,
} from "lucide-react";
import { AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";

const initialAccounts: AccountItem[] = [
  {
    id: "acc-1",
    name: "BBVA Principal",
    type: "bank",
    balance: 3420.5,
    currency: "USD",
    accountNumber: "ES48 •••• 4821",
  },
  {
    id: "acc-2",
    name: "Santander Nómina & Ahorro",
    type: "bank",
    balance: 1450.0,
    currency: "USD",
    accountNumber: "ES12 •••• 9920",
  },
  {
    id: "acc-3",
    name: "Revolut Tarjeta Débito",
    type: "card",
    balance: 892.3,
    currency: "USD",
    accountNumber: "•••• 9102",
  },
  {
    id: "acc-4",
    name: "Efectivo Físico",
    type: "cash",
    balance: 230.0,
    currency: "USD",
  },
];

export default function AccountsView() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountItem[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<AccountItem["type"]>("bank");
  const [newAccBalance, setNewAccBalance] = useState("");

  const bankBalance = accounts
    .filter((a) => a.type === "bank")
    .reduce((acc, curr) => acc + curr.balance, 0);
  const cardBalance = accounts
    .filter((a) => a.type === "card")
    .reduce((acc, curr) => acc + curr.balance, 0);
  const cashBalance = accounts
    .filter((a) => a.type === "cash")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance) return;

    const newAcc: AccountItem = {
      id: `acc-${Date.now()}`,
      name: newAccName,
      type: newAccType,
      balance: parseFloat(newAccBalance) || 0,
      currency: "USD",
      accountNumber: newAccType === "bank" ? "ES•• •••• " + Math.floor(1000 + Math.random() * 9000) : "•••• " + Math.floor(1000 + Math.random() * 9000),
    };

    setAccounts([...accounts, newAcc]);
    setNewAccName("");
    setNewAccBalance("");
    setIsModalOpen(false);
  };

  const getIcon = (type: AccountItem["type"]) => {
    switch (type) {
      case "bank":
        return <Building2 className="w-5 h-5" />;
      case "card":
        return <CreditCard className="w-5 h-5" />;
      case "cash":
        return <Coins className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.accounts.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.accounts.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.accounts.addAccount}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.accounts.bankBalance}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "bank").length} {t.accounts.activeAccounts}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.accounts.cardBalance}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${cardBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "card").length} {t.accounts.registeredCards}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-zinc-500">{t.accounts.cashBalance}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">{t.accounts.walletPhysical}</div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <motion.div
            key={acc.id}
            whileHover={{ y: -2 }}
            className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  {getIcon(acc.type)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-950">{acc.name}</h2>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {acc.accountNumber || "Efectivo"}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-semibold uppercase">
                {acc.type}
              </span>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 block">{t.accounts.availableBalance}</span>
                <div className="text-xl font-bold text-zinc-950">
                  ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
              >
                {t.accounts.movements}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-950">{t.accounts.modalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.accounts.accountName}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="Ej. Santander Nómina, Revolut..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.accounts.accountType}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bank", label: t.accounts.bank },
                      { id: "card", label: t.accounts.card },
                      { id: "cash", label: t.accounts.cash },
                    ].map((tItem) => (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => setNewAccType(tItem.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          newAccType === tItem.id
                            ? "bg-zinc-950 text-white border-zinc-950"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {tItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.accounts.initialBalance}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    {t.accounts.cancel}
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    {t.accounts.saveAccount}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
