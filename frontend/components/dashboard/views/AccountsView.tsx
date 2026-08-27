"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Building2,
  CreditCard,
  Banknote,
  PiggyBank,
  X,
  Wallet,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchAccountsApi,
  createAccountApi,
  updateAccountApi,
  deleteAccountApi,
} from "@/lib/api";

type AccountType = "bank" | "credit_card" | "debit_card" | "card" | "wallet" | "cash" | "savings";

export default function AccountsView() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cutoffDay, setCutoffDay] = useState("");
  const [graceDays, setGraceDays] = useState("");
  const [overdraftLimit, setOverdraftLimit] = useState("");

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

  const creditCardTotal = accounts
    .filter((a) => a.type === "credit_card")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const savingsTotal = accounts
    .filter((a) => a.type === "savings")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const debitAndOtherTotal = accounts
    .filter((a) => a.type === "debit_card" || a.type === "card" || a.type === "wallet" || a.type === "cash")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName("");
    setType("bank");
    setBalance("");
    setAccountNum("");
    setCardNum("");
    setCutoffDay("");
    setGraceDays("");
    setOverdraftLimit("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: AccountItem) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type as AccountType);
    setBalance(acc.balance.toString());
    setAccountNum(acc.accountNumber || "");
    setCardNum(acc.cardNumber || (acc.type === "credit_card" || acc.type === "debit_card" || acc.type === "card" ? acc.accountNumber || "" : ""));
    setCutoffDay(acc.cutoffDay ? acc.cutoffDay.toString() : "");
    setGraceDays(acc.graceDays ? acc.graceDays.toString() : "");
    setOverdraftLimit(acc.overdraftLimit ? acc.overdraftLimit.toString() : "");
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const parsedBalance = parseFloat(balance) || 0;
    const parsedCutoff = cutoffDay ? parseFloat(cutoffDay) : undefined;
    const parsedGrace = graceDays ? parseFloat(graceDays) : undefined;
    const parsedOverdraft = overdraftLimit ? parseFloat(overdraftLimit) : 0;

    const itemPayload: Partial<AccountItem> = {
      name,
      type,
      balance: parsedBalance,
      currency: "USD",
      accountNumber: type === "bank" ? accountNum : undefined,
      cardNumber: (type === "credit_card" || type === "debit_card" || type === "card") ? cardNum : undefined,
      cutoffDay: type === "credit_card" ? parsedCutoff : undefined,
      graceDays: type === "credit_card" ? parsedGrace : undefined,
      overdraftLimit: type === "credit_card" ? parsedOverdraft : undefined,
    };

    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingAccount.id ? { ...a, ...itemPayload } : a))
      );
      await updateAccountApi(editingAccount.id, itemPayload);
    } else {
      const created = await createAccountApi({
        name,
        type,
        balance: parsedBalance,
        currency: "USD",
        accountNumber: itemPayload.accountNumber,
        cardNumber: itemPayload.cardNumber,
        cutoffDay: itemPayload.cutoffDay,
        graceDays: itemPayload.graceDays,
        overdraftLimit: itemPayload.overdraftLimit,
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

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case "bank":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "credit_card":
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      case "debit_card":
      case "card":
        return <CreditCard className="w-5 h-5 text-zinc-700" />;
      case "savings":
        return <PiggyBank className="w-5 h-5 text-emerald-600" />;
      case "wallet":
        return <Wallet className="w-5 h-5 text-amber-600" />;
      case "cash":
        return <Banknote className="w-5 h-5 text-zinc-700" />;
      default:
        return <CreditCard className="w-5 h-5 text-zinc-800" />;
    }
  };

  const getAccountTypeLabel = (accType: string) => {
    switch (accType) {
      case "bank":
        return "Banco";
      case "credit_card":
        return "T. Crédito";
      case "debit_card":
      case "card":
        return "T. Débito";
      case "savings":
        return "Ahorros";
      case "wallet":
        return "Billetera";
      case "cash":
        return "Efectivo";
      default:
        return accType;
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
            Administra tus cuentas bancarias, tarjetas de crédito con corte y sobregiro, fondos de ahorro y efectivo.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bank Total */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.accounts.bankBalance}</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${bankTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "bank").length} cuentas bancarias
          </div>
        </div>

        {/* Credit Cards Total */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Tarjetas de Crédito</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-purple-600">
            ${creditCardTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "credit_card").length} tarjetas de crédito activas
          </div>
        </div>

        {/* Savings Total */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Cuentas de Ahorros</span>
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            ${savingsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type === "savings").length} fondos de ahorro
          </div>
        </div>

        {/* Débito, Efectivo & Billeteras */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Débito & Liquidez</span>
            <Wallet className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${debitAndOtherTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {accounts.filter((a) => a.type !== "bank" && a.type !== "credit_card" && a.type !== "savings").length} billeteras / efectivo
          </div>
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
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    acc.type === "credit_card"
                      ? "bg-purple-50"
                      : acc.type === "savings"
                      ? "bg-emerald-50"
                      : acc.type === "bank"
                      ? "bg-blue-50"
                      : "bg-zinc-100"
                  }`}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700">
                        {acc.name}
                      </h3>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {acc.type === "credit_card" || acc.type === "debit_card" || acc.type === "card"
                        ? acc.cardNumber
                          ? `Tarjeta •••• ${acc.cardNumber.slice(-4)}`
                          : "Tarjeta"
                        : acc.type === "bank"
                        ? acc.accountNumber || "Cuenta Bancaria"
                        : acc.type === "savings"
                        ? "Fondo de Ahorro"
                        : acc.type === "wallet"
                        ? "Billetera Digital"
                        : "Efectivo"}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                  acc.type === "credit_card"
                    ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                    : acc.type === "savings"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : acc.type === "bank"
                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                    : "bg-zinc-100 text-zinc-700"
                }`}>
                  {getAccountTypeLabel(acc.type)}
                </span>
              </div>

              {/* Credit card parameters pill */}
              {acc.type === "credit_card" && (
                <div className="bg-purple-50/50 rounded-2xl p-2.5 border border-purple-100 space-y-1 text-[11px] text-purple-950">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      Corte:
                    </span>
                    <span className="font-semibold">{acc.cutoffDay ? `Día ${acc.cutoffDay} de cada mes` : "Sin definir"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-600" />
                      Plazo para pago:
                    </span>
                    <span className="font-semibold">{acc.graceDays ? `${acc.graceDays} días después` : "Sin definir"}</span>
                  </div>
                  {acc.overdraftLimit && acc.overdraftLimit > 0 ? (
                    <div className="flex items-center justify-between pt-1 border-t border-purple-100/80">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-purple-600" />
                        Límite / Sobregiro:
                      </span>
                      <span className="font-bold text-purple-700">${acc.overdraftLimit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.accounts.availableBalance}
              </span>
              <span className={`text-xl font-bold ${
                acc.type === "credit_card"
                  ? "text-purple-600"
                  : acc.type === "savings"
                  ? "text-emerald-600"
                  : "text-zinc-950"
              }`}>
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
              Añade tus cuentas de banco, tarjetas de crédito, fondos de ahorro o efectivo para llevar el control financiero.
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
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingAccount ? "Editar Cuenta / Tarjeta" : t.accounts.modalTitle}
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
                {/* Account Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.accounts.accountType}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    <option value="bank">Cuenta Bancaria</option>
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="debit_card">Tarjeta de Débito</option>
                    <option value="savings">Cuenta de Ahorros</option>
                    <option value="cash">Efectivo Físico</option>
                    <option value="wallet">Billetera Digital</option>
                  </select>
                </div>

                {/* Account / Card Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {type === "credit_card"
                      ? "Nombre de la Tarjeta de Crédito"
                      : type === "debit_card"
                      ? "Nombre de la Tarjeta de Débito"
                      : type === "savings"
                      ? "Nombre del Fondo de Ahorro"
                      : t.accounts.accountName}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === "credit_card"
                        ? "Ej. Visa Oro BBVA, Mastercard Platinum..."
                        : type === "debit_card"
                        ? "Ej. Débito Nómina Santander..."
                        : type === "savings"
                        ? "Ej. Fondo de Emergencia, Vacaciones..."
                        : "Ej. Banco Principal, Efectivo Cartera..."
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                {/* Initial Balance */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {type === "credit_card"
                      ? "Saldo Actual Disponible / Saldo en Tarjeta ($)"
                      : t.accounts.initialBalance}
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

                {/* Conditional Fields: BANK -> Account Number */}
                {type === "bank" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Número de Cuenta / IBAN / Clave Interbancaria (Opcional)
                    </label>
                    <input
                      type="text"
                      value={accountNum}
                      onChange={(e) => setAccountNum(e.target.value)}
                      placeholder="Ej. ES48 •••• 4821 o 01218001..."
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                )}

                {/* Conditional Fields: DEBIT CARD -> Card Number */}
                {(type === "debit_card" || type === "card") && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Número de Tarjeta de Débito (Opcional)
                    </label>
                    <input
                      type="text"
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value)}
                      placeholder="Ej. 4532 •••• •••• 8821"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                )}

                {/* Conditional Fields: CREDIT CARD -> Card Number + Cutoff + Grace Days + Overdraft */}
                {type === "credit_card" && (
                  <div className="space-y-3 pt-1 border-t border-zinc-100">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                        Número de Tarjeta de Crédito (Opcional)
                      </label>
                      <input
                        type="text"
                        value={cardNum}
                        onChange={(e) => setCardNum(e.target.value)}
                        placeholder="Ej. 5421 •••• •••• 9912"
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Día de Corte del Mes
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={cutoffDay}
                          onChange={(e) => setCutoffDay(e.target.value)}
                          placeholder="Ej. 15"
                          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                        />
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">Día 1 al 31</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Días para Pago
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={graceDays}
                          onChange={(e) => setGraceDays(e.target.value)}
                          placeholder="Ej. 20"
                          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                        />
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">Días tras el corte</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                        Monto de Sobregiro / Límite de Crédito ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={overdraftLimit}
                        onChange={(e) => setOverdraftLimit(e.target.value)}
                        placeholder="Ej. 2500.00"
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Cupo máximo autorizado por el banco emisor
                      </span>
                    </div>
                  </div>
                )}

                {/* Savings / Cash / Wallet message */}
                {(type === "savings" || type === "cash" || type === "wallet") && (
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-500">
                    ℹ️ Esta cuenta no requiere ningún número de cuenta ni tarjeta.
                  </div>
                )}

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
