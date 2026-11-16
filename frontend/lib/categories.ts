export const EXPENSE_CATEGORIES = [
  "Vivienda & Alquiler",
  "Supermercado & Alimentación",
  "Restaurantes & Bares",
  "Servicios Públicos (Luz/Agua/Gas)",
  "Telefonía & Internet",
  "Gasolina & Combustible",
  "Transporte Público & Taxi",
  "Salud & Farmacia",
  "Seguros & Pólizas",
  "Gimnasio & Deporte",
  "Ropa & Calzado",
  "Cuidado Personal & Barbería",
  "Educación & Cursos",
  "Entretenimiento & Cine",
  "Suscripciones Digitales",
  "Viajes & Vacaciones",
  "Mascotas & Veterinario",
  "Tecnología & Gadgets",
  "Mantenimiento del Hogar",
  "Regalos & Celebraciones",
  "Impuestos & Tasas",
  "Pago de Deudas & Préstamos",
  "Imprevistos & Emergencias",
  "Inversiones",
  "Ahorro Programado",
  "Otros Gastos",
] as const;

export const INCOME_CATEGORIES = [
  "Salario / Nómina Principal",
  "Horas Extras & Guardias",
  "Bonificaciones & Comisiones",
  "Servicios Freelance",
  "Consultoría & Asesoría",
  "Negocio Propio / Ventas",
  "Dividendos & Acciones",
  "Rentas / Alquileres de Inmuebles",
  "Rendimientos & Intereses Bancarios",
  "Reembolsos & Devoluciones",
  "Venta de Artículos de Segunda Mano",
  "Premios & Sorteos",
  "Regalos & Ayudas Familiares",
  "Criptomonedas & Staking",
  "Otros Ingresos",
] as const;

// Las listas de arriba son las predefinidas: cada usuario arranca con ellas y luego las personaliza
// (useCategories / systemCategoryName en lib/useCategories.ts dan las suyas).

/** Categorías con lógica propia. Igual que SYSTEM_DEFAULTS en backend/app/services/categories.py. */
export const SYSTEM_CATEGORY_DEFAULTS = {
  tax: "Impuestos & Tasas",
  debt: "Pago de Deudas & Préstamos",
  savings: "Ahorro Programado",
  investments: "Inversiones",
  /** Único ingreso que puede abonarse a una tarjeta de crédito (cashback) */
  card_income: "Rendimientos & Intereses Bancarios",
  other_expense: "Otros Gastos",
  other_income: "Otros Ingresos",
} as const;

export type SystemCategoryKey = keyof typeof SYSTEM_CATEGORY_DEFAULTS;
export type CategoryKind = "expense" | "income";

export interface CategoryItem {
  id: string;
  kind: CategoryKind;
  name: string;
  /** Solo en las del sistema: se pueden renombrar, no eliminar */
  system_key: SystemCategoryKey | null;
}

export const sameCategory = (a?: string | null, b?: string | null) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
