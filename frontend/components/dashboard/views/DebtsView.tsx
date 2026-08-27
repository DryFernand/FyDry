"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  Trash2,
  Edit3,
  DollarSign,
  ArrowDownRight,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { DebtItem, AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchDebtsApi,
  createDebtApi,
  updateDebtApi,
  deleteDebtApi,
  payDebtApi,
  fetchAccountsApi,
} from "@/lib/api";

export default function DebtsView() {
  const { t } = useLanguage();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  // Modal de Pago / Abono
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payError, setPayError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Form states
  const [creditor, setCreditor] = useState("");
  const [type, setType] = useState("Préstamo Personal");
  const [total, setTotal] = useState("");
  const [remaining, setRemaining] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");

  const loadData = async () => {
    const [debtsData, accountsData] = await Promise.all([
      fetchDebtsApi(),
      fetchAccountsApi(),
    ]);
    setDebts(debtsData);
    setAccounts(accountsData);
    if (accountsData.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accountsData[0].name);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  const totalRemaining = debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalMonthlyCommitment = debts.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const totalOriginalPrincipal = debts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalAmortized = Math.max(totalOriginalPrincipal - totalRemaining, 0);
  const liquidationPercent =
    totalOriginalPrincipal > 0 ? Math.round((totalAmortized / totalOriginalPrincipal) * 100) : 100;

  const openCreateModal = () => {
    setEditingDebt(null);
    setCreditor("");
    setType("Préstamo Personal");
    setTotal("");
    setRemaining("");
    setMonthly("");
    setRate("");
    setIsModalOpen(true);
  };

  const openEditModal = (d: DebtItem) => {
    setEditingDebt(d);
    setCreditor(d.creditor);
    setType(d.type);
    setTotal(d.totalAmount.toString());
    setRemaining(d.remainingAmount.toString());
    setMonthly(d.monthlyPayment.toString());
    setRate(d.interestRate.toString());
    setIsModalOpen(true);
  };

  const openPayModal = (e: React.MouseEvent, d: DebtItem) => {
    e.stopPropagation();
    setPayingDebt(d);
    // Sugerir la cuota mensual si es mayor a 0 y menor que el restante, de lo contrario el restante
    const suggested = d.monthlyPayment > 0 && d.monthlyPayment <= d.remainingAmount
      ? d.monthlyPayment.toString()
      : d.remainingAmount.toString();
    setPayAmount(suggested);
    setSelectedAccountId(accounts.length > 0 ? accounts[0].name : "Cuenta Principal");
    setPayDesc(`Abono a ${d.creditor}`);
    setPayError("");
    setIsPayModalOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor || !remaining) return;

    const parsedTotal = parseFloat(total) || parseFloat(remaining);
    const parsedRemaining = parseFloat(remaining) || 0;
    const parsedMonthly = parseFloat(monthly) || 0;
    const parsedRate = parseFloat(rate) || 0;

    if (editingDebt) {
      const updatedItem = {
        creditor,
        type,
        totalAmount: parsedTotal,
        remainingAmount: parsedRemaining,
        monthlyPayment: parsedMonthly,
        interestRate: parsedRate,
      };
      setDebts((prev) =>
        prev.map((item) => (item.id === editingDebt.id ? { ...item, ...updatedItem } : item))
      );
      await updateDebtApi(editingDebt.id, updatedItem);
    } else {
      const created = await createDebtApi({
        creditor,
        type,
        totalAmount: parsedTotal,
        remainingAmount: parsedRemaining,
        monthlyPayment: parsedMonthly,
        interestRate: parsedRate,
        dueDate: "Fin de mes",
      });
      setDebts((prev) => [...prev, created]);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm("¿Deseas eliminar este registro de deuda?")) {
      setDebts((prev) => prev.filter((d) => d.id !== id));
      await deleteDebtApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingDebt(null);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    setPayError("");

    const parsedAmount = parseFloat(payAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setPayError("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (parsedAmount > payingDebt.remainingAmount) {
      setPayError(
        `El monto a pagar ($${parsedAmount.toFixed(2)}) no puede ser mayor a la deuda pendiente ($${payingDebt.remainingAmount.toFixed(2)}).`
      );
      return;
    }

    const selectedAcc = accounts.find((a) => a.name === selectedAccountId || a.id === selectedAccountId);
    if (selectedAcc && selectedAcc.type === "credit_card") {
      const availableFunds = selectedAcc.balance + (selectedAcc.overdraftLimit || 0);
      if (parsedAmount > availableFunds) {
        setPayError(
          `Fondos insuficientes: La tarjeta seleccionada solo dispone de $${availableFunds.toFixed(2)} (incluyendo sobregiro).`
        );
        return;
      }
    }

    setIsPaying(true);
    try {
      const updatedDebt = await payDebtApi(payingDebt.id, {
        amount: parsedAmount,
        account_id: selectedAcc?.id,
        account_name: selectedAcc?.name || selectedAccountId,
        description: payDesc || `Abono a ${payingDebt.creditor}`,
        date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      });

      if (updatedDebt) {
        setDebts((prev) =>
          prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d))
        );
      } else {
        setDebts((prev) =>
          prev.map((d) =>
            d.id === payingDebt.id
              ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - parsedAmount) }
              : d
          )
        );
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }

      setIsPayModalOpen(false);
      setPayingDebt(null);
    } catch (err: any) {
      setPayError(err.message || "Error al procesar el pago de la deuda.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.debts.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.debts.subtitle} · Paga cuotas e impacta tu presupuesto
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all font-semibold text-xs shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.debts.addDebt}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Deuda Pendiente */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.debts.totalPendingDebt}</span>
            <Building2 className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-600">
            ${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {debts.length} {t.debts.activeDebts}
          </div>
        </div>

        {/* Cuota Mensual Comprometida */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.debts.monthlyCommitment}</span>
            <CreditCard className="w-4 h-4 text-zinc-900" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalMonthlyCommitment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-zinc-400">/mes</span>
          </div>
          <div className="text-[11px] text-zinc-400">{t.debts.recurringPayment}</div>
        </div>

        {/* Progreso de Liquidación */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">{t.debts.liquidationProgress}</span>
            <span className="text-xs font-bold text-emerald-600">
              {liquidationPercent}% {t.debts.paidTag}
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden mt-2">
            <motion.div
              className="bg-emerald-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${liquidationPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>Amortizado: ${totalAmortized.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span>Total: ${totalOriginalPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        {debts.map((d) => {
          const paidAmount = d.totalAmount - d.remainingAmount;
          const percentPaid = d.totalAmount > 0 ? Math.round((paidAmount / d.totalAmount) * 100) : 0;
          const isLiquidated = d.remainingAmount <= 0;

          return (
            <motion.div
              key={d.id}
              whileHover={{ y: -2 }}
              onClick={() => openEditModal(d)}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4 cursor-pointer hover:border-zinc-400 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isLiquidated ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-800"
                  }`}>
                    {isLiquidated ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : d.type.includes("Tarjeta") ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700">
                        {d.creditor}
                      </h3>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {isLiquidated && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Liquidada
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span>{d.type}</span>
                      <span>•</span>
                      <span>TIN: {d.interestRate}%</span>
                      <span>•</span>
                      <span>{d.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <div className={`text-base font-bold ${isLiquidated ? "text-emerald-600" : "text-rose-600"}`}>
                      ${d.remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-xs text-zinc-400 font-normal">
                        de ${d.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">
                      {t.debts.monthlyFee}: ${d.monthlyPayment}/mes
                    </div>
                  </div>

                  {/* Botón Pagar / Abonar */}
                  {!isLiquidated && (
                    <button
                      type="button"
                      onClick={(e) => openPayModal(e, d)}
                      className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pagar / Abonar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>{t.debts.amortized}: ${paidAmount.toLocaleString()}</span>
                  <span>{percentPaid}% {t.debts.completed}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-emerald-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${percentPaid}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        {debts.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-zinc-900">¡Libre de deudas! Cero compromisos pendientes</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No tienes préstamos ni pasivos registrados. Si tienes compromisos bancarios o tarjetas a plazo, regístralas para monitorear su amortización y pagos mensuales.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.debts.addDebt}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Pago / Abono de Deuda */}
      <AnimatePresence>
        {isPayModalOpen && payingDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950 text-sm">
                      Pagar / Abonar a Deuda
                    </h3>
                    <p className="text-[11px] text-zinc-400">{payingDebt.creditor} ({payingDebt.type})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-700 font-medium">
                  {payError}
                </div>
              )}

              {/* Info de Deuda Pendiente */}
              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Saldo Restante:</span>
                <span className="font-bold text-rose-600 text-sm">
                  ${payingDebt.remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <form onSubmit={handleExecutePayment} className="space-y-4">
                {/* Accesos rápidos */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1.5">
                    Opciones Rápidas de Abono:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {payingDebt.monthlyPayment > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.min(payingDebt.monthlyPayment, payingDebt.remainingAmount).toString())}
                        className="py-2 px-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors text-left"
                      >
                        <span className="block text-[10px] text-zinc-400 font-normal">Pagar Cuota</span>
                        ${payingDebt.monthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPayAmount(payingDebt.remainingAmount.toString())}
                      className="py-2 px-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors text-left"
                    >
                      <span className="block text-[10px] text-zinc-400 font-normal">Liquidar Total</span>
                      ${payingDebt.remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </button>
                  </div>
                </div>

                {/* Monto a Pagar */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Monto a Pagar ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={payingDebt.remainingAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                {/* Cuenta de Origen */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Cuenta debitada *
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.name} (${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Se restará de esta cuenta y se asentará el gasto en «Pago de Deudas & Préstamos» para tu presupuesto.
                  </span>
                </div>

                {/* Concepto / Nota */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Concepto / Nota (Opcional)
                  </label>
                  <input
                    type="text"
                    value={payDesc}
                    onChange={(e) => setPayDesc(e.target.value)}
                    placeholder={`Ej. Abono cuota mensual ${payingDebt.creditor}`}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isPaying ? "Procesando..." : "Confirmar Pago"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Crear / Editar Deuda */}
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
                  {editingDebt ? "Editar Compromiso de Deuda" : t.debts.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDebt} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.debts.creditor}
                  </label>
                  <input
                    type="text"
                    required
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    placeholder="Ej. Santander, BBVA, Familiar..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Tipo de Compromiso
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    >
                      <option value="Préstamo Personal">Préstamo Personal</option>
                      <option value="Hipoteca Vivienda">Hipoteca Vivienda</option>
                      <option value="Préstamo Coche / Auto">Préstamo Auto</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                      <option value="Línea de Crédito">Línea de Crédito</option>
                      <option value="Préstamo Estudiantil">Préstamo Estudiantil</option>
                      <option value="Deuda Familiar / Amigos">Familiar / Amigos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.totalOriginal}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.pendingBalance}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={remaining}
                      onChange={(e) => setRemaining(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      {t.debts.monthlyPaymentInput}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthly}
                      onChange={(e) => setMonthly(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.debts.interestRateInput}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Ej. 6.5"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-2">
                  {editingDebt ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteDebt(editingDebt.id)}
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
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      {editingDebt ? "Guardar Cambios" : t.debts.saveDebt}
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
