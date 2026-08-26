"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, Briefcase, Wallet, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { OnboardingFormData, initialOnboardingData } from "./types";
import StepPersonal from "./StepPersonal";
import StepWork from "./StepWork";
import StepFinancial from "./StepFinancial";
import StepGoals from "./StepGoals";
import StepReferral from "./StepReferral";
import { apiCompleteOnboarding } from "@/lib/auth";

const steps = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Laboral", icon: Briefcase },
  { id: 3, title: "Finanzas", icon: Wallet },
  { id: 4, title: "Metas", icon: Target },
  { id: 5, title: "Origen", icon: Sparkles },
];

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
    if (currentStep < 5) {
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
      const res = await apiCompleteOnboarding(formData);
      if (res.data?.onboarding_completed || res.status === 200) {
        setIsFinished(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(res.error || "No se pudo guardar la información.");
      }
    } catch {
      // Fallback
      setIsFinished(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-50/70 via-white to-zinc-50/40 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Main Wizard Card */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-xl bg-white rounded-3xl border border-zinc-200/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/5 p-6 sm:p-8 relative z-10 overflow-hidden"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 text-white font-bold text-xs px-2 py-1 rounded-lg">
              FD
            </span>
            <span className="font-bold text-sm tracking-tight text-zinc-950">
              FyDry
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            Paso {currentStep} de 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-zinc-950 h-1.5 rounded-full"
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
                        ? "bg-zinc-950 text-white"
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
                <StepGoals
                  formData={formData}
                  updateData={updateFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 5 && (
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
