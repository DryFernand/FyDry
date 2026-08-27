"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeftRight,
  Search,
  X,
  Trash2,
  Edit3,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Percent,
} from "lucide-react";
import { MovementItem, AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchMovementsApi,
  createMovementApi,
  updateMovementApi,
  deleteMovementApi,
  fetchAccountsApi,
  markNotificationProcessedApi,
} from "@/lib/api";

interface MovementsViewProps {
  initialDraft?: {
    amount?: number;
    description?: string;
    from_account_name?: string;
    to_account_name?: string;
    date?: string;
    notifId?: string;
  } | null;
  onClearDraft?: () => void;
}

export default function MovementsView({ initialDraft, onClearDraft }: MovementsViewProps = {}) {
  const { language } = useLanguage();
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementItem | null>(null);

  // Form State
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    const [movData, accData] = await Promise.all([
      fetchMovementsApi(),
      fetchAccountsApi(),
    ]);
    setMovements(movData);
    setAccounts(accData);
    if (accData.length >= 2) {
      setFromAccount((prev) => prev || accData[0].name);
      setToAccount((prev) => prev || accData[1].name);
    } else if (accData.length === 1) {
      setFromAccount((prev) => prev || accData[0].name);
      setToAccount((prev) => prev || accData[0].name);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("fydry_storage_updated", loadData);
    return () => window.removeEventListener("fydry_storage_updated", loadData);
  }, []);

  useEffect(() => {
    if (initialDraft) {
      setEditingMovement(null);
      setAmount(initialDraft.amount ? initialDraft.amount.toString() : "");
      setDescription(initialDraft.description || "");
      if (initialDraft.from_account_name) setFromAccount(initialDraft.from_account_name);
      if (initialDraft.to_account_name) setToAccount(initialDraft.to_account_name);
      setIsModalOpen(true);
    }
  }, [initialDraft]);

  const openCreateModal = () => {
    setEditingMovement(null);
    setAmount("");
    setTaxAmount("");
    setDescription("");
    setFormError("");
    if (accounts.length >= 2) {
      setFromAccount(accounts[0].name);
      setToAccount(accounts[1].name);
    } else if (accounts.length === 1) {
      setFromAccount(accounts[0].name);
      setToAccount(accounts[0].name);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (mov: MovementItem) => {
    setEditingMovement(mov);
    setFromAccount(mov.fromAccount);
    setToAccount(mov.toAccount);
    setAmount(mov.amount.toString());
    setTaxAmount(mov.taxAmount && mov.taxAmount > 0 ? mov.taxAmount.toString() : "");
    setDescription(mov.description);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fromAccount || !toAccount) {
      setFormError("Debes seleccionar una cuenta de origen y una de destino.");
      return;
    }

    if (fromAccount === toAccount) {
      setFormError("La cuenta de origen y de destino no pueden ser la misma.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("Ingresa un monto de transferencia válido mayor a 0.");
      return;
    }

    const parsedTax = parseFloat(taxAmount) || 0.0;
    if (parsedTax < 0) {
      setFormError("El impuesto o comisión no puede ser negativo.");
      return;
    }

    const fromAccObj = accounts.find((a) => a.name === fromAccount);
    const toAccObj = accounts.find((a) => a.name === toAccount);

    if (editingMovement) {
      const updated: Partial<MovementItem> = {
        fromAccount,
        fromAccountId: fromAccObj?.id,
        toAccount,
        toAccountId: toAccObj?.id,
        amount: parsedAmount,
        taxAmount: parsedTax,
        description: description || `Traspaso de ${fromAccount} a ${toAccount}`,
      };
      setMovements((prev) =>
        prev.map((m) => (m.id === editingMovement.id ? { ...m, ...updated } : m))
      );
      await updateMovementApi(editingMovement.id, updated);
    } else {
      const created = await createMovementApi({
        fromAccount,
        fromAccountId: fromAccObj?.id,
        toAccount,
        toAccountId: toAccObj?.id,
        amount: parsedAmount,
        taxAmount: parsedTax,
        description: description || `Traspaso de ${fromAccount} a ${toAccount}`,
        date: new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
          day: "numeric",
          month: "short",
        }),
      });
      setMovements((prev) => [created, ...prev]);
    }

    if (initialDraft?.notifId) {
      await markNotificationProcessedApi(initialDraft.notifId);
      if (onClearDraft) onClearDraft();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingMovement(null);
  };

  const handleDeleteMovement = async (id: string) => {
    if (confirm("¿Deseas revertir y eliminar este traspaso? Los saldos de ambas cuentas y presupuestos serán restaurados.")) {
      setMovements((prev) => prev.filter((m) => m.id !== id));
      await deleteMovementApi(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      setIsModalOpen(false);
      setEditingMovement(null);
    }
  };

  // Filtrado
  const filteredMovements = movements.filter((m) => {
    if (
      selectedAccountFilter !== "all" &&
      m.fromAccount.toLowerCase() !== selectedAccountFilter.toLowerCase() &&
      m.toAccount.toLowerCase() !== selectedAccountFilter.toLowerCase()
    ) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchFrom = m.fromAccount.toLowerCase().includes(q);
      const matchTo = m.toAccount.toLowerCase().includes(q);
      if (!matchDesc && !matchFrom && !matchTo) return false;
    }
    return true;
  });

  const totalTransferred = movements.reduce((sum, m) => sum + m.amount, 0);
  const totalTaxes = movements.reduce((sum, m) => sum + (m.taxAmount || 0), 0);

  const numAmount = parseFloat(amount) || 0;
  const numTax = parseFloat(taxAmount) || 0;
  const totalDebitedPreview = numAmount + numTax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <span>Movimientos & Traspasos</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Transfiere dinero entre tus cuentas, calcula impuestos bancarios y sincroniza con tu presupuesto.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Nuevo Traspaso</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Transferred */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Traspasado</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            ${totalTransferred.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {movements.length} traspasos registrados
          </div>
        </div>

        {/* Total Taxes Paid */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Impuestos / Comisiones</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600">
            ${totalTaxes.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            Retenciones debitadas en origen
          </div>
        </div>

        {/* Synchronized State */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Integración Presupuestaria</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            Automatizada
          </div>
          <div className="text-[11px] text-zinc-400">
            Asiento automático en límite de Impuestos
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto o cuenta..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Account Filter */}
          {accounts.length > 0 && (
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs font-semibold focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
            >
              <option value="all">Todas las Cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Movements Transfer List */}
        <div className="divide-y divide-zinc-100 pt-2">
          {filteredMovements.map((item) => (
            <div
              key={item.id}
              onClick={() => openEditModal(item)}
              className="py-4 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700">
                      {item.description}
                    </span>
                    <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      De: {item.fromAccount}
                    </span>
                    <span>➔</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      A: {item.toAccount}
                    </span>
                    {item.taxAmount && item.taxAmount > 0 ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        +${item.taxAmount.toFixed(2)} Impuesto
                      </span>
                    ) : null}
                    <span>•</span>
                    <span className="text-zinc-400">{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-zinc-950">
                  ${item.amount.toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {item.taxAmount && item.taxAmount > 0
                    ? `Salen $${(item.amount + item.taxAmount).toFixed(2)}`
                    : "Traspaso exacto"}
                </div>
              </div>
            </div>
          ))}

          {filteredMovements.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {movements.length === 0 ? "Sin traspasos registrados" : "No hay movimientos con estos filtros"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {movements.length === 0
                  ? "Realiza transferencias entre tus cuentas bancarias, fondos de ahorro o retiros a efectivo."
                  : "Prueba seleccionando otra cuenta o limpiando el campo de búsqueda."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Traspaso / Transferencia */}
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
                  {editingMovement ? "Editar Traspaso entre Cuentas" : "Nuevo Traspaso entre Cuentas"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveMovement} className="space-y-4">
                {/* From Account */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Cuenta Origen (Se debitará el dinero)
                  </label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} ({a.type} - Saldo: ${a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Account */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Cuenta Destino (Se acreditará el dinero)
                  </label>
                  <select
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} ({a.type} - Saldo: ${a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Tax Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Monto a Transferir ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 flex items-center justify-between">
                      <span>Impuesto / Comisión ($)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Opcional</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* Accounting Preview Card */}
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/70 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Desglose Contable
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>Sale de {fromAccount || "Origen"}:</span>
                    <span className="font-bold text-rose-600">
                      -${totalDebitedPreview.toFixed(2)}
                      {numTax > 0 && ` (Incluye $${numTax.toFixed(2)} imp.)`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>Llega a {toAccount || "Destino"}:</span>
                    <span className="font-bold text-emerald-600">+${numAmount.toFixed(2)}</span>
                  </div>
                  {numTax > 0 && (
                    <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-200/60">
                      ℹ️ Si tienes un presupuesto con límite para &quot;Impuestos&quot;, se registrará el asiento correspondiente automáticamente.
                    </div>
                  )}
                </div>

                {/* Concept / Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Concepto / Motivo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Retiro para gastos corrientes, Traslado a fondo de ahorro..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  {editingMovement ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteMovement(editingMovement.id)}
                      className="flex items-center gap-1 py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revertir & Eliminar</span>
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
                      {editingMovement ? "Actualizar Traspaso" : "Confirmar Traspaso"}
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
