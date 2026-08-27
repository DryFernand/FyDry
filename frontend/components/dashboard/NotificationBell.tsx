"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Check,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  ShieldAlert,
  PieChart,
  ArrowDownCircle,
} from "lucide-react";
import { NotificationItem } from "./types";
import {
  fetchNotificationsApi,
  checkFinancialAlertsApi,
  markNotificationReadApi,
  deleteNotificationApi,
} from "@/lib/api";
import {
  requestSystemNotificationPermission,
  dispatchNativeAlerts,
} from "@/lib/pushNotifications";

interface NotificationBellProps {
  onOpenDraft: (item: NotificationItem) => void;
  notifications?: NotificationItem[];
  onRefresh?: () => void;
}

export default function NotificationBell({
  onOpenDraft,
  notifications: externalNotifications,
  onRefresh,
}: NotificationBellProps) {
  const [internalNotifications, setInternalNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = externalNotifications || internalNotifications;

  const loadNotificationsAndCheckAlerts = async () => {
    if (externalNotifications) {
      if (onRefresh) onRefresh();
      return;
    }
    // Chequeo de alertas automáticas
    const alerts = await checkFinancialAlertsApi();
    const activeAlerts = alerts.filter((n) => !n.isProcessed);
    setInternalNotifications(activeAlerts);
    dispatchNativeAlerts(activeAlerts);
  };

  useEffect(() => {
    if (!externalNotifications) {
      loadNotificationsAndCheckAlerts();
      window.addEventListener("fydry_storage_updated", loadNotificationsAndCheckAlerts);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (!externalNotifications) {
        window.removeEventListener("fydry_storage_updated", loadNotificationsAndCheckAlerts);
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [externalNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenDraft = async (item: NotificationItem) => {
    await markNotificationReadApi(item.id);
    if (!externalNotifications) {
      setInternalNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
    onOpenDraft(item);
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!externalNotifications) {
      setInternalNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    await deleteNotificationApi(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
  };

  const handleEnableSystemNotifications = async () => {
    const granted = await requestSystemNotificationPermission();
    if (granted) {
      dispatchNativeAlerts(notifications);
    }
  };

  const getItemIcon = (item: NotificationItem) => {
    if (item.targetType === "budget") {
      return <PieChart className="w-4 h-4 text-purple-600" />;
    }
    if (item.title.includes("corte")) {
      return <Calendar className="w-4 h-4 text-indigo-600" />;
    }
    if (item.title.includes("pago") || item.title.includes("límite de pago")) {
      return <Clock className="w-4 h-4 text-amber-600" />;
    }
    if (item.title.includes("Sobregiro")) {
      return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    }
    if (item.title.includes("mínimo")) {
      return <ArrowDownCircle className="w-4 h-4 text-orange-600" />;
    }
    if (item.targetType === "income") {
      return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
    }
    if (item.targetType === "movement") {
      return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowDownRight className="w-4 h-4 text-rose-600" />;
  };

  const getItemBadgeBg = (item: NotificationItem) => {
    if (item.targetType === "budget") return "bg-purple-50";
    if (item.title.includes("corte")) return "bg-indigo-50";
    if (item.title.includes("pago")) return "bg-amber-50";
    if (item.title.includes("Sobregiro")) return "bg-rose-50";
    if (item.title.includes("mínimo")) return "bg-orange-50";
    if (item.targetType === "income") return "bg-emerald-50";
    if (item.targetType === "movement") return "bg-blue-50";
    return "bg-rose-50";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de Campanita */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-950 transition-all cursor-pointer border border-zinc-200/60 flex items-center justify-center"
        title="Notificaciones y alertas financieras"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Menú desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-zinc-200 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-zinc-950">
                  Alertas y Notificaciones
                </h3>
              </div>

              {typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && (
                <button
                  type="button"
                  onClick={handleEnableSystemNotifications}
                  className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer underline"
                >
                  Activar en PC y Celular
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDraft(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-zinc-50 transition-colors cursor-pointer group ${
                    !item.isRead ? "bg-purple-50/20" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${getItemBadgeBg(item)}`}
                  >
                    {getItemIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-1">
                      <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-1 group-hover:underline">
                        <span>{item.source === "system" ? "Ver Detalle" : "Revisar & Asentar"}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, item.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Descartar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="py-10 text-center px-4 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-zinc-900">Sin alertas pendientes</div>
                  <p className="text-[11px] text-zinc-400 max-w-[220px] mx-auto">
                    Tus tarjetas, presupuestos y saldos de cuentas están en orden.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
