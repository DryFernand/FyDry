export interface OnboardingFormData {
  // Paso 1: Personales
  phone: string;
  country: string;
  city: string;
  preferred_currency: string;

  // Paso 2: Laborales
  employment_type: string;
  industry_or_role: string;

  // Paso 3: Financieros
  monthly_income_range: string;
  income_sources: string[];
  income_frequency: string;

  // Paso 4: Situación Económica y Metas
  financial_situation_status: string;
  primary_goals: string[];

  // Paso 5: Canal de Adquisición
  referral_source: string;
  referral_detail: string;
}

export const initialOnboardingData: OnboardingFormData = {
  phone: "",
  country: "España",
  city: "",
  preferred_currency: "USD",
  employment_type: "",
  industry_or_role: "",
  monthly_income_range: "",
  income_sources: [],
  income_frequency: "monthly",
  financial_situation_status: "",
  primary_goals: [],
  referral_source: "",
  referral_detail: "",
};
