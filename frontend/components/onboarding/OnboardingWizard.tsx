"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { User, Briefcase, Wallet, Landmark, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { OnboardingFormData, initialOnboardingData } from "./types";
import StepPersonal from "./StepPersonal";
import StepWork from "./StepWork";
import StepFinancial from "./StepFinancial";
import StepMoney from "./StepMoney";
import StepGoals from "./StepGoals";
import StepReferral from "./StepReferral";
import { apiCompleteOnboarding } from "@/lib/auth";
import { parseAmount } from "@/lib/money";

const steps = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Laboral", icon: Briefcase },
  { id: 3, title: "Finanzas", icon: Wallet },
  { id: 4, title: "Tu dinero", icon: Landmark },
  { id: 5, title: "Metas", icon: Target },
  { id: 6, title: "Origen", icon: Sparkles },
];

const amountOrZero = (s: string) => {
  const n = parseAmount(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const dayOrNull = (s: string) => {
  const n = parseInt(s, 10);
  return n >= 1 && n <= 31 ? n : null;
};

/** Convierte el formulario al cuerpo de /onboarding/complete, descartando filas vacías. */
function toPayload(f: OnboardingFormData) {
  const { accounts, fixed_expenses, pay_day, emergency_months, ...profile } = f;
  const payDay = dayOrNull(pay_day);
  return {
    ...profile,
    pay_day: payDay,
    accounts: accounts
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name.trim(),
        type: a.type,
        currency: f.preferred_currency,
        balance: amountOrZero(a.balance),
        ...(a.type === "credit_card"
          ? { credit_limit: amountOrZero(a.credit_limit), cutoff_day: dayOrNull(a.cutoff_day), payment_day: dayOrNull(a.payment_day) }
          : {}),
      })),
    fixed_expenses: fixed_expenses
      .filter((x) => x.description.trim() && amountOrZero(x.amount) > 0)
      .map((x) => ({
        description: x.description.trim(),
        amount: amountOrZero(x.amount),
        day: dayOrNull(x.day) ?? payDay ?? 1,
        category: x.category,
      })),
    emergency_months: f.primary_goals.includes("emergency_fund") ? Number(emergency_months) || null : null,
  };
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingFormData>(initialOnboardingData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const updateFormData = (fields: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await apiCompleteOnboarding(toPayload(formData));
      // Si falla no se da por terminado: se perderían las cuentas y gastos fijos que escribió
      if (!res.ok) {
        setErrorMsg(res.error || "No pudimos guardar tu perfil. Revisa los datos e intenta de nuevo.");
        return;
      }
      try {
        const u = JSON.parse(localStorage.getItem("fydry_user") || "null");
        if (u) {
          localStorage.setItem("fydry_user", JSON.stringify({ ...u, onboarding_completed: true }));
          if (u.id) localStorage.removeItem(`fydry_camila_tour_done_${u.id}`);
        }
        localStorage.setItem("fydry_start_camila_tour", "1");
        localStorage.removeItem("fydry_camila_tour_done");
      } catch {}
      setIsFinished(true);
    } catch (err: unknown) {
      console.error("Error al completar onboarding:", err);
      setErrorMsg("No pudimos conectar con FyDry. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
      filter: "blur(4px)",
      transition: { duration: 0.2, ease: "easeIn" as const },
    }),
  };

  if (isFinished) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-50/70 via-white to-zinc-50/40 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/90 shadow-xl p-8 text-center space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              ¡Tu perfil financiero está listo!
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              Hemos configurado tus categorías, presupuestos y objetivos con éxito. Bienvenido a una experiencia financiera tranquila y transparente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem("fydry_start_camila_tour", "1");
                localStorage.removeItem("fydry_camila_tour_done");
              } catch {}
              router.push("/dashboard");
            }}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
          >
            Ir a mi Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-50/70 via-white to-zinc-50/40 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Main Container */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-xl bg-white rounded-3xl border border-zinc-200/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/5 p-6 sm:p-8 relative z-10 overflow-hidden"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
              <Image
                src="/logo_vino.png"
                alt="FyDry Logo"
                fill
                sizes="28px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950">
              FyDry
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            Paso {currentStep} de {steps.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-emerald-700 h-1.5 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.max(progressPercentage, 10)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mt-3 px-1">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "text-zinc-950 font-bold"
                      : isCompleted
                      ? "text-zinc-500"
                      : "text-zinc-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? "bg-emerald-700 text-white"
                        : isCompleted
                        ? "bg-zinc-200 text-zinc-700"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Finished Confirmation Screen */}
        {isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              ¡Perfil completado con éxito!
            </h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Estamos configurando tu espacio y calibrando tus metas. Redirigiendo a tu panel...
            </p>
          </motion.div>
        ) : (
          /* Animated Step Slides */
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {currentStep === 1 && (
                <StepPersonal
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                />
              )}
              {currentStep === 2 && (
                <StepWork
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 3 && (
                <StepFinancial
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 4 && (
                <StepMoney
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 5 && (
                <StepGoals
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 6 && (
                <StepReferral
                  formData={formData}
                  updateData={updateFormData}
                  onSubmit={handleFinalSubmit}
                  onPrev={handlePrev}
                  isLoading={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
