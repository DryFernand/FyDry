import { AccountItem, TransactionItem, MovementItem, BudgetItem, DebtItem } from "@/components/dashboard/types";

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
    error: !res.ok ? data?.detail || "Ocurrió un error inesperado." : null,
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


// ==========================================
// ACCOUNTS API
// ==========================================
export async function fetchAccountsApi(): Promise<AccountItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/accounts`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const accounts: AccountItem[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        balance: d.balance,
        currency: d.currency || "USD",
        accountNumber: d.account_number,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_accounts", JSON.stringify(accounts));
      }
      return accounts;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached accounts:", err);
  }

  // Fallback to cache
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_accounts");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createAccountApi(account: Omit<AccountItem, "id">): Promise<AccountItem> {
  const payload = {
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency || "USD",
    account_number: account.accountNumber || null,
  };

  try {
    const res = await fetch(`${getApiBase()}/accounts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        balance: d.balance,
        currency: d.currency,
        accountNumber: d.account_number,
      };
    }
  } catch (err) {
    console.warn("Error creating account on backend:", err);
  }

  // Local fallback
  return {
    id: `acc-${Date.now()}`,
    ...account,
  };
}

export async function updateAccountApi(id: string, account: Partial<AccountItem>): Promise<void> {
  const payload = {
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    account_number: account.accountNumber || null,
  };

  try {
    await fetch(`${getApiBase()}/accounts/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating account on backend:", err);
  }
}

export async function deleteAccountApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/accounts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting account on backend:", err);
  }
}

// ==========================================
// EXPENSES API (Gastos)
// ==========================================
export async function fetchExpensesApi(): Promise<TransactionItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/expenses`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: TransactionItem[] = data.map((d: any) => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        type: "expense" as const,
        category: d.category,
        account: d.account_name,
        date: d.date,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_expenses", JSON.stringify(items));
      }
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached expenses:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_expenses");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createExpenseApi(exp: Omit<TransactionItem, "id" | "type">): Promise<TransactionItem> {
  const payload = {
    description: exp.description,
    amount: exp.amount,
    category: exp.category,
    account_name: exp.account,
    date: exp.date,
  };

  try {
    const res = await fetch(`${getApiBase()}/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        description: d.description,
        amount: d.amount,
        type: "expense",
        category: d.category,
        account: d.account_name,
        date: d.date,
      };
    }
  } catch (err) {
    console.warn("Error creating expense on backend:", err);
  }

  return {
    id: `exp-${Date.now()}`,
    type: "expense",
    ...exp,
  };
}

export async function updateExpenseApi(id: string, exp: Partial<TransactionItem>): Promise<void> {
  const payload = {
    description: exp.description,
    amount: exp.amount,
    category: exp.category,
    account_name: exp.account,
    date: exp.date,
  };

  try {
    await fetch(`${getApiBase()}/expenses/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating expense on backend:", err);
  }
}

export async function deleteExpenseApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/expenses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting expense on backend:", err);
  }
}

// ==========================================
// INCOMES API (Ingresos)
// ==========================================
export async function fetchIncomesApi(): Promise<TransactionItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/incomes`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: TransactionItem[] = data.map((d: any) => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        type: "income" as const,
        category: d.category,
        account: d.account_name,
        date: d.date,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_incomes", JSON.stringify(items));
      }
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached incomes:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_incomes");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createIncomeApi(inc: Omit<TransactionItem, "id" | "type">): Promise<TransactionItem> {
  const payload = {
    description: inc.description,
    amount: inc.amount,
    category: inc.category,
    account_name: inc.account,
    date: inc.date,
  };

  try {
    const res = await fetch(`${getApiBase()}/incomes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        description: d.description,
        amount: d.amount,
        type: "income",
        category: d.category,
        account: d.account_name,
        date: d.date,
      };
    }
  } catch (err) {
    console.warn("Error creating income on backend:", err);
  }

  return {
    id: `inc-${Date.now()}`,
    type: "income",
    ...inc,
  };
}

export async function updateIncomeApi(id: string, inc: Partial<TransactionItem>): Promise<void> {
  const payload = {
    description: inc.description,
    amount: inc.amount,
    category: inc.category,
    account_name: inc.account,
    date: inc.date,
  };

  try {
    await fetch(`${getApiBase()}/incomes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating income on backend:", err);
  }
}

export async function deleteIncomeApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/incomes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting income on backend:", err);
  }
}

// ==========================================
// MOVEMENTS API (Transferencias entre Cuentas)
// ==========================================
export async function fetchMovementsApi(): Promise<MovementItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/movements`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: MovementItem[] = data.map((d: any) => ({
        id: d.id,
        fromAccount: d.from_account_name,
        fromAccountId: d.from_account_id,
        toAccount: d.to_account_name,
        toAccountId: d.to_account_id,
        amount: d.amount,
        description: d.description,
        date: d.date,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_movements", JSON.stringify(items));
      }
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached movements:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_movements");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createMovementApi(mov: Omit<MovementItem, "id">): Promise<MovementItem> {
  const payload = {
    from_account_id: mov.fromAccountId || null,
    from_account_name: mov.fromAccount,
    to_account_id: mov.toAccountId || null,
    to_account_name: mov.toAccount,
    amount: mov.amount,
    description: mov.description,
    date: mov.date,
  };

  try {
    const res = await fetch(`${getApiBase()}/movements`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        fromAccount: d.from_account_name,
        fromAccountId: d.from_account_id,
        toAccount: d.to_account_name,
        toAccountId: d.to_account_id,
        amount: d.amount,
        description: d.description,
        date: d.date,
      };
    }
  } catch (err) {
    console.warn("Error creating movement on backend:", err);
  }

  return {
    id: `mov-${Date.now()}`,
    ...mov,
  };
}

export async function updateMovementApi(id: string, mov: Partial<MovementItem>): Promise<void> {
  const payload = {
    from_account_id: mov.fromAccountId || null,
    from_account_name: mov.fromAccount,
    to_account_id: mov.toAccountId || null,
    to_account_name: mov.toAccount,
    amount: mov.amount,
    description: mov.description,
    date: mov.date,
  };

  try {
    await fetch(`${getApiBase()}/movements/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating movement on backend:", err);
  }
}

export async function deleteMovementApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/movements/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting movement on backend:", err);
  }
}

// ==========================================
// TRANSACTIONS COMPATIBILITY BRIDGE
// ==========================================
export async function fetchTransactionsApi(type?: "expense" | "income"): Promise<TransactionItem[]> {
  if (type === "expense") {
    return fetchExpensesApi();
  }
  if (type === "income") {
    return fetchIncomesApi();
  }
  const [exp, inc] = await Promise.all([fetchExpensesApi(), fetchIncomesApi()]);
  return [...exp, ...inc].sort((a, b) => b.id.localeCompare(a.id));
}

export async function createTransactionApi(tx: Omit<TransactionItem, "id">): Promise<TransactionItem> {
  if (tx.type === "expense") {
    return createExpenseApi({
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      account: tx.account,
      date: tx.date,
    });
  } else {
    return createIncomeApi({
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      account: tx.account,
      date: tx.date,
    });
  }
}

export async function updateTransactionApi(id: string, tx: Partial<TransactionItem>): Promise<void> {
  if (tx.type === "expense") {
    return updateExpenseApi(id, tx);
  } else {
    return updateIncomeApi(id, tx);
  }
}

export async function deleteTransactionApi(id: string, type?: "expense" | "income"): Promise<void> {
  if (type === "expense") {
    return deleteExpenseApi(id);
  } else if (type === "income") {
    return deleteIncomeApi(id);
  }
  // Try expense then income
  try {
    await deleteExpenseApi(id);
  } catch {
    await deleteIncomeApi(id);
  }
}

// ==========================================
// BUDGETS API
// ==========================================
export async function fetchBudgetsApi(): Promise<BudgetItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/budgets`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: BudgetItem[] = data.map((d: any) => ({
        id: d.id,
        category: d.category,
        allocated: d.allocated_amount,
        spent: 0,
        color: d.color || "bg-zinc-900",
      }));
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached budgets:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_budgets");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createBudgetApi(b: Omit<BudgetItem, "id" | "spent">): Promise<BudgetItem> {
  const payload = {
    category: b.category,
    allocated_amount: b.allocated,
    color: b.color || "bg-zinc-900",
  };

  try {
    const res = await fetch(`${getApiBase()}/budgets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        category: d.category,
        allocated: d.allocated_amount,
        spent: 0,
        color: d.color,
      };
    }
  } catch (err) {
    console.warn("Error creating budget on backend:", err);
  }

  return {
    id: `b-${Date.now()}`,
    spent: 0,
    ...b,
  };
}

export async function updateBudgetApi(id: string, b: Partial<BudgetItem>): Promise<void> {
  const payload = {
    category: b.category,
    allocated_amount: b.allocated,
    color: b.color,
  };

  try {
    await fetch(`${getApiBase()}/budgets/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating budget on backend:", err);
  }
}

export async function deleteBudgetApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/budgets/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting budget on backend:", err);
  }
}

// ==========================================
// DEBTS API
// ==========================================
export async function fetchDebtsApi(): Promise<DebtItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/debts`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: DebtItem[] = data.map((d: any) => ({
        id: d.id,
        creditor: d.creditor,
        type: d.type,
        totalAmount: d.total_amount,
        remainingAmount: d.remaining_amount,
        monthlyPayment: d.monthly_payment,
        interestRate: d.interest_rate,
        dueDate: d.due_date,
      }));
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached debts:", err);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fydry_debts");
    if (cached) return JSON.parse(cached);
  }
  return [];
}

export async function createDebtApi(d: Omit<DebtItem, "id">): Promise<DebtItem> {
  const payload = {
    creditor: d.creditor,
    type: d.type,
    total_amount: d.totalAmount,
    remaining_amount: d.remainingAmount,
    monthly_payment: d.monthlyPayment,
    interest_rate: d.interestRate,
    due_date: d.dueDate,
  };

  try {
    const res = await fetch(`${getApiBase()}/debts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const resp = await res.json();
      return {
        id: resp.id,
        creditor: resp.creditor,
        type: resp.type,
        totalAmount: resp.total_amount,
        remainingAmount: resp.remaining_amount,
        monthlyPayment: resp.monthly_payment,
        interestRate: resp.interest_rate,
        dueDate: resp.due_date,
      };
    }
  } catch (err) {
    console.warn("Error creating debt on backend:", err);
  }

  return {
    id: `debt-${Date.now()}`,
    ...d,
  };
}

export async function updateDebtApi(id: string, d: Partial<DebtItem>): Promise<void> {
  const payload = {
    creditor: d.creditor,
    type: d.type,
    total_amount: d.totalAmount,
    remaining_amount: d.remainingAmount,
    monthly_payment: d.monthlyPayment,
    interest_rate: d.interestRate,
    due_date: d.dueDate,
  };

  try {
    await fetch(`${getApiBase()}/debts/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating debt on backend:", err);
  }
}

export async function deleteDebtApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/debts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting debt on backend:", err);
  }
}

// ==========================================
// COMPLETE ONBOARDING API
// ==========================================
export async function completeOnboardingApi(): Promise<void> {
  try {
    await fetch(`${getApiBase()}/auth/complete-onboarding`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
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
  notifications_enabled: boolean;
  email_notifications: boolean;
  budget_alerts: boolean;
  weekly_digest: boolean;
}

export async function fetchUserSettingsApi(): Promise<UserSettingsData | null> {
  try {
    const res = await fetch(`${getApiBase()}/auth/settings`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data: UserSettingsData = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_user_settings", JSON.stringify(data));
      }
      return data;
    }
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
    const res = await fetch(`${getApiBase()}/auth/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data: UserSettingsData = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("fydry_user_settings", JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("Error updating user settings on backend:", err);
  }
  return null;
}

export async function resetUserDataApi(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/reset-data`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("fydry_accounts");
        localStorage.removeItem("fydry_expenses");
        localStorage.removeItem("fydry_incomes");
        localStorage.removeItem("fydry_budgets");
        localStorage.removeItem("fydry_debts");
        window.dispatchEvent(new Event("fydry_storage_updated"));
      }
      return true;
    }
  } catch (err) {
    console.warn("Error resetting user data on backend:", err);
  }
  return false;
}

