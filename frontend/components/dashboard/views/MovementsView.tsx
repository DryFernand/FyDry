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
  PiggyBank,
  Filter,
} from "lucide-react";
import { MovementItem, AccountItem } from "../types";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchMovementsApi,
  createMovementApi,
  updateMovementApi,
  deleteMovementApi,
  fetchAccountsApi,
  fetchUserSettingsApi,
  markNotificationProcessedApi,
} from "@/lib/api";
import { getCycleRange, isTransactionInPeriod } from "@/lib/cycle";
import { availableFunds, formatMoney, isLiability, parseAmount, todayISO } from "@/lib/money";
import ConfirmDialog, { useEscapeKey } from "../ConfirmDialog";
import MoneyInput from "@/components/ui/MoneyInput";
import ScreenSkeleton from "../ScreenSkeleton";

type MovementFilterType = "all" | "savings" | "standard";

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
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [budgetResetDay, setBudgetResetDay] = useState<number>(1);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");
  const [movementFilter, setMovementFilter] = useState<MovementFilterType>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementItem | null>(null);

  // Form State
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  useEscapeKey(isModalOpen, () => setIsModalOpen(false));
  const mainCurrency = accounts[0]?.currency || "DOP";

  const loadData = async () => {
    const [movData, accData, settingsData] = await Promise.all([
      fetchMovementsApi(),
      fetchAccountsApi(),
      fetchUserSettingsApi(),
    ]);
    setMovements(movData);
    setAccounts(accData);
    if (settingsData?.budget_reset_day !== undefined && settingsData.budget_reset_day !== null) {
      setBudgetResetDay(settingsData.budget_reset_day);
    }
    if (accData.length >= 2) {
      setFromAccount((prev) => prev || accData[0].name);
      setToAccount((prev) => prev || (accData.filter((a) => !isLiability(a))[1] || accData[1]).name);
    } else if (accData.length === 1) {
      setFromAccount((prev) => prev || accData[0].name);
      setToAccount((prev) => prev || accData[0].name);
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    window.addEventListener("fydry_storage_updated", loadData);
    window.addEventListener("fydry_refresh_data", loadData);
    return () => {
      window.removeEventListener("fydry_storage_updated", loadData);
      window.removeEventListener("fydry_refresh_data", loadData);
    };
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

  // Rango del ciclo mensual activo
  const cycleRange = getCycleRange(new Date(), budgetResetDay);

  // Etiqueta de mes: solo nombre capitalizado; añade año si difiere del actual
  const cycleYear = cycleRange.startDate.getFullYear();
  const monthRaw = cycleRange.startDate.toLocaleDateString(
    (language as string) === "en" ? "en-US" : "es-ES",
    { month: "long" }
  );
  const monthCap = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const monthLabel = cycleYear !== new Date().getFullYear() ? `${monthCap} ${cycleYear}` : monthCap;

  // Movimientos que pertenecen estrictamente al mes / ciclo actual
  const currentCycleMovements = movements.filter((m) =>
    isTransactionInPeriod(m as any, cycleRange.startDate, cycleRange.endDate)
  );
  const totalTransferredThisMonth = currentCycleMovements.reduce((sum, m) => sum + m.amount, 0);
  const totalTaxesThisMonth = currentCycleMovements.reduce((sum, m) => sum + (m.taxAmount || 0), 0);

  const savingsMovementsCount = movements.filter((m) =>
    accounts.some((a) => a.type === "savings" && (a.name === m.toAccount || a.id === m.toAccountId))
  ).length;
  const standardMovementsCount = movements.length - savingsMovementsCount;

  const openCreateModal = () => {
    setEditingMovement(null);
    setAmount("");
    setTaxAmount("");
    setToAmount("");
    setDescription("");
    setFormError("");
    if (accounts.length >= 2) {
      setFromAccount(accounts[0].name);
      setToAccount((accounts.filter((a) => !isLiability(a))[1] || accounts[1]).name);
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
    setToAmount(mov.toAmount != null ? mov.toAmount.toString() : "");
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

    const parsedAmount = parseAmount(amount);
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Ingresa un monto de transferencia válido mayor a 0.");
      return;
    }

    const parsedTax = taxAmount ? parseAmount(taxAmount) : 0.0;
    if (isNaN(parsedTax) || !isFinite(parsedTax) || parsedTax < 0) {
      setFormError("El impuesto no puede ser negativo o inválido.");
      return;
    }

    const fromAccObj = accounts.find((a) => a.name === fromAccount);
    const toAccObj = accounts.find((a) => a.name === toAccount);

    const crossCurrency =
      !!fromAccObj && !!toAccObj && (fromAccObj.currency || "DOP") !== (toAccObj.currency || "DOP");
    const parsedToAmount = crossCurrency ? parseAmount(toAmount) : undefined;
    if (parsedToAmount !== undefined && (isNaN(parsedToAmount) || !isFinite(parsedToAmount) || parsedToAmount <= 0)) {
      setFormError(`Ingresa el monto recibido en destino (${toAccObj?.currency}) mayor a 0.`);
      return;
    }

    if (fromAccObj) {
      // Al editar desde la misma cuenta, el traspaso anterior (monto + impuesto) se revierte primero.
      const funds =
        editingMovement && editingMovement.fromAccount === fromAccObj.name
          ? availableFunds(fromAccObj) + editingMovement.amount + (editingMovement.taxAmount || 0)
          : availableFunds(fromAccObj);
      if (funds !== Infinity && parsedAmount + parsedTax > funds) {
        setFormError(
          `Traspaso rechazado: El monto total con impuestos (${formatMoney(parsedAmount + parsedTax, fromAccObj.currency)}) supera el saldo disponible más el sobregiro permitido (${formatMoney(funds, fromAccObj.currency)}) de "${fromAccObj.name}".`
        );
        return;
      }
    }

    try {
      if (editingMovement) {
        const updated: Partial<MovementItem> = {
          fromAccount,
          fromAccountId: fromAccObj?.id,
          toAccount,
          toAccountId: toAccObj?.id,
          amount: parsedAmount,
          toAmount: parsedToAmount,
          taxAmount: parsedTax,
          description: description || `Traspaso de ${fromAccount} a ${toAccount}`,
        };
        await updateMovementApi(editingMovement.id, updated);
        setMovements((prev) =>
          prev.map((m) => (m.id === editingMovement.id ? { ...m, ...updated } : m))
        );
      } else {
        const created = await createMovementApi({
          fromAccount,
          fromAccountId: fromAccObj?.id,
          toAccount,
          toAccountId: toAccObj?.id,
          amount: parsedAmount,
          toAmount: parsedToAmount,
          taxAmount: parsedTax,
          description: description || `Traspaso de ${fromAccount} a ${toAccount}`,
          date: initialDraft?.date || todayISO(),
        });
        setMovements((prev) => [created, ...prev]);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el traspaso.");
      return;
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

  const handleDeleteMovement = (id: string) => setPendingDeleteId(id);

  const deleteMovementConfirmed = async (id: string) => {
    setFormError("");
    try {
      await deleteMovementApi(id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo eliminar el traspaso.");
      return;
    }
    setMovements((prev) => prev.filter((m) => m.id !== id));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setIsModalOpen(false);
    setEditingMovement(null);
  };

  // Filtrado de toda la tabla para búsqueda y tipo de movimiento
  const filteredMovements = movements.filter((m) => {
    // Filtro por naturaleza de traspaso (all | savings | standard)
    if (movementFilter === "savings") {
      const isSavings = accounts.some(
        (a) => a.type === "savings" && (a.name === m.toAccount || a.id === m.toAccountId)
      );
      if (!isSavings) return false;
    } else if (movementFilter === "standard") {
      const isSavings = accounts.some(
        (a) => a.type === "savings" && (a.name === m.toAccount || a.id === m.toAccountId)
      );
      if (isSavings) return false;
    }

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

  const numAmount = parseAmount(amount) || 0;
  const numTax = parseAmount(taxAmount) || 0;
  const totalDebitedPreview = numAmount + numTax;

  const fromAccObj = accounts.find((a) => a.name === fromAccount);
  const toAccObj = accounts.find((a) => a.name === toAccount);
  const isCrossCurrency =
    !!fromAccObj && !!toAccObj && (fromAccObj.currency || "DOP") !== (toAccObj.currency || "DOP");
  const numReceived = isCrossCurrency ? parseAmount(toAmount) || 0 : numAmount;
  // Tarjetas: el saldo es consumo (sube al pagar desde ella, baja al recibir un pago)
  const fromBalanceAfter = fromAccObj ? fromAccObj.balance + (isLiability(fromAccObj) ? totalDebitedPreview : -totalDebitedPreview) : 0;
  const toBalanceAfter = toAccObj ? toAccObj.balance + (isLiability(toAccObj) ? -numReceived : numReceived) : 0;
  const fromCur = fromAccObj?.currency || mainCurrency;
  const toCur = toAccObj?.currency || mainCurrency;

  if (loading) return <ScreenSkeleton screen="movements" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
              <span>Movimientos & Traspasos</span>
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/60">
              {monthLabel}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Transfiere dinero entre tus cuentas, calcula impuestos bancarios y sincroniza con tu presupuesto.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Nuevo Traspaso</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Transferred This Month */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Traspasado</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            {formatMoney(totalTransferredThisMonth, mainCurrency)}
          </div>
          <div className="text-[11px] text-zinc-400">
            {currentCycleMovements.length} traspasos este ciclo • {movements.length} en historial
          </div>
        </div>

        {/* Total Taxes Paid This Month */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Impuesto</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            {formatMoney(totalTaxesThisMonth, mainCurrency)}
          </div>
          <div className="text-[11px] text-zinc-400">
            Retenciones debitadas este ciclo
          </div>
        </div>

        {/* Reset Day info */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Reinicio de Presupuesto</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950">
            Día {budgetResetDay}
          </div>
          <div className="text-[11px] text-zinc-400">
            Se reinicia cada mes el día {budgetResetDay}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        {/* Pastillas / Tabs de Naturaleza de Traspaso */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-zinc-100">
          <button
            type="button"
            onClick={() => setMovementFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              movementFilter === "all"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
            }`}
          >
            Todos ({movements.length})
          </button>
          <button
            type="button"
            onClick={() => setMovementFilter("savings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              movementFilter === "savings"
                ? "bg-green-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Hacia Ahorro ({savingsMovementsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setMovementFilter("standard")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              movementFilter === "standard"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
            }`}
          >
            Entre Cuentas ({standardMovementsCount})
          </button>
        </div>

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

          {/* Filtros (naturaleza de traspaso) */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-500">Filtros</span>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value as MovementFilterType)}
              className="bg-transparent text-zinc-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="savings">Ahorro</option>
              <option value="standard">Estándar</option>
            </select>
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
                  {a.name} · {formatMoney(availableFunds(a), a.currency)}
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
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700 truncate">
                      {item.description}
                    </span>
                    <Edit3 className="hidden sm:inline w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <div className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="hidden sm:inline font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-md">
                      De: {item.fromAccount}
                    </span>
                    <span className="hidden sm:inline text-zinc-400">➔</span>
                    <span className="hidden sm:inline font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-md">
                      A: {item.toAccount}
                    </span>
                    {item.taxAmount && item.taxAmount > 0 ? (
                      <span className="hidden sm:inline font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-md">
                        +{formatMoney(item.taxAmount, accounts.find((a) => a.name === item.fromAccount)?.currency || mainCurrency)} Impuesto
                      </span>
                    ) : null}
                    <span className="hidden sm:inline">•</span>
                    <span className="text-zinc-400">{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="text-xs font-bold text-rose-600">
                  -{formatMoney(item.amount, accounts.find((a) => a.name === item.fromAccount)?.currency || mainCurrency)}
                </div>
                <div className="hidden sm:block text-[10px] text-zinc-400">
                  {item.taxAmount && item.taxAmount > 0
                    ? `Salen ${formatMoney((item.amount + item.taxAmount), accounts.find((a) => a.name === item.fromAccount)?.currency || mainCurrency)}`
                    : "Traspaso exacto"}
                </div>
              </div>
            </div>
          ))}

          {filteredMovements.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                {movementFilter === "savings" ? (
                  <PiggyBank className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowLeftRight className="w-5 h-5" />
                )}
              </div>
              <div className="text-xs font-semibold text-zinc-700">
                {movements.length === 0
                  ? "Sin traspasos registrados"
                  : movementFilter === "savings"
                  ? "No hay traspasos hacia cuentas de ahorro"
                  : movementFilter === "standard"
                  ? "No hay traspasos entre cuentas estándar"
                  : "No hay movimientos con estos filtros"}
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {movements.length === 0
                  ? "Realiza transferencias entre tus cuentas bancarias, fondos de ahorro o retiros a efectivo."
                  : movementFilter === "savings"
                  ? "Aún no has registrado traspasos con destino a cuentas o fondos de ahorro."
                  : movementFilter === "standard"
                  ? "No se encontraron movimientos entre cuentas estándar con los filtros aplicados."
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="movement-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 id="movement-modal-title" className="text-lg font-bold text-zinc-950">
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
                        {a.name} · {formatMoney(availableFunds(a), a.currency)}
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
                    {accounts.filter((a) => !isLiability(a)).map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} · {formatMoney(availableFunds(a), a.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Tax Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Monto a Transferir
                    </label>
                    <MoneyInput
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 flex items-center justify-between">
                      <span>Impuesto</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Opcional</span>
                    </label>
                    <MoneyInput
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {isCrossCurrency && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      Monto recibido en destino ({toAccObj?.currency})
                    </label>
                    <MoneyInput
                      required
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs"
                    />
                  </div>
                )}

                {/* Accounting Preview Card */}
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/70 text-xs space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Desglose Contable
                  </div>

                  {/* Origen */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-zinc-700">
                      <span>Sale de {fromAccount || "Origen"}:</span>
                      <span className="font-bold text-rose-600">
                        -{formatMoney(totalDebitedPreview, fromCur)}
                        {numTax > 0 && ` (Incluye ${formatMoney(numTax, fromCur)} imp.)`}
                      </span>
                    </div>
                    {fromAccObj && (
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>Saldo tras traspaso:</span>
                        <span className={`font-semibold ${fromBalanceAfter < 0 ? "text-amber-600" : "text-zinc-700"}`}>
                          {formatMoney(fromBalanceAfter, fromCur)}
                        </span>
                      </div>
                    )}
                    {fromAccObj && fromBalanceAfter < 0 && (
                      <div className="text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 font-medium mt-1">
                        ⚠️ Uso de margen de sobregiro ({formatMoney(Math.abs(fromBalanceAfter), fromCur)})
                      </div>
                    )}
                  </div>

                  {/* Destino */}
                  <div className="space-y-0.5 pt-1.5 border-t border-zinc-200/60">
                    <div className="flex justify-between text-zinc-700">
                      <span>Llega a {toAccount || "Destino"}:</span>
                      <span className="font-bold text-green-600">+{formatMoney(numReceived, toCur)}</span>
                    </div>
                    {toAccObj && (
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>Saldo tras traspaso:</span>
                        <span className="font-semibold text-zinc-700">
                          {formatMoney(toBalanceAfter, toCur)}
                        </span>
                      </div>
                    )}
                  </div>

                  {numTax > 0 && (
                    <div className="text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-200/60">
                      ℹ️ Si tienes un presupuesto con límite para &quot;Impuestos&quot;, se registrará el asiento correspondiente automáticamente.
                    </div>
                  )}
                </div>

                {/* Concept / Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Concepto (Opcional)
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
                      <span>Revertir</span>
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
                      className="py-2.5 px-4 rounded-xl bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      {editingMovement ? "Actualizar" : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        message="¿Deseas revertir y eliminar este traspaso? Los saldos de ambas cuentas y presupuestos serán restaurados."
        confirmLabel={language === "en" ? "Revert and delete" : "Revertir y eliminar"}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) deleteMovementConfirmed(id);
        }}
      />
    </div>
  );
}
