import { Metadata } from "next";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Bienvenido a FyDry | Configura tu perfil",
  description: "Personaliza tu experiencia, moneda y metas financieras en FyDry.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
