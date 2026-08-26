"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Building2,
  CreditCard,
  Banknote,
  X,
  Wallet,
  Trash2,
  Edit3,
} from "lucide-react";
import { AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchAccountsApi,
  createAccountApi,
  updateAccountApi,
  deleteAccountApi,
} from "@/lib/api";

export default function AccountsView() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank" | "card" | "wallet" | "cash">("bank");
  const [balance, setBalance] = useState("");
  const [accountNum, setAccountNum] = useState("");

  const loadAccounts = async () => {
    const data = await fetchAccountsApi();
    setAccounts(data);
  };

  useEffect(() => {
    loadAccounts();
    window.addEventListener("fydry_storage_updated", loadAccounts);
    return () => window.removeEventListener("fydry_storage_updated", loadAccounts);
  }, []);

  const bankTotal = accounts
    .filter((a) => a.type === "bank")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const cardTotal = accounts
    .filter((a) => a.type === "card" || a.type === "wallet")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const cashTotal = accounts
    .filter((a) => a.type === "cash")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName("");
    setType("bank");
    setBalance("");
    setAccountNum("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: AccountItem) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setAccountNum(acc.accountNumber || "");
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const parsedBalance = parseFloat(balance) || 0;

    if (editingAccount) {
      const updatedItem = {
        name,
        type,
        balance: parsedBalance,
        accountNumber: accountNum || undefined,
      };
      // Actualización optimista
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingAccount.id ? { ...a, ...updatedItem } : a))
      );
      await updateAccountApi(editingAccount.id, updatedItem);
    } else {
      const created = await createAccountApi({
        name,
        type,
        balance: parsedBalance,
        currency: "USD",
        accountNumber: accountNum || undefined,
      });
      setAccounts((prev) => [...prev, created]);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta cuenta?")) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      await deleteAccountApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingAccount(null);
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
          onClick={openCreateModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.accounts.addAccount}</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Bank Total */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.accounts.bankBalance}</span>
            <Building2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${bankTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "bank").length} {t.accounts.activeAccounts}
          </div>
        </div>

        {/* Cards & Wallets */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.accounts.cardBalance}</span>
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${cardTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "card" || a.type === "wallet").length} {t.accounts.registeredCards}
          </div>
        </div>

        {/* Cash */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.accounts.cashBalance}</span>
            <Banknote className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${cashTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">{t.accounts.walletPhysical}</div>
        </div>
      </div>

      {/* Account Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <motion.div
            key={acc.id}
            whileHover={{ y: -2 }}
            onClick={() => openEditModal(acc)}
            className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4 cursor-pointer hover:border-zinc-400 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-800">
                  {acc.type === "bank" ? (
                    <Building2 className="w-5 h-5 text-zinc-800" />
                  ) : acc.type === "cash" ? (
                    <Banknote className="w-5 h-5 text-zinc-800" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-zinc-800" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700">
                      {acc.name}
                    </h3>
                    <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {acc.accountNumber || (acc.type === "cash" ? "Billetera" : "Cuenta")}
                  </p>
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                {acc.type}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.accounts.availableBalance}
              </span>
              <span className="text-xl font-bold text-zinc-950">
                ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-zinc-900">No tienes cuentas registradas aún</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Añade tus cuentas de banco, tarjetas o efectivo para vincularlas a tus gastos e ingresos.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.accounts.addAccount}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Account Modal */}
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
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingAccount ? "Editar Cuenta" : t.accounts.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.accounts.accountName}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. BBVA Principal, Santander Nómina..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.accounts.accountType}
                    </label>
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as "bank" | "card" | "wallet" | "cash")
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                    >
                      <option value="bank">{t.accounts.bank}</option>
                      <option value="card">{t.accounts.card}</option>
                      <option value="wallet">Billetera Digital</option>
                      <option value="cash">{t.accounts.cash}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.accounts.initialBalance}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Número de Cuenta / IBAN (Opcional)
                  </label>
                  <input
                    type="text"
                    value={accountNum}
                    onChange={(e) => setAccountNum(e.target.value)}
                    placeholder="Ej. ES48 •••• 4821"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingAccount ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(editingAccount.id)}
                      className="flex items-center gap-1 py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      {t.accounts.cancel}
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      {editingAccount ? "Guardar Cambios" : t.accounts.saveAccount}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
