"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronLeft,
  ChevronRight,
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
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardLayout() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    full_name?: string;
    email?: string;
  } | null>(null);

  // Borrador activo seleccionado desde una notificación de correo
  const [activeDraft, setActiveDraft] = useState<{
    notifId: string;
    targetType: "expense" | "income" | "movement";
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

  // Auth Guard
  useEffect(() => {
    async function verifyAuth() {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("fydry_token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const res = await apiRequest("/auth/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.data?.id) {
            setCurrentUser(res.data);
            if (typeof window !== "undefined") {
              localStorage.setItem("fydry_user", JSON.stringify(res.data));
            }
          } else {
            localStorage.removeItem("fydry_token");
            localStorage.removeItem("fydry_access_token");
            router.push("/login");
            return;
          }
        } catch {
          const cachedUser = typeof window !== "undefined" ? localStorage.getItem("fydry_user") : null;
          if (cachedUser) {
            try {
              setCurrentUser(JSON.parse(cachedUser));
            } catch {}
          } else {
            setCurrentUser({
              full_name: "Usuario FyDry",
              email: "usuario@fydry.io",
            });
          }
        } finally {
          setIsLoadingAuth(false);
        }
      }
    }

    verifyAuth();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fydry_token");
      localStorage.removeItem("fydry_access_token");
    }
    router.push("/login");
  };

  const handleOpenDraft = (item: NotificationItem) => {
    setActiveDraft({
      notifId: item.id,
      targetType: item.targetType,
      ...item.draftData,
    });
    if (item.targetType === "income") {
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

  const userInitials =
    currentUser?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "FD";

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col md:flex-row text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col justify-between bg-white border-r border-zinc-200/80 p-4 sticky top-0 h-screen z-30 select-none shrink-0 print:hidden"
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                FD
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate font-bold text-base tracking-tight text-zinc-950">
                  {t.brand.name}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expandir" : "Colapsar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
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
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
                  } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Settings, Logout & User Profile */}
        <div className="pt-4 border-t border-zinc-100 space-y-1">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title={isSidebarCollapsed ? t.nav.settings : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer ${
              isSidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{t.nav.settings}</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title={isSidebarCollapsed ? t.nav.logout : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
              isSidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{t.nav.logout}</span>}
          </button>

          {/* User badge */}
          <div
            className={`pt-3 flex items-center gap-3 px-1 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-900 font-bold text-xs flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {currentUser?.full_name || "Fernando Gómez"}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {currentUser?.email || "daryfernand7@gmail.com"}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
            FD
          </div>
          <span className="font-bold text-sm text-zinc-950">{t.brand.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Campanita de Notificaciones Mobile */}
          <NotificationBell onOpenDraft={handleOpenDraft} />

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

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop Top Bar with NotificationBell */}
        <div className="hidden md:flex items-center justify-end px-6 lg:px-8 pt-6 pb-2 print:hidden">
          <div className="flex items-center gap-3">
            <NotificationBell onOpenDraft={handleOpenDraft} />
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
              {activeTab === "home" && (
                <DashboardHome onNavigate={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === "movements" && (
                <MovementsView
                  initialDraft={activeDraft?.targetType === "movement" ? activeDraft : null}
                  onClearDraft={() => setActiveDraft(null)}
                />
              )}
              {activeTab === "accounts" && <AccountsView />}
              {activeTab === "expenses" && (
                <ExpensesView
                  initialDraft={activeDraft?.targetType === "expense" ? activeDraft : null}
                  onClearDraft={() => setActiveDraft(null)}
                />
              )}
              {activeTab === "incomes" && (
                <IncomesView
                  initialDraft={activeDraft?.targetType === "income" ? activeDraft : null}
                  onClearDraft={() => setActiveDraft(null)}
                />
              )}
              {activeTab === "budget" && <BudgetView />}
              {activeTab === "debts" && <DebtsView />}
              {activeTab === "reports" && <ReportsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
