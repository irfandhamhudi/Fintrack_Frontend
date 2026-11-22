import type { FinState } from "./types";

export function seed(): FinState {
  return {
    profile: {
      name: "Pengguna FinTrack",
      email: "pengguna@fintrack.demo",
      currency: "IDR",
      timezone: "Asia/Jakarta",
    },
    wallets: [],
    categories: [],
    transactions: [],
    budgets: [],
    goals: [],
    recurring: [],
  };
}
