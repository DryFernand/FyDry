export type DashboardTab =
  | "home"
  | "movements"
  | "accounts"
  | "expenses"
  | "incomes"
  | "budget"
  | "debts"
  | "reports";

export interface TransactionItem {
  id: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  type: "expense" | "income";
  date: string;
}

export interface MovementItem {
  id: string;
  fromAccount: string;
  fromAccountId?: string;
  toAccount: string;
  toAccountId?: string;
  amount: number;
  taxAmount?: number;
  taxExpenseId?: string;
  description: string;
  date: string;
}

export interface AccountItem {
  id: string;
  name: string;
  type: "bank" | "credit_card" | "debit_card" | "card" | "wallet" | "cash" | "savings";
  balance: number;
  currency: string;
  accountNumber?: string;
  cardNumber?: string;
  cutoffDay?: number;
  graceDays?: number;
  overdraftLimit?: number;
  creditLimit?: number;
  minBalance?: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface DebtItem {
  id: string;
  creditor: string;
  type: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  dueDate: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  source: string;
  targetType: "expense" | "income" | "movement" | "budget" | "account";
  draftData: {
    amount?: number;
    description?: string;
    category?: string;
    from_account_name?: string;
    to_account_name?: string;
    date?: string;
  };
  isRead: boolean;
  isProcessed: boolean;
  createdAt?: string;
}

export interface EmailIntegrationData {
  id: string;
  provider: string;
  email: string;
  isActive: boolean;
  lastSyncedAt?: string;
}
