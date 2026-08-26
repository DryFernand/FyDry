import { AccountItem, TransactionItem, BudgetItem, DebtItem } from "@/components/dashboard/types";

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
// TRANSACTIONS API (Expenses & Incomes)
// ==========================================
export async function fetchTransactionsApi(type?: "expense" | "income"): Promise<TransactionItem[]> {
  try {
    const url = type ? `${getApiBase()}/transactions?type=${type}` : `${getApiBase()}/transactions`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items: TransactionItem[] = data.map((d: any) => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        type: d.type,
        category: d.category,
        account: d.account_name,
        date: d.date,
      }));
      return items;
    }
  } catch (err) {
    console.warn("Backend unavailable, using cached transactions:", err);
  }

  // Fallback to cache
  if (typeof window !== "undefined") {
    const key = type === "expense" ? "fydry_expenses" : type === "income" ? "fydry_incomes" : "";
    if (key) {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    }
  }
  return [];
}

export async function createTransactionApi(tx: Omit<TransactionItem, "id">): Promise<TransactionItem> {
  const payload = {
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    account_name: tx.account,
    date: tx.date,
  };

  try {
    const res = await fetch(`${getApiBase()}/transactions`, {
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
        type: d.type,
        category: d.category,
        account: d.account_name,
        date: d.date,
      };
    }
  } catch (err) {
    console.warn("Error creating transaction on backend:", err);
  }

  return {
    id: `tx-${Date.now()}`,
    ...tx,
  };
}

export async function updateTransactionApi(id: string, tx: Partial<TransactionItem>): Promise<void> {
  const payload = {
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    account_name: tx.account,
    date: tx.date,
  };

  try {
    await fetch(`${getApiBase()}/transactions/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Error updating transaction on backend:", err);
  }
}

export async function deleteTransactionApi(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/transactions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Error deleting transaction on backend:", err);
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
