"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Home,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  ShieldAlert,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { DashboardTab, NotificationItem } from "./types";
import DashboardHome from "./views/DashboardHome";
import MovementsView from "./views/MovementsView";
import AccountsView from "./views/AccountsView";
import ExpensesView from "./views/ExpensesView";
import IncomesView from "./views/IncomesView";
import BudgetView from "./views/BudgetView";
import DebtsView from "./views/DebtsView";
import ReportsView from "./views/ReportsView";
import SettingsModal from "./SettingsModal";
import NotificationBell from "./NotificationBell";
import { apiRequest, checkFinancialAlertsApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { dispatchNativeAlerts } from "@/lib/pushNotifications";

export default function DashboardLayout() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    full_name?: string;
    email?: string;
  } | null>(null);

  // Borrador activo seleccionado desde una notificación de correo o alerta
  const [activeDraft, setActiveDraft] = useState<{
    notifId: string;
    targetType: "expense" | "income" | "movement" | "budget" | "account";
    amount?: number;
    description?: string;
    category?: string;
    from_account_name?: string;
    to_account_name?: string;
    date?: string;
  } | null>(null);

  const navItems = [
    { id: "home" as DashboardTab, label: t.nav.home, icon: Home },
    { id: "movements" as DashboardTab, label: t.nav.movements, icon: ArrowLeftRight },
    { id: "accounts" as DashboardTab, label: t.nav.accounts, icon: CreditCard },
    { id: "expenses" as DashboardTab, label: t.nav.expenses, icon: ArrowDownRight },
    { id: "incomes" as DashboardTab, label: t.nav.incomes, icon: ArrowUpRight },
    { id: "budget" as DashboardTab, label: t.nav.budget, icon: PieChart },
    { id: "debts" as DashboardTab, label: t.nav.debts, icon: ShieldAlert },
    { id: "reports" as DashboardTab, label: t.nav.reports, icon: FileText },
  ];

  // Carga centralizada de alertas y despacho único de notificaciones push
  const loadGlobalNotifications = async () => {
    try {
      const alerts = await checkFinancialAlertsApi();
      const active = alerts.filter((n) => !n.isProcessed);
      setNotifications(active);
      dispatchNativeAlerts(active);
    } catch (err) {
      console.warn("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    loadGlobalNotifications();
    window.addEventListener("fydry_storage_updated", loadGlobalNotifications);
    return () => window.removeEventListener("fydry_storage_updated", loadGlobalNotifications);
  }, []);

  // Auth Guard con Carga Optimista Instantánea (Cero bloqueos al refrescar)
  useEffect(() => {
    async function verifyAuth() {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("fydry_token") || localStorage.getItem("fydry_access_token");
      if (!token) {
        setIsLoadingAuth(false);
        router.push("/login");
        return;
      }

      // 1. Carga optimista inmediata desde localStorage para desbloquear UI en 0ms
      const cachedUserRaw = localStorage.getItem("fydry_user");
      if (cachedUserRaw) {
        try {
          setCurrentUser(JSON.parse(cachedUserRaw));
        } catch {}
      } else {
        setCurrentUser({
          full_name: "Usuario FyDry",
          email: "usuario@fydry.io",
        });
      }
      setIsLoadingAuth(false);

      // 2. Revalidación en segundo plano con timeout de 3.5s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await apiRequest("/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.data?.id) {
          setCurrentUser(res.data);
          localStorage.setItem("fydry_user", JSON.stringify(res.data));
        } else if (res.status === 401) {
          localStorage.removeItem("fydry_token");
          localStorage.removeItem("fydry_access_token");
          localStorage.removeItem("fydry_user");
          router.push("/login");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn("Background auth revalidation skipped (using cached session):", err);
      }
    }

    verifyAuth();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fydry_token");
      localStorage.removeItem("fydry_access_token");
      localStorage.removeItem("fydry_user");
    }
    router.push("/login");
  };

  const handleOpenDraft = (item: NotificationItem) => {
    setActiveDraft({
      notifId: item.id,
      targetType: item.targetType,
      ...item.draftData,
    });
    if (item.targetType === "budget") {
      setActiveTab("budget");
    } else if (item.targetType === "account") {
      setActiveTab("accounts");
    } else if (item.targetType === "income") {
      setActiveTab("incomes");
    } else if (item.targetType === "movement") {
      setActiveTab("movements");
    } else {
      setActiveTab("expenses");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-md">
            FD
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
            <span>Cargando tu espacio financiero...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 antialiased font-sans text-zinc-900">
      {/* Desktop Left Sidebar 100% Fijo, Estático y Siempre Visible Completo */}
      <aside className="hidden md:flex flex-col w-64 min-w-[256px] max-w-[256px] border-r border-zinc-200/80 bg-white h-screen h-dvh p-4 fixed top-0 left-0 bottom-0 z-30 print:hidden shrink-0 justify-between overflow-hidden">
        {/* Top: Brand Header & Nav */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-zinc-900/10 shadow-xs shrink-0">
              <Image
                src="/FyDry.jpeg"
                alt="FyDry Logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-zinc-950 truncate">
                {t.brand.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {t.brand.tagline}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setActiveDraft(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/70"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-950"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Card & Settings Fijo */}
        <div className="pt-3 border-t border-zinc-100 space-y-2 shrink-0">
          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/70 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 shrink-0 text-zinc-400" />
            <span className="truncate">{t.nav.settings}</span>
          </button>

          {/* User Profile Mini */}
          <div className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-900 truncate">
                  {currentUser?.full_name || "Usuario"}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  {currentUser?.email || "usuario@fydry.io"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title={t.nav.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-zinc-900/10 shrink-0">
            <Image
              src="/FyDry.jpeg"
              alt="FyDry Logo"
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="font-bold text-sm text-zinc-950">{t.brand.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Campanita de Notificaciones Mobile */}
          <NotificationBell
            onOpenDraft={handleOpenDraft}
            notifications={notifications}
            onRefresh={loadGlobalNotifications}
          />

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-2xl border border-zinc-200 text-zinc-600 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-zinc-950 text-white cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-x-0 top-15 z-40 bg-white border-b border-zinc-200 p-4 shadow-xl space-y-2 print:hidden"
          >
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setActiveDraft(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-zinc-100 space-y-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area con md:pl-64 para que el contenido fluya con el scroll de la página de forma totalmente independiente */}
      <div className="flex-1 min-w-0 flex flex-col md:pl-64">
        {/* Desktop Top Bar with NotificationBell */}
        <div className="hidden md:flex items-center justify-end px-6 lg:px-8 pt-6 pb-2 print:hidden">
          <div className="flex items-center gap-3">
            <NotificationBell
              onOpenDraft={handleOpenDraft}
              notifications={notifications}
              onRefresh={loadGlobalNotifications}
            />
          </div>
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "home" && <DashboardHome onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === "movements" && <MovementsView initialDraft={activeDraft?.targetType === "movement" ? activeDraft : null} onClearDraft={() => setActiveDraft(null)} />}
              {activeTab === "accounts" && <AccountsView />}
              {activeTab === "expenses" && <ExpensesView initialDraft={activeDraft?.targetType === "expense" ? activeDraft : null} onClearDraft={() => setActiveDraft(null)} />}
              {activeTab === "incomes" && <IncomesView initialDraft={activeDraft?.targetType === "income" ? activeDraft : null} onClearDraft={() => setActiveDraft(null)} />}
              {activeTab === "budget" && <BudgetView />}
              {activeTab === "debts" && <DebtsView />}
              {activeTab === "reports" && <ReportsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
