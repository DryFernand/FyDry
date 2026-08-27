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

export interface AccountItem {
  id: string;
  name: string;
  type: "bank" | "card" | "wallet" | "cash";
  balance: number;
  currency: string;
  accountNumber?: string;
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
