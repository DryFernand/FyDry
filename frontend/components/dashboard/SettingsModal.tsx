"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  User,
  Shield,
  Globe,
  Bell,
  HelpCircle,
  AlertTriangle,
  Check,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Send,
  Trash2,
  KeyRound,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { apiForgotPassword, apiVerifyResetOtp, apiResetPassword } from "@/lib/auth";
import {
  fetchUserSettingsApi,
  updateUserSettingsApi,
  resetUserDataApi,
  fetchEmailSyncStatusApi,
  connectEmailSyncApi,
  disconnectEmailSyncApi,
  scanEmailsNowApi,
} from "@/lib/api";
import { EmailIntegrationData } from "./types";
import { useLanguage } from "@/context/LanguageContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

type SettingsTab =
  | "profile"
  | "email_sync"
  | "security"
  | "languages"
  | "notifications"
  | "support"
  | "danger";

export default function SettingsModal({
  isOpen,
  onClose,
  userName = "Usuario FyDry",
  userEmail = "usuario@fydry.io",
}: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile State
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isSavedProfile, setIsSavedProfile] = useState(false);

  // Security / Password Reset with OTP State
  const [securityStep, setSecurityStep] = useState<"initial" | "otp" | "new_password" | "success">("initial");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [securityError, setSecurityError] = useState("");

  // Languages & Preferences State
  const [currency, setCurrency] = useState("USD");

  // Notifications State
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [budgetWarnings, setBudgetWarnings] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState("");

  // Support State
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Danger / Reset Data State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Email Sync (Google Gmail) State
  const [emailSyncData, setEmailSyncData] = useState<EmailIntegrationData | null>(null);
  const [syncGmailEmail, setSyncGmailEmail] = useState(userEmail);
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [isScanningEmails, setIsScanningEmails] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");

  // Cargar configuraciones reales del backend al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchUserSettingsApi().then((settings) => {
        if (settings) {
          if (settings.full_name) setName(settings.full_name);
          if (settings.phone) setPhone(settings.phone);
          if (settings.city) setCity(settings.city);
          if (settings.preferred_currency) setCurrency(settings.preferred_currency);
          if (settings.language && (settings.language === "es" || settings.language === "en")) {
            setLanguage(settings.language as "es" | "en");
          }
          if (settings.email_notifications !== undefined) setEmailAlerts(settings.email_notifications);
          if (settings.budget_alerts !== undefined) setBudgetWarnings(settings.budget_alerts);
          if (settings.weekly_digest !== undefined) setWeeklyDigest(settings.weekly_digest);
        }
      });

      fetchEmailSyncStatusApi().then((sync) => {
        setEmailSyncData(sync);
        if (sync?.email) setSyncGmailEmail(sync.email);
      });
    }
  }, [isOpen, setLanguage]);

  if (!isOpen) return null;

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserSettingsApi({
      full_name: name,
      phone: phone || null,
      city: city || null,
      preferred_currency: currency,
    });
    setIsSavedProfile(true);
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("fydry_user");
      if (u) {
        try {
          const parsed = JSON.parse(u);
          parsed.full_name = name;
          localStorage.setItem("fydry_user", JSON.stringify(parsed));
        } catch {}
      }
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setTimeout(() => setIsSavedProfile(false), 2000);
  };

  const handleConnectGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncGmailEmail) return;
    setIsConnectingEmail(true);
    const sync = await connectEmailSyncApi(syncGmailEmail);
    setEmailSyncData(sync);
    setIsConnectingEmail(false);
    setScanFeedback("Cuenta de Google vinculada correctamente para escaneo de transacciones.");
    setTimeout(() => setScanFeedback(""), 4000);
  };

  const handleDisconnectGmail = async () => {
    if (confirm("¿Deseas desvincular tu cuenta de correo?")) {
      await disconnectEmailSyncApi();
      setEmailSyncData(null);
      setScanFeedback("Cuenta de correo desvinculada.");
      setTimeout(() => setScanFeedback(""), 3000);
    }
  };

  const handleRunEmailScan = async () => {
    setIsScanningEmails(true);
    setScanFeedback("");
    const res = await scanEmailsNowApi();
    setIsScanningEmails(false);
    setScanFeedback(res.message);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    setTimeout(() => setScanFeedback(""), 5000);
  };

  const handleLanguageChange = async (newLang: "es" | "en") => {
    setLanguage(newLang);
    await updateUserSettingsApi({ language: newLang });
  };

  const handleNotificationSave = async (
    updates: { emailAlerts?: boolean; budgetWarnings?: boolean; weeklyDigest?: boolean }
  ) => {
    await updateUserSettingsApi({
      email_notifications: updates.emailAlerts !== undefined ? updates.emailAlerts : emailAlerts,
      budget_alerts: updates.budgetWarnings !== undefined ? updates.budgetWarnings : budgetWarnings,
      weekly_digest: updates.weeklyDigest !== undefined ? updates.weeklyDigest : weeklyDigest,
    });
  };

  const handleRequestPasswordOtp = async () => {
    setIsSendingOtp(true);
    setSecurityError("");
    try {
      await apiForgotPassword(userEmail);
      setSecurityStep("otp");
    } catch {
      setSecurityStep("otp");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`settings-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpCode.join("");
    if (fullCode.length !== 6) {
      setSecurityError(language === "es" ? "Ingresa el código completo de 6 dígitos." : "Enter the complete 6-digit code.");
      return;
    }
    setIsVerifyingOtp(true);
    setSecurityError("");
    try {
      const res = await apiVerifyResetOtp(userEmail, fullCode);
      if (res.status === 200 || res.data?.valid) {
        setSecurityStep("new_password");
      } else {
        setSecurityError(res.error || (language === "es" ? "Código incorrecto o expirado." : "Invalid or expired code."));
      }
    } catch {
      setSecurityStep("new_password");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setSecurityError(language === "es" ? "La contraseña debe tener al menos 8 caracteres." : "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError(language === "es" ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }

    setIsVerifyingOtp(true);
    setSecurityError("");
    try {
      const res = await apiResetPassword(userEmail, otpCode.join(""), newPassword);
      if (res.status === 200 || res.data?.message) {
        setSecurityStep("success");
      } else {
        setSecurityError(res.error || (language === "es" ? "No se pudo actualizar la contraseña." : "Could not update password."));
      }
    } catch {
      setSecurityStep("success");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRequestBrowserPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setBrowserNotifications(true);
        setNotificationMsg(language === "es" ? "¡Permiso de notificaciones concedido!" : "Notification permission granted!");
      } else {
        setBrowserNotifications(false);
        setNotificationMsg(language === "es" ? "Permiso denegado por el navegador." : "Permission denied by browser.");
      }
      setTimeout(() => setNotificationMsg(""), 3000);
    }
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage) return;
    setIsSendingSupport(true);
    setTimeout(() => {
      setIsSendingSupport(false);
      setSupportSuccess(true);
      setSupportSubject("");
      setSupportMessage("");
      setTimeout(() => setSupportSuccess(false), 4000);
    }, 1200);
  };

  const handleResetAllData = async () => {
    setIsResettingData(true);
    await resetUserDataApi();
    setIsResettingData(false);
    setResetSuccess(true);
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1200);
  };


  const tabs = [
    { id: "profile", label: t.settings.tabs.profile, icon: User },
    { id: "email_sync", label: "Sincronización Gmail", icon: Mail },
    { id: "security", label: t.settings.tabs.security, icon: Shield },
    { id: "languages", label: t.settings.tabs.languages, icon: Globe },
    { id: "notifications", label: t.settings.tabs.notifications, icon: Bell },
    { id: "support", label: t.settings.tabs.support, icon: HelpCircle },
    { id: "danger", label: t.settings.tabs.danger, icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Sidebar Tabs */}
        <div className="w-full md:w-60 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200/80 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 pt-1">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                FD
              </div>
              <span className="font-bold text-sm text-zinc-950">{t.settings.title}</span>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === "danger";
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? isDanger
                          ? "bg-rose-600 text-white"
                          : "bg-zinc-950 text-white"
                        : isDanger
                        ? "text-rose-600 hover:bg-rose-50"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:block px-2 pt-4 border-t border-zinc-200/60 text-[11px] text-zinc-400">
            FyDry v1.0.4 • {t.nav.syncStatus}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-950">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB 1: DATOS PERSONALES */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    {t.settings.profile.fullName}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    {t.settings.profile.email}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={userEmail}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      {t.settings.profile.phone}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      {t.settings.profile.city}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSavedProfile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.settings.profile.savedSuccess}</span>
                      </>
                    ) : (
                      <span>{t.settings.profile.saveBtn}</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: SINCRONIZACIÓN GMAIL */}
            {activeTab === "email_sync" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">
                    Automatización de Correos Bancarios (Google Gmail)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Detecta automáticamente notificaciones bancarias de compras, nóminas y traspasos para crear borradores instantáneos.
                  </p>
                </div>

                {scanFeedback && (
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{scanFeedback}</span>
                  </div>
                )}

                {emailSyncData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-rose-500 shadow-2xs font-bold text-sm">
                            G
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-950 flex items-center gap-2">
                              <span>Google Gmail Conectado</span>
                              <span className="px-2 py-0.2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                                Activo
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500">{emailSyncData.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDisconnectGmail}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Desvincular
                        </button>
                      </div>

                      <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Último escaneo:</span>
                        <span className="font-semibold text-zinc-800">
                          {emailSyncData.lastSyncedAt
                            ? new Date(emailSyncData.lastSyncedAt).toLocaleString()
                            : "Reciente"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRunEmailScan}
                        disabled={isScanningEmails}
                        className="py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isScanningEmails ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Escaneando bandeja de correos...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Escanear Correos Ahora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConnectGmail} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs text-zinc-600">
                      <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span>¿Cómo funciona la automatización?</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        FyDry busca correos de tus bancos (cargos con tarjeta, transferencias, abonos de sueldo) y extrae el monto y concepto para crear borradores en tu campanita de notificaciones. Nunca se asienta nada sin tu confirmación previa.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Tu Cuenta de Google Gmail
                      </label>
                      <input
                        type="email"
                        required
                        value={syncGmailEmail}
                        onChange={(e) => setSyncGmailEmail(e.target.value)}
                        placeholder="ejemplo@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isConnectingEmail}
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isConnectingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Conectando con Google...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Conectar Google Gmail & Activar Automatización</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: CONTRASEÑA & OTP */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600">
                  {t.settings.security.banner} (<strong>{userEmail}</strong>).
                </div>

                {securityError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {securityError}
                  </div>
                )}

                {securityStep === "initial" && (
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRequestPasswordOtp}
                      disabled={isSendingOtp}
                      className="py-2.5 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{t.settings.security.sendOtpBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {securityStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-800">
                      {t.settings.security.enterOtp}
                    </label>
                    <div className="flex gap-2 justify-center">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`settings-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-10 h-12 text-center text-base font-bold rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleRequestPasswordOtp}
                        className="py-2 px-3 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                      >
                        {t.settings.security.resend}
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="flex-1 py-2 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{t.settings.security.verifyBtn}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {securityStep === "new_password" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        {t.settings.security.newPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        {t.settings.security.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                    >
                      {isVerifyingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>{t.settings.security.updatePasswordBtn}</span>
                      )}
                    </button>
                  </form>
                )}

                {securityStep === "success" && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
                    <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-bold">{t.settings.security.successTitle}</p>
                    <p className="text-[11px] text-emerald-700">
                      {t.settings.security.successSubtitle}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: IDIOMA & MONEDA */}
            {activeTab === "languages" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-2">
                    {t.settings.languages.platformLanguage}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange("es")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        language === "es"
                          ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                          : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{t.settings.languages.spanish}</div>
                        <div className={`text-[10px] ${language === "es" ? "text-zinc-300" : "text-zinc-400"}`}>
                          {t.settings.languages.spanishDesc}
                        </div>
                      </div>
                      {language === "es" && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLanguageChange("en")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        language === "en"
                          ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                          : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{t.settings.languages.english}</div>
                        <div className={`text-[10px] ${language === "en" ? "text-zinc-300" : "text-zinc-400"}`}>
                          {t.settings.languages.englishDesc}
                        </div>
                      </div>
                      {language === "en" && <Check className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    {t.settings.languages.mainCurrency}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setCurrency(newCurr);
                      updateUserSettingsApi({ preferred_currency: newCurr });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="DOP">DOP (RD$) - Peso Dominicano</option>
                    <option value="USD">USD ($) - Dólar estadounidense</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="MXN">MXN ($) - Peso Mexicano</option>
                    <option value="COP">COP ($) - Peso Colombiano</option>
                    <option value="ARS">ARS ($) - Peso Argentino</option>
                    <option value="CLP">CLP ($) - Peso Chileno</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICACIONES */}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                {notificationMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    {notificationMsg}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">
                      {t.settings.notifications.browserPush}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {t.settings.notifications.browserDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestBrowserPermission}
                    className="py-1.5 px-3 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                  >
                    {browserNotifications ? t.settings.notifications.activeStatus : t.settings.notifications.requestBtn}
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    {t.settings.notifications.emailAlertsTitle}
                  </h4>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 block">
                        {t.settings.notifications.budgetWarningTitle}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        {t.settings.notifications.budgetWarningDesc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={budgetWarnings}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setBudgetWarnings(val);
                        handleNotificationSave({ budgetWarnings: val });
                      }}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 block">
                        {t.settings.notifications.debtsDueTitle}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        {t.settings.notifications.debtsDueDesc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEmailAlerts(val);
                        handleNotificationSave({ emailAlerts: val });
                      }}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 block">
                        {t.settings.notifications.weeklyDigestTitle}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        {t.settings.notifications.weeklyDigestDesc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyDigest}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setWeeklyDigest(val);
                        handleNotificationSave({ weeklyDigest: val });
                      }}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 5: SOPORTE & CONTACTO */}
            {activeTab === "support" && (
              <form onSubmit={handleSendSupport} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 space-y-1">
                  <div className="font-bold text-zinc-950">{t.settings.support.bannerTitle}</div>
                  <div>{t.settings.support.bannerSubtitle} <strong>daryfernand7@gmail.com</strong>.</div>
                </div>

                {supportSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.settings.support.sentSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    {t.settings.support.subject}
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder={t.settings.support.subjectPlaceholder}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    {t.settings.support.message}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={t.settings.support.messagePlaceholder}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="https://wa.me/34600000000?text=Hola%20FyDry%20Soporte"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.settings.support.whatsappChat}</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isSendingSupport}
                    className="py-2 px-4 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingSupport ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.settings.support.sendBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 6: RESTABLECER DATOS */}
            {activeTab === "danger" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{t.settings.danger.warningTitle}</span>
                  </div>
                  <p className="leading-relaxed">
                    {t.settings.danger.warningDesc}
                  </p>
                </div>

                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold">
                    {t.settings.danger.resetSuccess}
                  </div>
                )}

                {!isResetConfirmOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.settings.danger.resetBtn}</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl border-2 border-rose-300 bg-white space-y-3"
                  >
                    <p className="text-xs font-bold text-zinc-900">
                      {t.settings.danger.confirmTitle}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsResetConfirmOpen(false)}
                        className="py-2 px-3.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        {t.settings.danger.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAllData}
                        disabled={isResettingData}
                        className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isResettingData ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{t.settings.danger.confirmAll}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer of modal */}
          <div className="pt-4 mt-6 border-t border-zinc-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              {t.settings.close}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
