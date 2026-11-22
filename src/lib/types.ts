export type EntryType = "INCOME" | "EXPENSE";
export type WalletType = "BANK" | "CASH" | "EWALLET" | "OTHER";
export type WalletStatus = "ACTIVE" | "ARCHIVED";
export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Profile {
  name: string;
  email: string;
  currency: "IDR";
  timezone: string;
  avatarUrl?: string;
  createdAt?: string;
}
export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initial: number;
  status: WalletStatus;
  color?: string;
  accountNumber?: string;
  cardImage?: string;
  allocated?: number;
}
export interface Category {
  id: string;
  name: string;
  type: EntryType;
  icon: string;
  color: string;
  status: WalletStatus;
  isDefault: boolean;
}
export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: EntryType;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}
export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  month: number;
  year: number;
}
export interface Goal {
  id: string;
  name: string;
  target: number;
  allocated: number;
  color: string;
  date: string;
  walletId?: string;
  allocations?: Record<string, number>;
}
export interface Recurring {
  id: string;
  description: string;
  type: EntryType;
  amount: number;
  categoryId: string;
  walletId: string;
  frequency: RecurringFrequency;
  day: number;
  status: WalletStatus;
  lastRun: string;
  nextRun?: string;
}
export interface FinState {
  profile: Profile;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: Recurring[];
}
export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
export type WalletInput = Omit<Wallet, "id">;
export type CategoryInput = Omit<Category, "id" | "isDefault">;
export type GoalInput = Omit<Goal, "id" | "allocated">;
export type BudgetInput = Omit<Budget, "id">;
export type RecurringInput = Omit<Recurring, "id" | "lastRun">;
