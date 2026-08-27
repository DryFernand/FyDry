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
} from "lucide-react";
import { DashboardTab } from "./types";
import DashboardHome from "./views/DashboardHome";
import MovementsView from "./views/MovementsView";
import AccountsView from "./views/AccountsView";
import ExpensesView from "./views/ExpensesView";
import IncomesView from "./views/IncomesView";
import BudgetView from "./views/BudgetView";
import DebtsView from "./views/DebtsView";
import ReportsView from "./views/ReportsView";
import SettingsModal from "./SettingsModal";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeftRight } from "lucide-react";

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
    }
    router.push("/login");
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs mx-auto shadow-xs">
            FD
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-zinc-900 mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">FyDry Secure Access...</p>
        </motion.div>
      </div>
    );
  }

  const userInitials =
    currentUser?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "FD";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={currentUser?.full_name || "Fernando Gómez"}
        userEmail={currentUser?.email || "daryfernand7@gmail.com"}
      />

      {/* Desktop Sidebar (Fija a la ventana h-screen sticky top-0 con ancho adaptable) */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex bg-white border-r border-zinc-200/80 flex-col justify-between p-4 shrink-0 h-screen sticky top-0 overflow-y-auto print:hidden z-20 shadow-2xs"
      >
        <div className="space-y-6">
          {/* Logo Brand & Collapse Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                FD
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <span className="font-bold text-sm tracking-tight text-zinc-950 block truncate">
                    {t.brand.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 block -mt-0.5 truncate">
                    {t.brand.tagline}
                  </span>
                </motion.div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-600 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-950 text-white cursor-pointer"
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
            {activeTab === "movements" && <MovementsView />}
            {activeTab === "accounts" && <AccountsView />}
            {activeTab === "expenses" && <ExpensesView />}
            {activeTab === "incomes" && <IncomesView />}
            {activeTab === "budget" && <BudgetView />}
            {activeTab === "debts" && <DebtsView />}
            {activeTab === "reports" && <ReportsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
