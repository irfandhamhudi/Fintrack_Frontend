import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { BudgetInput, CategoryInput, FinState, GoalInput, Profile, RecurringInput, TransactionInput, WalletInput } from "../lib/types";
import { api } from "../lib/api";
import { seed } from "../lib/seed";
import { useAuth } from "./AuthContext";

interface StoreApi {
  data: FinState;
  loading: boolean;
  addTransaction: (v: TransactionInput, currentId?: string) => void;
  removeTransaction: (id: string) => void;
  saveWallet: (w: WalletInput, currentId?: string) => Promise<void>;
  archiveWallet: (id: string) => void;
  unarchiveWallet: (id: string) => void;
  removeWallet: (id: string) => void;
  saveCategory: (c: CategoryInput, currentId?: string) => void;
  archiveCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  saveBudget: (b: BudgetInput, currentId?: string) => void;
  saveGoal: (g: GoalInput, currentId?: string) => void;
  removeGoal: (id: string) => void;
  allocateGoal: (goalId: string, amount: number, walletId: string) => void;
  saveRecurring: (r: RecurringInput) => void;
  toggleRecurring: (id: string) => void;
  runRecurring: (id: string) => void;
  saveProfile: (p: Pick<Profile, "name" | "email"> & { avatarUrl?: string }) => Promise<void>;
  reset: () => void;
}
const StoreContext = createContext<StoreApi | null>(null);
const normalize = <T,>(items: T[] | undefined) => Array.isArray(items) ? items : [];

export function FinProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<FinState>(seed());
  const [loading, setLoading] = useState(false);
  const reload = async () => {
    if (!user) { setData(seed()); return; }
    setLoading(true);
    try {
      const [wallets, categories, transactions, budgets, goals, recurring] = await Promise.all([api.wallets.list(), api.categories.list(), api.transactions.list(), api.budgets.list(), api.goals.list(), api.recurring.list()]);
      setData({ profile: { name: user.name, email: user.email, currency: "IDR", timezone: "Asia/Jakarta", avatarUrl: user.avatarUrl, createdAt: user.createdAt }, wallets: normalize(wallets), categories: normalize(categories), transactions: normalize(transactions), budgets: normalize(budgets), goals: normalize(goals), recurring: normalize(recurring) } as FinState);
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, [user?.id]);
  const refresh = (action: Promise<unknown>) => { void action.then(reload); };
  const addTransaction = (v: TransactionInput, currentId?: string) => refresh(currentId ? api.transactions.update(currentId, v) : api.transactions.create(v));
  const removeTransaction = (itemId: string) => refresh(api.transactions.remove(itemId));
  const saveWallet = async (v: WalletInput, currentId?: string) => {
    await (currentId ? api.wallets.update(currentId, v) : api.wallets.create(v));
    await reload();
  };
  const archiveWallet = (itemId: string) => refresh(api.wallets.update(itemId, { status: "ARCHIVED" }));
  const unarchiveWallet = (itemId: string) => refresh(api.wallets.update(itemId, { status: "ACTIVE" }));
  const removeWallet = (itemId: string) => refresh(api.wallets.remove(itemId));
  const saveCategory = (v: CategoryInput, currentId?: string) => refresh(currentId ? api.categories.update(currentId, v) : api.categories.create({ ...v, isDefault: false }));
  const archiveCategory = (itemId: string) => refresh(api.categories.update(itemId, { status: "ARCHIVED" }));
  const removeCategory = (itemId: string) => refresh(api.categories.remove(itemId));
  const saveBudget = (v: BudgetInput, currentId?: string) => refresh(currentId ? api.budgets.update(currentId, v) : api.budgets.create(v));
  const saveGoal = (v: GoalInput, currentId?: string) => refresh(currentId ? api.goals.update(currentId, v) : api.goals.create(v));
  const removeGoal = (itemId: string) => refresh(api.goals.remove(itemId));
  const allocateGoal = (goalId: string, amount: number, walletId: string) => refresh(api.goals.update(goalId, { allocated: amount, walletId }));
  const saveRecurring = (v: RecurringInput) => refresh(api.recurring.create(v));
  const toggleRecurring = (itemId: string) => { const item = data.recurring.find((entry) => entry.id === itemId); if (item) refresh(api.recurring.update(itemId, { status: item.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" })); };
  const runRecurring = (itemId: string) => refresh(api.recurring.update(itemId, { runNow: true }));
  const saveProfile = async (p: Pick<Profile, "name" | "email"> & { avatarUrl?: string }) => {
    await api.auth.updateMe(p);
    await reload();
  };
  const reset = () => { setData(seed()); void reload(); };
  return <StoreContext.Provider value={{ data, loading, addTransaction, removeTransaction, saveWallet, archiveWallet, unarchiveWallet, removeWallet, saveCategory, archiveCategory, removeCategory, saveBudget, saveGoal, removeGoal, allocateGoal, saveRecurring, toggleRecurring, runRecurring, saveProfile, reset }}>{children}</StoreContext.Provider>;
}
export function useFin() { const context = useContext(StoreContext); if (!context) throw new Error("useFin must be used within FinProvider"); return context; }
