"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { AccountItem } from "./types";
import {
  fetchAccountsApi,
  createExpenseApi,
  createIncomeApi,
  createTransferApi,
} from "@/lib/api";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";

export type TransactionType = "expense" | "income" | "transfer";

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export default function QuickTransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
}: QuickTransactionModalProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>("");
  const [taxAmount, setTaxAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar cuentas activas
  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const data = await fetchAccountsApi();
      setAccounts(data);
      if (data.length > 0) {
        if (!fromAccount || !data.some((a) => a.name === fromAccount)) {
          setFromAccount(data[0].name);
        }
        if (data.length > 1) {
          const secondAcc = data.find((a) => a.name !== data[0].name);
          if (secondAcc && (!toAccount || toAccount === data[0].name)) {
            setToAccount(secondAcc.name);
          }
        }
      }
    } catch (err) {
      console.warn("Error loading accounts in QuickTransactionModal:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setErrorMessage(null);
      setSuccessMessage(null);
      setType(defaultType);
      if (defaultType === "income") {
        setCategory(INCOME_CATEGORIES[0]);
      } else if (defaultType === "expense") {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  }, [isOpen, defaultType]);

  // Actualizar categorías al cambiar el tipo
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrorMessage(null);
    if (newType === "expense") {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else if (newType === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(isEn ? "Account Transfer" : "Transferencia entre Cuentas");
      // Asegurar que toAccount sea diferente a fromAccount
      if (accounts.length > 1 && (!toAccount || toAccount === fromAccount)) {
        const alt = accounts.find((a) => a.name !== fromAccount);
        if (alt) setToAccount(alt.name);
      }
    }
  };

  // Cierre por tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  const resetForm = () => {
    setAmount("");
    setTaxAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (type === "expense") {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else if (type === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(
        isEn
          ? "Please enter a valid amount greater than 0."
          : "Por favor ingresa un monto válido mayor a 0."
      );
      return;
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setErrorMessage(
        isEn
          ? "Please provide a description or concept."
          : "Por favor proporciona una descripción o concepto."
      );
      return;
    }

    if (cleanDesc.length > 255) {
      setErrorMessage(
        isEn
          ? "Description cannot exceed 255 characters."
          : "La descripción no puede exceder 255 caracteres."
      );
      return;
    }

    const parsedTax = taxAmount ? parseFloat(taxAmount.replace(",", ".")) : 0;
    if (isNaN(parsedTax) || !isFinite(parsedTax) || parsedTax < 0) {
      setErrorMessage(
        isEn
          ? "Fee or tax amount cannot be negative or invalid."
          : "La comisión o impuesto no puede ser negativo o inválido."
      );
      return;
    }

    const currentFromAccount =
      fromAccount || (accounts.length > 0 ? accounts[0].name : "Efectivo Principal");

    const fromAccObj = accounts.find((a) => a.name === currentFromAccount);
    if (fromAccObj) {
      const availableFunds = fromAccObj.balance + (fromAccObj.overdraftLimit || 0);
      if (type !== "income" && parsedAmount + parsedTax > availableFunds) {
        setErrorMessage(
          isEn
            ? `Amount ($${(parsedAmount + parsedTax).toFixed(2)}) exceeds available balance and overdraft ($${availableFunds.toFixed(2)}) of "${fromAccObj.name}".`
            : `El monto ($${(parsedAmount + parsedTax).toFixed(2)}) supera el disponible más sobregiro ($${availableFunds.toFixed(2)}) de "${fromAccObj.name}".`
        );
        return;
      }
    }

    let targetToAccount = "";
    let toAccObj: AccountItem | undefined = undefined;

    if (type === "transfer") {
      targetToAccount =
        toAccount ||
        (accounts.length > 1
          ? accounts.find((a) => a.name !== currentFromAccount)?.name || ""
          : "");

      if (!targetToAccount) {
        setErrorMessage(
          isEn
            ? "Please select a destination account."
            : "Por favor selecciona una cuenta de destino."
        );
        return;
      }

      if (currentFromAccount === targetToAccount) {
        setErrorMessage(
          isEn
            ? "Origin and destination accounts must be different."
            : "La cuenta de origen y de destino deben ser distintas."
        );
        return;
      }

      toAccObj = accounts.find((a) => a.name === targetToAccount);
    }

    setIsSubmitting(true);

    try {
      if (type === "expense") {
        await createExpenseApi({
          description: cleanDesc,
          amount: parsedAmount,
          category,
          account: currentFromAccount,
          date,
        });
      } else if (type === "income") {
        await createIncomeApi({
          description: cleanDesc,
          amount: parsedAmount,
          category,
          account: currentFromAccount,
          date,
        });
      } else if (type === "transfer") {
        await createTransferApi({
          fromAccount: currentFromAccount,
          fromAccountId: fromAccObj?.id,
          toAccount: targetToAccount,
          toAccountId: toAccObj?.id,
          amount: parsedAmount,
          taxAmount: parsedTax,
          description:
            cleanDesc ||
            (isEn
              ? `Transfer from ${currentFromAccount} to ${targetToAccount}`
              : `Traspaso de ${currentFromAccount} a ${targetToAccount}`),
          date,
        });
      }

      // Disparar evento para actualizar en vivo toda la app
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }

      setSuccessMessage(
        isEn ? "Transaction registered successfully!" : "¡Transacción registrada con éxito!"
      );

      setTimeout(() => {
        setIsSubmitting(false);
        resetForm();
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Error creating transaction in QuickTransactionModal:", err);
      setErrorMessage(
        err?.message ||
          (isEn
            ? "An error occurred while saving the transaction."
            : "Ocurrió un error al registrar la transacción.")
      );
      setIsSubmitting(false);
    }
  };

  const parsedAmountPreview = parseFloat(amount.replace(",", ".")) || 0;
  const parsedTaxPreview = parseFloat(taxAmount.replace(",", ".")) || 0;
  const totalDebitedPreview = parsedAmountPreview + parsedTaxPreview;

  const currentFromAccountName =
    fromAccount || (accounts.length > 0 ? accounts[0].name : "");
  const currentToAccountName =
    toAccount ||
    (accounts.length > 1
      ? accounts.find((a) => a.name !== currentFromAccountName)?.name || ""
      : "");

  const transferFromAcc = accounts.find((a) => a.name === currentFromAccountName);
  const transferToAcc = accounts.find((a) => a.name === currentToAccountName);

  const transferFromBalanceAfter = transferFromAcc
    ? transferFromAcc.balance - totalDebitedPreview
    : 0;
  const transferToBalanceAfter = transferToAcc
    ? transferToAcc.balance + parsedAmountPreview
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/90 shadow-2xl p-5 sm:p-6 space-y-4 my-auto relative max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  FD
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight leading-tight">
                    {isEn ? "Quick Transaction" : "Registrar Transacción"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {isEn
                      ? "Add an expense, income, or transfer in seconds"
                      : "Añade un gasto, ingreso o transferencia al instante"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector (3 Tabs) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70">
              {/* Tab Gasto */}
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "expense"
                    ? "bg-white text-rose-600 shadow-xs border border-rose-200/60"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="truncate">{isEn ? "Expense" : "Gasto"}</span>
              </button>

              {/* Tab Ingreso */}
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "income"
                    ? "bg-white text-emerald-600 shadow-xs border border-emerald-200/60"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">{isEn ? "Income" : "Ingreso"}</span>
              </button>

              {/* Tab Transferencia */}
              <button
                type="button"
                onClick={() => handleTypeChange("transfer")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "transfer"
                    ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/80 font-bold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0 text-zinc-800" />
                <span className="truncate">{isEn ? "Transfer" : "Transferir"}</span>
              </button>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Monto y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monto */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    {isEn ? "Amount ($)" : "Monto ($)"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-950 font-bold text-sm placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    {isEn ? "Date" : "Fecha"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  {isEn ? "Description / Concept" : "Descripción / Concepto"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === "expense"
                      ? isEn
                        ? "e.g. Grocery store, Gas, Restaurant, Electricity bill..."
                        : "Ej. Supermercado, Almuerzo, Gasolina, Netflix..."
                      : type === "income"
                      ? isEn
                        ? "e.g. Monthly salary, Freelance project, Bonus..."
                        : "Ej. Salario quincenal, Proyecto freelance, Comisión..."
                      : isEn
                      ? "e.g. Savings transfer, Credit card payment..."
                      : "Ej. Ahorro para emergencias, Abono a tarjeta..."
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                />
              </div>

              {/* Categoría (solo si gasto o ingreso) */}
              {type !== "transfer" ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    {isEn ? "Category" : "Categoría"}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer truncate"
                  >
                    {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
                      (catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ) : null}

              {/* Cuentas */}
              <div
                className={`grid gap-3 ${
                  type === "transfer" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {/* Cuenta Origen */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    {type === "transfer"
                      ? isEn
                        ? "From Account (Source)"
                        : "Cuenta Origen"
                      : type === "expense"
                      ? isEn
                        ? "Paid From (Account)"
                        : "Cuenta a Debitar"
                      : isEn
                      ? "Deposited Into (Account)"
                      : "Cuenta de Destino"}
                  </label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    disabled={isLoadingAccounts || accounts.length === 0}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    {accounts.length > 0 ? (
                      accounts.map((a) => (
                        <option key={a.id} value={a.name}>
                          {a.name} (${Number(a.balance).toFixed(2)})
                        </option>
                      ))
                    ) : (
                      <option value="Efectivo Principal">Efectivo Principal</option>
                    )}
                  </select>
                </div>

                {/* Cuenta Destino (solo para transferencias) */}
                {type === "transfer" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      {isEn ? "To Account (Destination)" : "Cuenta Destino"}
                    </label>
                    <select
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      disabled={isLoadingAccounts || accounts.length < 2}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                    >
                      {accounts
                        .filter((a) => a.name !== fromAccount)
                        .map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} (${Number(a.balance).toFixed(2)})
                          </option>
                        ))}
                      {accounts.filter((a) => a.name !== fromAccount).length === 0 && (
                        <option value="">
                          {isEn ? "No other account available" : "No hay otra cuenta disponible"}
                        </option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Comisión / Impuesto bancario (solo para transferencias) */}
              {type === "transfer" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1 flex items-center justify-between">
                    <span>{isEn ? "Bank Fee / Tax ($)" : "Comisión / Impuesto bancario ($)"}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">{isEn ? "Optional" : "Opcional"}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder={
                        isEn
                          ? "0.00 (Optional, e.g. 0.15% DGII or interbank fee)"
                          : "0.00 (Opcional, ej. 0.15% DGII o comisión interbancaria)"
                      }
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* Mini tarjeta informativa de desglose y saldos estimados */}
              {type === "transfer" &&
                transferFromAcc &&
                transferToAcc &&
                parsedAmountPreview > 0 && (
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/70 text-xs space-y-2">
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {isEn ? "Balance Preview" : "Desglose y Saldos Estimados"}
                    </div>

                    {/* Origen */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-zinc-700">
                        <span>
                          {isEn
                            ? `Debit from ${transferFromAcc.name}:`
                            : `Sale de ${transferFromAcc.name}:`}
                        </span>
                        <span className="font-bold text-rose-600">
                          -${totalDebitedPreview.toFixed(2)}
                          {parsedTaxPreview > 0 &&
                            ` (${isEn ? "incl." : "incl."} $${parsedTaxPreview.toFixed(2)} ${
                              isEn ? "fee" : "comisión"
                            })`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>{isEn ? "Estimated balance in source:" : "Saldo estimado en origen:"}</span>
                        <span
                          className={`font-semibold ${
                            transferFromBalanceAfter < 0 ? "text-amber-600" : "text-zinc-700"
                          }`}
                        >
                          ${transferFromBalanceAfter.toFixed(2)}
                        </span>
                      </div>
                      {transferFromBalanceAfter < 0 && (
                        <div className="text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 font-medium mt-1">
                          {isEn
                            ? `⚠️ Overdraft margin in use ($${Math.abs(transferFromBalanceAfter).toFixed(2)})`
                            : `⚠️ Uso de margen de sobregiro ($${Math.abs(transferFromBalanceAfter).toFixed(2)})`}
                        </div>
                      )}
                    </div>

                    {/* Destino */}
                    <div className="space-y-0.5 pt-1.5 border-t border-zinc-200/60">
                      <div className="flex justify-between text-zinc-700">
                        <span>
                          {isEn
                            ? `Deposit into ${transferToAcc.name}:`
                            : `Llega a ${transferToAcc.name}:`}
                        </span>
                        <span className="font-bold text-emerald-600">
                          +${parsedAmountPreview.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>{isEn ? "Estimated balance in destination:" : "Saldo estimado en destino:"}</span>
                        <span className="font-semibold text-zinc-700">
                          ${transferToBalanceAfter.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isEn ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-2.5 px-5 rounded-xl font-semibold text-xs text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                    type === "expense"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : type === "income"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-zinc-950 hover:bg-zinc-800 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isEn ? "Saving..." : "Guardando..."}</span>
                    </>
                  ) : (
                    <span>
                      {type === "expense"
                        ? isEn
                          ? "Record Expense"
                          : "Registrar Gasto"
                        : type === "income"
                        ? isEn
                          ? "Record Income"
                          : "Registrar Ingreso"
                        : isEn
                        ? "Confirm Transfer"
                        : "Realizar Traspaso"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
