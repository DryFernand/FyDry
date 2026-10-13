import {
  AccountItem,
  TransactionItem,
  MovementItem,
  BudgetItem,
  DebtItem,
  NotificationItem,
  EmailIntegrationData,
  RecurringItem,
  GoalItem,
  InsightsData,
} from "@/components/dashboard/types";
import { apiErrorMessage } from "@/lib/money";

export const getApiBase = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "https://fydry-api-dary.vercel.app/api/v1";
  }
  return "https://fydry-api-dary.vercel.app/api/v1";
};

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${getApiBase()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  return {
    ok: res.ok,
    status: res.status,
    data: res.ok ? data : null,
    error: !res.ok ? apiErrorMessage(data, res.status) : null,
  };
}

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fydry_access_token") || localStorage.getItem("fydry_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Petición autenticada que LANZA ApiError con el mensaje del backend si falla. Nunca simula éxito. */
async function send<T = any>(path: string, method: string = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(apiErrorMessage(data, res.status), res.status);
  return data as T;
}

/** Lectura con caché local de respaldo solo si la red falla (modo sin conexión). */
async function readCached<T>(path: string, cacheKey: string | null, map: (d: any) => T): Promise<T[]> {
  try {
    const data = await send<any[]>(path);
    const items = data.map(map);
    if (cacheKey && typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(items));
    }
    return items;
  } catch (err) {
    console.warn(`No se pudo cargar ${path}:`, err);
  }
  if (cacheKey && typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }
  return [];
}

// ==========================================
// MAPPERS (backend snake_case -> UI)
// ==========================================
const toAccount = (d: any): AccountItem => ({
  id: d.id,
  name: d.name,
  type: d.type,
  balance: d.balance,
  currency: d.currency || "DOP",
  accountNumber: d.account_number,
  cardNumber: d.card_number,
  cutoffDay: d.cutoff_day,
  graceDays: d.grace_days,
  overdraftLimit: d.overdraft_limit,
  creditLimit: d.credit_limit,
  minBalance: d.min_balance,
});

const toTransaction = (type: "expense" | "income") => (d: any): TransactionItem => ({
  id: d.id,
  description: d.description,
  amount: d.amount,
  type,
  category: d.category,
  account: d.account_name,
  date: d.date,
  createdAt: d.created_at,
});

const toMovement = (d: any): MovementItem => ({
  id: d.id,
  fromAccount: d.from_account_name,
  fromAccountId: d.from_account_id,
  toAccount: d.to_account_name,
  toAccountId: d.to_account_id,
  amount: d.amount,
  toAmount: d.to_amount ?? undefined,
  taxAmount: d.tax_amount || 0,
  taxExpenseId: d.tax_expense_id,
  description: d.description,
  date: d.date,
});

const toBudget = (d: any): BudgetItem => ({
  id: d.id,
  category: d.category,
  allocated: d.allocated_amount,
  spent: 0,
  color: d.color || "bg-zinc-900",
});

const toDebt = (d: any): DebtItem => ({
  id: d.id,
  creditor: d.creditor,
  type: d.type,
  totalAmount: d.total_amount,
  remainingAmount: d.remaining_amount,
  monthlyPayment: d.monthly_payment,
  interestRate: d.interest_rate,
  dueDate: d.due_date,
});

const toNotification = (d: any): NotificationItem => ({
  id: d.id,
  title: d.title,
  message: d.message,
  source: d.source,
  targetType: d.target_type,
  draftData: d.draft_data || {},
  isRead: d.is_read,
  isProcessed: d.is_processed,
  createdAt: d.created_at,
});

const toEmailIntegration = (d: any): EmailIntegrationData => ({
  id: d.id,
  provider: d.provider,
  email: d.email,
  isActive: d.is_active,
  lastSyncedAt: d.last_synced_at,
});

const toRecurring = (d: any): RecurringItem => ({
  id: d.id,
  kind: d.kind,
  description: d.description,
  category: d.category,
  amount: d.amount,
  account: d.account_name || "",
  accountId: d.account_id || undefined,
  frequency: d.frequency,
  nextDate: d.next_date,
  isActive: d.is_active,
});

const toGoal = (d: any): GoalItem => ({
  id: d.id,
  name: d.name,
  targetAmount: d.target_amount,
  savedAmount: d.saved_amount,
  targetDate: d.target_date || undefined,
  color: d.color,
});

// ==========================================
// ACCOUNTS API
// ==========================================
export async function fetchAccountsApi(): Promise<AccountItem[]> {
  return readCached("/accounts", "fydry_accounts", toAccount);
}

const accountPayload = (account: Partial<AccountItem>) => ({
  name: account.name,
  type: account.type,
  balance: account.balance,
  currency: account.currency,
  account_number: account.accountNumber || null,
  card_number: account.cardNumber || null,
  cutoff_day: account.cutoffDay || null,
  grace_days: account.graceDays ?? null,
  overdraft_limit: account.overdraftLimit ?? 0,
  credit_limit: account.creditLimit ?? 0,
  min_balance: account.minBalance ?? 0,
});

export async function createAccountApi(account: Omit<AccountItem, "id">): Promise<AccountItem> {
  return toAccount(await send("/accounts", "POST", { ...accountPayload(account), currency: account.currency || "DOP" }));
}

export async function updateAccountApi(id: string, account: Partial<AccountItem>): Promise<void> {
  await send(`/accounts/${id}`, "PUT", accountPayload(account));
}

export async function deleteAccountApi(id: string): Promise<void> {
  await send(`/accounts/${id}`, "DELETE");
}

/** Paga una tarjeta de crédito desde una cuenta propia (única forma de reducir su consumo). */
export async function payCreditCardApi(
  cardId: string,
  payment: { fromAccountId: string; amount: number; taxAmount?: number; date?: string; description?: string }
): Promise<MovementItem> {
  return toMovement(await send(`/accounts/${cardId}/pay`, "POST", {
    from_account_id: payment.fromAccountId,
    amount: payment.amount,
    tax_amount: payment.taxAmount || 0,
    date: payment.date,
    description: payment.description,
  }));
}

// ==========================================
// EXPENSES & INCOMES API
// ==========================================
const transactionPayload = (tx: Partial<TransactionItem>) => ({
  description: tx.description,
  amount: tx.amount,
  category: tx.category,
  account_name: tx.account,
  date: tx.date,
});

export async function fetchExpensesApi(): Promise<TransactionItem[]> {
  return readCached("/expenses", "fydry_expenses", toTransaction("expense"));
}

export async function createExpenseApi(exp: Omit<TransactionItem, "id" | "type">): Promise<TransactionItem> {
  return toTransaction("expense")(await send("/expenses", "POST", transactionPayload(exp)));
}

export async function updateExpenseApi(id: string, exp: Partial<TransactionItem>): Promise<void> {
  await send(`/expenses/${id}`, "PUT", transactionPayload(exp));
}

export async function deleteExpenseApi(id: string): Promise<void> {
  await send(`/expenses/${id}`, "DELETE");
}

export async function fetchIncomesApi(): Promise<TransactionItem[]> {
  return readCached("/incomes", "fydry_incomes", toTransaction("income"));
}

export async function createIncomeApi(inc: Omit<TransactionItem, "id" | "type">): Promise<TransactionItem> {
  return toTransaction("income")(await send("/incomes", "POST", transactionPayload(inc)));
}

export async function updateIncomeApi(id: string, inc: Partial<TransactionItem>): Promise<void> {
  await send(`/incomes/${id}`, "PUT", transactionPayload(inc));
}

export async function deleteIncomeApi(id: string): Promise<void> {
  await send(`/incomes/${id}`, "DELETE");
}

// ==========================================
// MOVEMENTS API (Transferencias entre Cuentas)
// ==========================================
const movementPayload = (mov: Partial<MovementItem>) => ({
  from_account_id: mov.fromAccountId || null,
  from_account_name: mov.fromAccount,
  to_account_id: mov.toAccountId || null,
  to_account_name: mov.toAccount,
  amount: mov.amount,
  to_amount: mov.toAmount ?? null,
  tax_amount: mov.taxAmount || 0,
  description: mov.description,
  date: mov.date,
});

export async function fetchMovementsApi(): Promise<MovementItem[]> {
  return readCached("/movements", "fydry_movements", toMovement);
}

export async function createMovementApi(mov: Omit<MovementItem, "id">): Promise<MovementItem> {
  return toMovement(await send("/movements", "POST", movementPayload(mov)));
}

export const createTransferApi = createMovementApi;

export async function updateMovementApi(id: string, mov: Partial<MovementItem>): Promise<void> {
  await send(`/movements/${id}`, "PUT", movementPayload(mov));
}

export async function deleteMovementApi(id: string): Promise<void> {
  await send(`/movements/${id}`, "DELETE");
}

// ==========================================
// TRANSACTIONS COMPATIBILITY BRIDGE
// ==========================================
const byNewest = (a: TransactionItem, b: TransactionItem) =>
  (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || "");

export async function fetchTransactionsApi(type?: "expense" | "income"): Promise<TransactionItem[]> {
  if (type === "expense") {
    return fetchExpensesApi();
  }
  if (type === "income") {
    return fetchIncomesApi();
  }
  const [exp, inc] = await Promise.all([fetchExpensesApi(), fetchIncomesApi()]);
  return [...exp, ...inc].sort(byNewest);
}

export async function createTransactionApi(tx: Omit<TransactionItem, "id">): Promise<TransactionItem> {
  const { type, ...rest } = tx;
  return type === "expense" ? createExpenseApi(rest) : createIncomeApi(rest);
}

export async function updateTransactionApi(id: string, tx: Partial<TransactionItem>): Promise<void> {
  return tx.type === "expense" ? updateExpenseApi(id, tx) : updateIncomeApi(id, tx);
}

export async function deleteTransactionApi(id: string, type?: "expense" | "income"): Promise<void> {
  if (type === "expense") {
    return deleteExpenseApi(id);
  } else if (type === "income") {
    return deleteIncomeApi(id);
  }
  // Sin tipo: intenta gasto y, si no existe, ingreso
  try {
    await deleteExpenseApi(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await deleteIncomeApi(id);
    } else {
      throw err;
    }
  }
}

// ==========================================
// BUDGETS API
// ==========================================
export async function fetchBudgetsApi(): Promise<BudgetItem[]> {
  return readCached("/budgets", "fydry_budgets", toBudget);
}

export async function createBudgetApi(b: Omit<BudgetItem, "id" | "spent">): Promise<BudgetItem> {
  return toBudget(await send("/budgets", "POST", {
    category: b.category,
    allocated_amount: b.allocated,
    color: b.color || "bg-zinc-900",
  }));
}

export async function updateBudgetApi(id: string, b: Partial<BudgetItem>): Promise<void> {
  await send(`/budgets/${id}`, "PUT", {
    category: b.category,
    allocated_amount: b.allocated,
    color: b.color,
  });
}

export async function deleteBudgetApi(id: string): Promise<void> {
  await send(`/budgets/${id}`, "DELETE");
}

// ==========================================
// DEBTS API
// ==========================================
const debtPayload = (d: Partial<DebtItem>) => ({
  creditor: d.creditor,
  type: d.type,
  total_amount: d.totalAmount,
  remaining_amount: d.remainingAmount,
  monthly_payment: d.monthlyPayment,
  interest_rate: d.interestRate,
  due_date: d.dueDate,
});

export async function fetchDebtsApi(): Promise<DebtItem[]> {
  return readCached("/debts", "fydry_debts", toDebt);
}

export async function createDebtApi(d: Omit<DebtItem, "id">): Promise<DebtItem> {
  return toDebt(await send("/debts", "POST", debtPayload(d)));
}

export async function updateDebtApi(id: string, d: Partial<DebtItem>): Promise<void> {
  await send(`/debts/${id}`, "PUT", debtPayload(d));
}

export async function deleteDebtApi(id: string): Promise<void> {
  await send(`/debts/${id}`, "DELETE");
}

export async function payDebtApi(
  id: string,
  payload: {
    amount: number;
    account_id?: string;
    account_name?: string;
    date?: string;
    description?: string;
  }
): Promise<DebtItem> {
  return toDebt(await send(`/debts/${id}/pay`, "POST", payload));
}

// ==========================================
// RECURRING, GOALS & INSIGHTS API
// ==========================================
const recurringPayload = (r: Partial<RecurringItem>) => ({
  kind: r.kind,
  description: r.description,
  category: r.category,
  amount: r.amount,
  account_id: r.accountId || null,
  account_name: r.account || null,
  frequency: r.frequency,
  next_date: r.nextDate,
  is_active: r.isActive,
});

export async function fetchRecurringApi(): Promise<RecurringItem[]> {
  return readCached("/recurring", null, toRecurring);
}

export async function createRecurringApi(r: Omit<RecurringItem, "id" | "isActive">): Promise<RecurringItem> {
  return toRecurring(await send("/recurring", "POST", recurringPayload({ ...r, isActive: true })));
}

export async function updateRecurringApi(id: string, r: Partial<RecurringItem>): Promise<RecurringItem> {
  return toRecurring(await send(`/recurring/${id}`, "PUT", recurringPayload(r)));
}

export async function deleteRecurringApi(id: string): Promise<void> {
  await send(`/recurring/${id}`, "DELETE");
}

/** Asienta las recurrentes vencidas. Devuelve cuántos movimientos se registraron. */
export async function postDueRecurringApi(): Promise<{ posted: number; skipped: string[] }> {
  return send("/recurring/post-due", "POST");
}

export async function fetchGoalsApi(): Promise<GoalItem[]> {
  return readCached("/goals", null, toGoal);
}

export async function createGoalApi(g: Omit<GoalItem, "id" | "savedAmount">): Promise<GoalItem> {
  return toGoal(await send("/goals", "POST", {
    name: g.name,
    target_amount: g.targetAmount,
    target_date: g.targetDate || null,
    color: g.color,
  }));
}

export async function updateGoalApi(id: string, g: Partial<GoalItem>): Promise<GoalItem> {
  return toGoal(await send(`/goals/${id}`, "PUT", {
    name: g.name,
    target_amount: g.targetAmount,
    target_date: g.targetDate || null,
    color: g.color,
  }));
}

/** amount > 0 aporta, < 0 retira. */
export async function contributeGoalApi(id: string, amount: number): Promise<GoalItem> {
  return toGoal(await send(`/goals/${id}/contribute`, "POST", { amount }));
}

export async function deleteGoalApi(id: string): Promise<void> {
  await send(`/goals/${id}`, "DELETE");
}

export async function fetchInsightsApi(): Promise<InsightsData | null> {
  try {
    return await send<InsightsData>("/insights");
  } catch (err) {
    console.warn("No se pudieron cargar los indicadores:", err);
    return null;
  }
}

// ==========================================
// COMPLETE ONBOARDING API
// ==========================================
export async function completeOnboardingApi(): Promise<void> {
  try {
    await send("/auth/complete-onboarding", "POST");
  } catch (err) {
    console.warn("Error marking onboarding as completed:", err);
  }
}

// ==========================================
// USER SETTINGS & PREFERENCES API
// ==========================================
export interface UserSettingsData {
  full_name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  preferred_currency: string;
  language: string;
  budget_reset_day?: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  budget_alerts: boolean;
  weekly_digest: boolean;
}

export async function fetchUserSettingsApi(): Promise<UserSettingsData | null> {
  try {
    const data = await send<UserSettingsData>("/auth/settings");
    if (typeof window !== "undefined") {
      localStorage.setItem("fydry_user_settings", JSON.stringify(data));
    }
    return data;
  } catch (err) {
    console.warn("Backend unavailable, using cached settings:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_user_settings");
    if (cached) return JSON.parse(cached);
  }
  return null;
}

export async function updateUserSettingsApi(settings: Partial<UserSettingsData>): Promise<UserSettingsData | null> {
  try {
    const data = await send<UserSettingsData>("/auth/settings", "PUT", settings);
    if (typeof window !== "undefined") {
      localStorage.setItem("fydry_user_settings", JSON.stringify(data));
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    return data;
  } catch (err) {
    console.warn("Error updating user settings on backend:", err);
  }
  return null;
}

export async function resetUserDataApi(): Promise<boolean> {
  try {
    await send("/reset-data", "POST");
    if (typeof window !== "undefined") {
      for (const key of ["fydry_accounts", "fydry_expenses", "fydry_incomes", "fydry_movements", "fydry_budgets", "fydry_debts", "fydry_notifications"]) {
        localStorage.removeItem(key);
      }
      window.dispatchEvent(new Event("fydry_storage_updated"));
    }
    return true;
  } catch (err) {
    console.warn("Error resetting user data on backend:", err);
  }
  return false;
}

// ==========================================
// NOTIFICATIONS API
// ==========================================
export async function fetchNotificationsApi(): Promise<NotificationItem[]> {
  return readCached("/notifications", "fydry_notifications", toNotification);
}

export async function markNotificationReadApi(id: string): Promise<void> {
  try {
    await send(`/notifications/${id}/read`, "PUT");
  } catch (err) {
    console.warn("Error marking notification read:", err);
  }
}

export async function markNotificationProcessedApi(id: string): Promise<void> {
  try {
    await send(`/notifications/${id}/process`, "PUT");
  } catch (err) {
    console.warn("Error marking notification processed:", err);
  }
}

export async function deleteNotificationApi(id: string): Promise<void> {
  try {
    await send(`/notifications/${id}`, "DELETE");
  } catch (err) {
    console.warn("Error deleting notification:", err);
  }
}

// ==========================================
// EMAIL SYNC (GMAIL) API
// ==========================================
export async function fetchEmailSyncStatusApi(): Promise<EmailIntegrationData | null> {
  try {
    const data = await send("/email-sync/status");
    return data ? toEmailIntegration(data) : null;
  } catch (err) {
    console.warn("Error fetching email sync status:", err);
  }
  return null;
}

export async function connectEmailSyncApi(email: string): Promise<EmailIntegrationData | null> {
  try {
    return toEmailIntegration(await send("/email-sync/connect", "POST", { email }));
  } catch (err) {
    console.warn("Error connecting email sync:", err);
  }
  return null;
}

export async function disconnectEmailSyncApi(): Promise<boolean> {
  try {
    await send("/email-sync/disconnect", "POST");
    return true;
  } catch (err) {
    console.warn("Error disconnecting email sync:", err);
    return false;
  }
}

export async function scanEmailsNowApi(): Promise<{ scannedCount: number; newFound: number; message: string }> {
  try {
    const data = await send("/email-sync/scan-now", "POST");
    return {
      scannedCount: data.scanned_count,
      newFound: data.new_found,
      message: data.message,
    };
  } catch (err) {
    console.warn("Error running scan-now:", err);
  }
  return {
    scannedCount: 0,
    newFound: 0,
    message: "No se pudo conectar con el servidor para escanear correos.",
  };
}

export async function checkFinancialAlertsApi(): Promise<NotificationItem[]> {
  try {
    const items = (await send<any[]>("/notifications/check-alerts", "POST")).map(toNotification);
    if (typeof window !== "undefined") {
      localStorage.setItem("fydry_notifications", JSON.stringify(items));
    }
    return items;
  } catch (err) {
    console.warn("Error checking financial alerts:", err);
  }
  return [];
}
