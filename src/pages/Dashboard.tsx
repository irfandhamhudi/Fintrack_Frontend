import { useEffect, useState } from "react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
// import { useUi } from "../context/UiContext";
import {
  periodTransactions,
  recent,
  rupiah,
  totalBalance,
  totals,
} from "../lib/finance";
import { BalanceChart, MetricCard, SavingsSidebar } from "../components/Charts";
import { Select } from "../components/ui/select";
import {
  FilterLink,
  Panel,
  SearchInput,
  TransactionTable,
} from "../components/UI";

export default function Dashboard() {
  const { data } = useFin();
  const { selectedWalletId, setSelectedWalletId } = useUi();
  const [period, setPeriod] = useState<"week" | "month" | "year">(
    () =>
      (localStorage.getItem("fintrack-dashboard-period") as
        | "week"
        | "month"
        | "year"
        | null) ?? "month",
  );
  useEffect(() => {
    localStorage.setItem("fintrack-dashboard-period", period);
  }, [period]);
  const [search, setSearch] = useState("");
  const filteredData =
    selectedWalletId === "ALL"
      ? data
      : {
          ...data,
          wallets: data.wallets.filter(
            (wallet) => wallet.id === selectedWalletId,
          ),
          transactions: data.transactions.filter(
            (transaction) => transaction.walletId === selectedWalletId,
          ),
          recurring: data.recurring.filter(
            (recurring) => recurring.walletId === selectedWalletId,
          ),
          goals: data.goals.filter(
            (goal) =>
              (goal.allocations?.[selectedWalletId] ??
                (goal.walletId === selectedWalletId ? goal.allocated : 0)) > 0,
          ),
        };
  const financial = totals(periodTransactions(filteredData, period)),
    saved = data.goals.reduce(
      (total, goal) =>
        total +
        (selectedWalletId === "ALL"
          ? goal.allocated
          : (goal.allocations?.[selectedWalletId] ??
            (goal.walletId === selectedWalletId ? goal.allocated : 0))),
      0,
    ),
    balance = totalBalance(filteredData),
    availableBalance = balance,
    selectedWallet = data.wallets.find(
      (wallet) => wallet.id === selectedWalletId,
    ),
    balanceLabel = selectedWallet
      ? `Saldo ${selectedWallet.name}`
      : "Saldo Semua Wallet",
    balanceContext = selectedWallet
      ? `Wallet terpilih · ${selectedWallet.name}`
      : "Gabungan seluruh wallet aktif",
    percentage = (value: number) =>
      `${financial.income > 0 ? Math.round((value / financial.income) * 100) : 0}%`,
    incomePercentage = financial.income > 0 ? "100%" : "0%";
  const tx = recent(filteredData)
    .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);
  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <Panel className="stats-panel">
          <div className="dashboard-wallet-filter">
            <span className="muted text-xs">Tampilan wallet</span>
            <Select
              value={selectedWalletId}
              onValueChange={setSelectedWalletId}
              options={[
                { value: "ALL", label: "Semua wallet" },
                ...data.wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                })),
              ]}
            />
          </div>
          <MetricCard
            title="Pemasukan"
            amount={financial.income}
            trend={incomePercentage}
          />
          <MetricCard
            title="Pengeluaran"
            amount={financial.expense}
            trend={percentage(financial.expense)}
          />
          <MetricCard
            title="Tabungan"
            amount={saved}
            trend={percentage(saved)}
          />
        </Panel>
        <Panel className="chart-panel dashboard-balance-panel">
          <div className="chart-heading">
            <div>
              <div className="balance-heading">
                <h2 className="panel-title">Saldo Tersedia</h2>
                <span
                  className={`balance-scope ${selectedWallet ? "wallet" : "all"}`}
                >
                  {selectedWallet ? "Wallet" : "Semua"}
                </span>
              </div>
              <div className="balance-value">
                {rupiah(availableBalance)}{" "}
                <span className="metric-trend">
                  {percentage(availableBalance)}
                </span>
              </div>
              <p className="section-subtitle mt-1">
                {balanceContext} · {balanceLabel}: {rupiah(balance)}
              </p>
            </div>
            <div className="period-switch">
              {(["week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  className={period === p ? "active" : ""}
                  onClick={() => setPeriod(p)}
                >
                  {p === "week" ? "Minggu" : p === "month" ? "Bulan" : "Tahun"}
                </button>
              ))}
            </div>
          </div>
          <BalanceChart period={period} sourceData={filteredData} />
          <p className="text-xs text-slate-400 mt-2">
            Grafik menunjukkan saldo akhir sesuai periode yang dipilih. Tekan
            titik untuk melihat detail.
          </p>
        </Panel>
        <Panel className="history-panel">
          <div className="panel-heading-row">
            <h2 className="panel-title">Riwayat Transaksi</h2>
            <div className="table-actions">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari"
              />
              <FilterLink />
            </div>
          </div>
          <TransactionTable items={tx} />
          {/* <button
            className="text-xs text-teal-800 font-bold mt-3 mb-3"
            onClick={() => open({ kind: "transaction" })}
          >
            + Tambah transaksi baru
          </button> */}
        </Panel>
      </div>
      <Panel className="side-panel">
        <SavingsSidebar />
      </Panel>
    </div>
  );
}
