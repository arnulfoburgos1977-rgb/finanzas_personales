export type AppView = 'dashboard' | 'movements' | 'detail' | 'add' | 'add_income';

export interface UserAccount {
  uid: string;
  email?: string;
  displayName?: string;
  monthlyBudget: number;
  hasCompletedOnboarding: boolean;
}

export interface Transaction {
  id: string;
  ownerId?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  isoDate?: string;
  time?: string;
  description: string;
  icon: string;
  notes?: string;
  paymentMethod?: string;
  createdAtMs?: number;
}

export interface DailySpending {
  day: number;
  amount: number;
  actual?: number;
}

export interface BudgetSummary {
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  percentSpent: number;
}
