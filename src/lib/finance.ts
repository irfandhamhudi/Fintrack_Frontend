import type {
  Budget,
  Category,
  EntryType,
  FinState,
  Transaction,
  Wallet,
} from "./types";

export const id = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const dateISO = (v: Date) =>
  `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
export const todayISO = () => dateISO(new Date());
export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const compact = (n: number) =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)} M`
    : n >= 1e6
      ? `${(n / 1e6).toFixed(1)} jt`
      : n >= 1e3
        ? `${(n / 1e3).toFixed(0)} rb`
        : rupiah(n);
export const formatDate = (s: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${s}T12:00:00`));
export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
export const cat = (s: FinState, id: string): Category =>
  s.categories.find((c) => c.id === id) ?? {
    id: "missing",
    name: "Lainnya",
    type: "EXPENSE",
    icon: "tags",
    color: "#b4cac2",
    status: "ACTIVE",
    isDefault: false,
  };
export const wallet = (s: FinState, id: string): Wallet =>
  s.wallets.find((w) => w.id === id) ?? {
    id: "missing",
    name: "Tidak ditemukan",
    type: "OTHER",
    initial: 0,
    status: "ARCHIVED",
  };
export const recent = (s: FinState) =>
  [...s.transactions].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
export const periodTransactions = (
  s: FinState,
  period: "week" | "month" | "year" = "month",
) => {
  const now = new Date();
  const end = todayISO();
  let start: string;
  if (period === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    start = dateISO(d);
  } else if (period === "year") start = `${now.getFullYear()}-01-01`;
  else start = `${monthKey(now)}-01`;
  const periodEnd =
    period === "week"
      ? end
      : period === "month"
        ? `${monthKey(now)}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`
        : `${now.getFullYear()}-12-31`;
  return s.transactions.filter((t) => t.date >= start && t.date <= periodEnd);
};
export const totals = (items: Transaction[]) =>
  items.reduce(
    (r, t) => ({
      ...r,
      [t.type === "INCOME" ? "income" : "expense"]:
        r[t.type === "INCOME" ? "income" : "expense"] + t.amount,
    }),
    { income: 0, expense: 0 },
  );
export const walletBalance = (w: Wallet, s: FinState) => {
  const transactions = s.transactions
    .filter((t) => t.walletId === w.id)
    .reduce((v, t) => v + (t.type === "INCOME" ? t.amount : -t.amount), 0);
  const allocated =
    w.allocated ??
    s.goals.reduce(
      (sum, goal) =>
        sum +
        (goal.allocations?.[w.id] ??
          (goal.walletId === w.id ? goal.allocated : 0)),
      0,
    );
  return w.initial + transactions - allocated;
};
export const totalBalance = (s: FinState) =>
  s.wallets.reduce((sum, w) => sum + walletBalance(w, s), 0);
export const spentBudget = (b: Budget, s: FinState) =>
  s.transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        t.categoryId === b.categoryId &&
        +t.date.slice(5, 7) === b.month &&
        +t.date.slice(0, 4) === b.year,
    )
    .reduce((sum, t) => sum + t.amount, 0);
export const categoryExpenses = (s: FinState, items: Transaction[]) =>
  s.categories
    .filter((c) => c.type === "EXPENSE")
    .map((c) => ({
      ...c,
      value: items
        .filter((t) => t.type === "EXPENSE" && t.categoryId === c.id)
        .reduce((a, t) => a + t.amount, 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
export type BalancePeriod = "week" | "month" | "year";
export type BalancePoint = { label: string; detail: string; balance: number };

const balanceAt = (s: FinState, cutoff: string) => {
  const change = s.transactions
    .filter((t) => t.date <= cutoff)
    .reduce((n, t) => n + (t.type === "INCOME" ? t.amount : -t.amount), 0);
  return s.wallets.reduce((n, w) => n + w.initial, 0) + change;
};

export const balancePoints = (
  s: FinState,
  period: BalancePeriod = "month",
): BalancePoint[] => {
  const now = new Date();
  if (period === "week")
    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - idx));
      const date = dateISO(day);
      return {
        label: day
          .toLocaleDateString("id-ID", { weekday: "short" })
          .replace(".", ""),
        detail: formatDate(date),
        balance: date > todayISO() ? 0 : balanceAt(s, date),
      };
    });
  if (period === "month")
    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const monthNumber = String(month).padStart(2, "0");
      const lastDay = new Date(now.getFullYear(), month, 0).getDate();
      const cutoff = `${now.getFullYear()}-${monthNumber}-${String(lastDay).padStart(2, "0")}`;
      const isFuture = month > now.getMonth() + 1;
      return {
        label: monthNames[idx],
        detail: `${monthNames[idx]} ${now.getFullYear()}`,
        balance: isFuture ? 0 : balanceAt(s, cutoff),
      };
    });
  const years = [
    ...new Set([
      now.getFullYear(),
      ...s.transactions.map((t) => Number(t.date.slice(0, 4))),
    ]),
  ].sort((a, b) => a - b);
  return years.map((year) => ({
    label: String(year),
    detail: `Tahun ${year}`,
    balance: year > now.getFullYear() ? 0 : balanceAt(s, `${year}-12-31`),
  }));
};

export const monthlyBalances = (s: FinState) =>
  balancePoints(s, "month").map((point, idx) => ({
    month: point.label,
    year: new Date().getFullYear(),
    balance: point.balance,
    detail: point.detail,
    index: idx,
  }));
export type BudgetAlertLevel = "ok" | "warning" | "over";
export const budgetAlertLevel = (b: Budget, s: FinState): BudgetAlertLevel => {
  const rate = budgetRate(b, s);
  return rate >= 100 ? "over" : rate >= 80 ? "warning" : "ok";
};
export const budgetRate = (b: Budget, s: FinState) =>
  b.limit > 0 ? Math.round((spentBudget(b, s) * 100) / b.limit) : 0;

export type ForecastPoint = {
  date: string;
  label: string;
  balance: number;
  change: number;
};
export const cashFlowForecast = (s: FinState, days = 30): ForecastPoint[] => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + days);
  const recurring = s.recurring.filter((item) => item.status === "ACTIVE");
  let balance = totalBalance(s);
  return Array.from({ length: days + 1 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = dateISO(date);
    const change = recurring
      .filter((item) => item.nextRun === iso)
      .reduce(
        (sum, item) =>
          sum + (item.type === "INCOME" ? item.amount : -item.amount),
        0,
      );
    balance += change;
    return {
      date: iso,
      label: date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      balance,
      change,
    };
  }).filter((point) => point.date <= dateISO(end));
};
export const validateAmount = (n: number) => Number.isSafeInteger(n) && n > 0;
export const sameCategoryType = (
  s: FinState,
  categoryId: string,
  type: EntryType,
) =>
  s.categories.some(
    (c) => c.id === categoryId && c.type === type && c.status === "ACTIVE",
  );
