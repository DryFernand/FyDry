/** Cuenta que el usuario ya tiene (los montos se guardan como texto mientras escribe). */
export interface OnboardingAccountDraft {
  name: string;
  type: "bank" | "cash" | "savings" | "credit_card";
  /** Saldo disponible; en tarjetas de crédito, lo consumido */
  balance: string;
  credit_limit: string;
  cutoff_day: string;
  payment_day: string;
}

/** Gasto fijo mensual (alquiler, internet...). */
export interface OnboardingFixedExpenseDraft {
  description: string;
  amount: string;
  day: string;
  category: string;
}

export interface OnboardingFormData {
  // Paso 1: Personales
  phone: string;
  country: string;
  preferred_currency: string;

  // Paso 2: Laborales
  employment_type: string;
  industry_or_role: string;

  // Paso 3: Financieros
  monthly_income_range: string;
  income_sources: string[];
  income_frequency: string;

  // Paso 4: Tu dinero hoy (opcional)
  pay_day: string;
  accounts: OnboardingAccountDraft[];
  fixed_expenses: OnboardingFixedExpenseDraft[];

  // Paso 5: Situación Económica y Metas
  financial_situation_status: string;
  primary_goals: string[];
  emergency_months: string;

  // Paso 6: Canal de Adquisición
  referral_source: string;
  referral_detail: string;
}

export const initialOnboardingData: OnboardingFormData = {
  phone: "",
  country: "República Dominicana",
  preferred_currency: "DOP",
  employment_type: "",
  industry_or_role: "",
  monthly_income_range: "",
  income_sources: [],
  income_frequency: "monthly",
  pay_day: "",
  accounts: [],
  fixed_expenses: [],
  financial_situation_status: "",
  primary_goals: [],
  emergency_months: "3",
  referral_source: "",
  referral_detail: "",
};
