import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileDown,
  PiggyBank,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tags,
  Target,
  Wallet as WalletIcon,
} from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import {
  budgetRate,
  cat,
  categoryExpenses,
  dateISO,
  formatDate,
  monthKey,
  monthNames,
  periodTransactions,
  recent,
  rupiah,
  spentBudget,
  totalBalance,
  totals,
  walletBalance,
} from "../lib/finance";
import {
  DataNotice,
  Empty,
  Heading,
  OpenButton,
  Panel,
  Progress,
  SearchInput,
  StatGrid,
  TransactionTable,
  Button,
} from "../components/UI";
import { BalanceChart } from "../components/Charts";
import type { EntryType, Transaction } from "../lib/types";

function InsightList({
  items,
  max,
}: {
  items: ReturnType<typeof categoryExpenses>;
  max?: number;
}) {
  const total = max ?? items.reduce((n, c) => n + c.value, 0);
  return (
    <div className="flex flex-col gap-5">
      {items.length ? (
        items.map((c) => (
          <div key={c.id}>
            <div className="flex justify-between gap-3 text-sm mb-2">
              <span className="font-semibold">{c.name}</span>
              <span className="font-bold text-[#003d44]">
                {rupiah(c.value)}
              </span>
            </div>
            <Progress
              value={total ? (c.value / total) * 100 : 0}
              color={c.color}
            />
          </div>
        ))
      ) : (
        <Empty />
      )}
    </div>
  );
}
export function Tracker() {
  const { data } = useFin();
  const { open } = useUi();
  const tx = periodTransactions(data),
    categories = categoryExpenses(data, tx);
  return (
    <>
      <Heading
        title="Money Tracker"
        subtitle="Catat pemasukan dan pengeluaran lebih cepat."
        actions={<OpenButton kind="transaction" />}
      />
      <StatGrid data={data} transactions={tx} />
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-2">Quick transaction</h2>
          <p className="section-subtitle mb-5">
            Apa aktivitas keuanganmu hari ini?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="quick-tile"
              onClick={() => open({ kind: "transaction", type: "INCOME" })}
            >
              <span className="quick-icon green">
                <ArrowDownLeft />
              </span>
              <strong>Income</strong>
              <small>Catat pemasukan</small>
            </button>
            <button
              className="quick-tile"
              onClick={() => open({ kind: "transaction", type: "EXPENSE" })}
            >
              <span className="quick-icon gold">
                <ArrowUpRight />
              </span>
              <strong>Expense</strong>
              <small>Catat pengeluaran</small>
            </button>
          </div>
          <h3 className="panel-title mt-8 mb-3">Recently added</h3>
          <TransactionTable items={recent(data).slice(0, 4)} />
        </Panel>
        <Panel className="panel-inner">
          <div className="flex justify-between items-center mb-5">
            <h2 className="panel-title">Top Spending</h2>
            <Link to="/analytics" className="section-link">
              Analytics
            </Link>
          </div>
          <InsightList items={categories.slice(0, 5)} />
          <DataNotice />
        </Panel>
      </div>
    </>
  );
}
const txToCsv = (
  items: Transaction[],
  data: ReturnType<typeof useFin>["data"],
) => {
  const header = [
    ["Tanggal", "Jenis", "Deskripsi", "Kategori", "Wallet", "Nominal IDR"],
  ];
  const rows = items.map((t) => [
    t.date,
    t.type,
    t.description,
    cat(data, t.categoryId).name,
    data.wallets.find((w) => w.id === t.walletId)?.name ?? "",
    t.type === "INCOME" ? t.amount : -t.amount,
  ]);
  const body =
    "\uFEFF" +
    [...header, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");
  const link = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([body], { type: "text/csv;charset=utf-8" }),
    );
  link.href = url;
  link.download = "fintrack-transactions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
export function Transactions() {
  const { data } = useFin();
  const { notify } = useUi();
  const [search, setSearch] = useState(""),
    [type, setType] = useState<"ALL" | EntryType>("ALL"),
    [walletId, setWallet] = useState("ALL"),
    [month, setMonth] = useState("ALL");
  const items = useMemo(
    () =>
      recent(data).filter(
        (t) =>
          (type === "ALL" || t.type === type) &&
          (walletId === "ALL" || t.walletId === walletId) &&
          (month === "ALL" || t.date.slice(0, 7) === month) &&
          `${t.description} ${cat(data, t.categoryId).name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, search, type, walletId, month],
  );
  const periods = Array.from(
    new Set(data.transactions.map((t) => t.date.slice(0, 7))),
  )
    .sort()
    .reverse();
  return (
    <>
      <Heading
        title="Transactions"
        subtitle="Semua pemasukan dan pengeluaran dalam satu tempat."
        actions={
          <>
            <Button
              tone="outline"
              icon={Download}
              onClick={() => {
                txToCsv(items, data);
                notify("CSV berhasil diunduh");
              }}
            >
              Export CSV
            </Button>
            <OpenButton kind="transaction" />
          </>
        }
      />
      <StatGrid data={data} transactions={items} />
      <Panel className="panel-inner mt-5">
        <div className="panel-heading-row">
          <h2 className="panel-title">
            Transaction History{" "}
            <span className="muted text-sm font-normal">({items.length})</span>
          </h2>
        </div>
        <div className="filters-row">
          <SearchInput value={search} onChange={setSearch} />
          <select
            className="input-control"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            aria-label="Jenis transaksi"
          >
            <option value="ALL">Semua jenis</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select
            className="input-control"
            value={walletId}
            onChange={(e) => setWallet(e.target.value)}
            aria-label="Wallet"
          >
            <option value="ALL">Semua wallet</option>
            {data.wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select
            className="input-control"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Bulan"
          >
            <option value="ALL">Semua bulan</option>
            {periods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <TransactionTable items={items} showActions showWallet />
      </Panel>
    </>
  );
}
export function Analytics() {
  const { data } = useFin();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const tx = periodTransactions(data, period),
    t = totals(tx),
    categories = categoryExpenses(data, tx);
  return (
    <>
      <Heading
        title="Analytics"
        subtitle="Pahami kebiasaan pengeluaran dan arus kasmu."
        actions={
          <div className="period-switch">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={period === p ? "active" : ""}
              >
                {p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
              </button>
            ))}
          </div>
        }
      />
      <StatGrid data={data} transactions={tx} />
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-2">Income vs Expenses</h2>
          <p className="section-subtitle mb-6">Ringkasan periode terpilih</p>
          {[
            ["Income", t.income, "#08bf91"],
            ["Expenses", t.expense, "#ecc55b"],
          ].map(([name, value, color]) => (
            <div key={name} className="mb-7">
              <div className="flex justify-between font-semibold text-sm mb-2">
                <span>{name}</span>
                <span>{rupiah(Number(value))}</span>
              </div>
              <Progress
                value={
                  Math.max(t.income, t.expense, 1)
                    ? (Number(value) / Math.max(t.income, t.expense, 1)) * 100
                    : 0
                }
                color={String(color)}
              />
            </div>
          ))}
          <div className="insight-highlight">
            <span>Net Cash Flow</span>
            <strong
              className={
                t.income - t.expense >= 0 ? "amount-pos" : "amount-neg"
              }
            >
              {rupiah(t.income - t.expense)}
            </strong>
          </div>
        </Panel>
        <Panel className="panel-inner">
          <h2 className="panel-title mb-6">Spending by Category</h2>
          <InsightList items={categories} />
        </Panel>
      </div>
      <Panel className="panel-inner mt-5">
        <h2 className="panel-title mb-2">Balance Trend</h2>
        <BalanceChart />
      </Panel>
    </>
  );
}
export function Wallets() {
  const { data, archiveWallet } = useFin();
  const { open, notify } = useUi();
  return (
    <>
      <Heading
        title="My Wallets"
        subtitle="Pisahkan saldo tunai, bank, dan e-wallet dalam catatanmu."
        actions={<OpenButton kind="wallet" />}
      />
      <div className="wallet-grid">
        {data.wallets.map((w, i) => (
          <Panel key={w.id} className="wallet-ui-card">
            <div className="wallet-header">
              <span
                className="wallet-bubble"
                style={{ background: w.color ?? "#003d44" }}
              >
                <WalletIcon size={20} />
              </span>
              <span className="status-pill">
                {w.status === "ACTIVE" ? "Active" : "Archived"}
              </span>
            </div>
            <p className="muted text-xs mt-5">
              {w.type} · {w.name}
            </p>
            <h2 className="wallet-amount">{rupiah(walletBalance(w, data))}</h2>
            <p className="muted text-xs mt-2">Saldo awal {rupiah(w.initial)}</p>
            <div className="wallet-footer">
              <button
                onClick={() => open({ kind: "wallet", id: w.id })}
                className="link-button"
              >
                <Edit3 size={14} /> Edit
              </button>
              {w.status === "ACTIVE" && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Arsipkan wallet ini? Riwayat transaksi tetap tersimpan.",
                      )
                    ) {
                      archiveWallet(w.id);
                      notify("Wallet diarsipkan");
                    }
                  }}
                  className="link-button"
                >
                  Arsipkan
                </button>
              )}
            </div>
            <span className="wallet-number">0{i + 1}</span>
          </Panel>
        ))}
      </div>
      <DataNotice />
    </>
  );
}
export function Budgets() {
  const { data } = useFin();
  const now = new Date(),
    budgets = data.budgets.filter(
      (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear(),
    );
  const spent = budgets.reduce((v, b) => v + spentBudget(b, data), 0),
    max = budgets.reduce((v, b) => v + b.limit, 0);
  const { open } = useUi();
  return (
    <>
      <Heading
        title="Monthly Budgets"
        subtitle="Rencanakan batas pengeluaran agar tetap terkendali."
        actions={<OpenButton kind="budget" />}
      />
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Total Budget</p>
          <h3 className="kpi-value">{rupiah(max)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Already Spent</p>
          <h3 className="kpi-value">{rupiah(spent)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Remaining</p>
          <h3 className="kpi-value">{rupiah(Math.max(0, max - spent))}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Usage</p>
          <h3 className="kpi-value">
            {max ? Math.round((spent / max) * 100) : 0}%
          </h3>
        </div>
      </div>
      <div className="cards-grid mt-5">
        {budgets.map((b) => {
          const u = spentBudget(b, data),
            pct = budgetRate(b, data);
          return (
            <Panel className="progress-item" key={b.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="panel-title">
                    {cat(data, b.categoryId).name}
                  </h3>
                  <p className="section-subtitle">
                    {monthNames[b.month - 1]} {b.year}
                  </p>
                </div>
                <span
                  className={`status-pill ${pct >= 100 ? "status-over" : ""}`}
                >
                  {pct >= 100 ? "Exceeded" : pct >= 80 ? "Warning" : "On track"}
                </span>
              </div>
              <h3 className="progress-big">
                {rupiah(u)}
                <span className="text-xs font-medium muted">
                  {" "}
                  / {rupiah(b.limit)}
                </span>
              </h3>
              <Progress
                value={pct}
                color={
                  pct >= 100 ? "#d5816c" : pct >= 80 ? "#edc14c" : "#00ba8d"
                }
              />
              <div className="flex justify-between mt-3 text-xs muted">
                <span>{pct}% digunakan</span>
                <span>{rupiah(Math.max(b.limit - u, 0))} tersisa</span>
              </div>
              <button
                className="link-button mt-5"
                onClick={() => open({ kind: "budget", id: b.id })}
              >
                <Edit3 size={14} /> Edit Budget
              </button>
            </Panel>
          );
        })}
      </div>
      {!budgets.length && (
        <Panel className="panel-inner mt-5">
          <Empty title="Belum ada budget" />
        </Panel>
      )}
    </>
  );
}
export function Savings() {
  const { data } = useFin(),
    { open } = useUi();
  const total = data.goals.reduce((n, g) => n + g.allocated, 0);
  return (
    <>
      <Heading
        title="Savings Goals"
        subtitle="Wujudkan tujuan keuangan lewat alokasi tabungan."
        actions={<OpenButton kind="goal" />}
      />
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Total Saved</p>
          <h3 className="kpi-value">{rupiah(total)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Goals</p>
          <h3 className="kpi-value">{data.goals.length}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Completed</p>
          <h3 className="kpi-value">
            {data.goals.filter((g) => g.allocated >= g.target).length}
          </h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Unallocated Balance</p>
          <h3 className="kpi-value">{rupiah(totalBalance(data) - total)}</h3>
        </div>
      </div>
      <div className="cards-grid mt-5">
        {data.goals.map((g) => (
          <Panel key={g.id} className="progress-item">
            <div className="flex justify-between items-start">
              <span className="round-icon">
                <Target size={20} />
              </span>
              <span className="status-pill">
                {g.allocated >= g.target ? "Completed" : "In progress"}
              </span>
            </div>
            <h3 className="panel-title mt-5">{g.name}</h3>
            <p className="section-subtitle mt-1">
              {g.date ? `Target ${formatDate(g.date)}` : "Tidak ada tenggat"}
            </p>
            <h3 className="progress-big">
              {rupiah(g.allocated)}{" "}
              <span className="text-xs muted">/ {rupiah(g.target)}</span>
            </h3>
            <Progress value={(g.allocated / g.target) * 100} color={g.color} />
            <div className="flex justify-between mt-3 text-xs muted">
              <span>
                {Math.round((g.allocated / g.target) * 100)}% tercapai
              </span>
              <span>{rupiah(g.target - g.allocated)} tersisa</span>
            </div>
            <button
              className="btn btn-primary w-full justify-center mt-6"
              onClick={() => open({ kind: "allocation", id: g.id })}
            >
              <Plus size={15} /> Add Savings
            </button>
          </Panel>
        ))}
      </div>
      <p className="section-subtitle mt-5">
        Alokasi hanya pencadangan virtual, bukan pengeluaran atau transfer bank.
      </p>
    </>
  );
}
export function Recurring() {
  const { data, toggleRecurring, runRecurring } = useFin(),
    { notify } = useUi();
  return (
    <>
      <Heading
        title="Recurring Transactions"
        subtitle="Atur pengeluaran atau pemasukan rutin (mode demo manual)."
        actions={<OpenButton kind="recurring" />}
      />
      <Panel className="panel-inner">
        <div className="panel-heading-row mb-5">
          <h2 className="panel-title">Scheduled rules</h2>
          <span className="pill-select">{data.recurring.length} rules</span>
        </div>
        <div className="recurring-list">
          {data.recurring.map((r) => (
            <div className="recurring-row" key={r.id}>
              <span className="round-icon">
                <RefreshCw size={19} />
              </span>
              <div className="flex-1">
                <h3 className="font-bold">{r.description}</h3>
                <p className="section-subtitle">
                  {r.frequency} · Hari {r.day} · {cat(data, r.categoryId).name}
                </p>
              </div>
              <div className="text-right">
                <strong className="text-base">
                  {r.type === "INCOME" ? "+" : "−"}
                  {rupiah(r.amount)}
                </strong>
                <p className="text-xs muted mt-1">
                  {r.status === "ACTIVE" ? "Aktif" : "Dijeda"}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    toggleRecurring(r.id);
                    notify("Status jadwal diperbarui");
                  }}
                >
                  {r.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <button
                  className="btn btn-soft"
                  onClick={() => {
                    try {
                      runRecurring(r.id);
                      notify("Transaksi demo dibuat (maks. sekali per bulan).");
                    } catch (err) {
                      notify(
                        err instanceof Error
                          ? err.message
                          : "Gagal membuat transaksi",
                      );
                    }
                  }}
                  disabled={r.status !== "ACTIVE"}
                >
                  Run once
                </button>
              </div>
            </div>
          ))}
        </div>
        {!data.recurring.length && <Empty />}
      </Panel>
      <div className="hint-box mt-5">
        <Clock3 size={18} />
        <p>
          <strong>Mode prototype:</strong> jadwal tidak dieksekusi otomatis.
          Tombol <b>Run once</b> hanya demonstrasi, dengan batas satu transaksi
          per bulan per rule. Pada tahap backend perlu queue/worker dan
          idempotency yang tepat untuk frekuensi harian/mingguan/bulanan.
        </p>
      </div>
    </>
  );
}
export function Categories() {
  const { data, archiveCategory } = useFin(),
    { open, notify } = useUi();
  const [type, setType] = useState<EntryType>("EXPENSE");
  return (
    <>
      <Heading
        title="Categories"
        subtitle="Atur pengelompokan pemasukan dan pengeluaran."
        actions={<OpenButton kind="category" />}
      />
      <Panel className="panel-inner">
        <div className="period-switch mb-5">
          <button
            onClick={() => setType("EXPENSE")}
            className={type === "EXPENSE" ? "active" : ""}
          >
            Expense
          </button>
          <button
            onClick={() => setType("INCOME")}
            className={type === "INCOME" ? "active" : ""}
          >
            Income
          </button>
        </div>
        <div className="cards-grid">
          {data.categories
            .filter((c) => c.type === type)
            .map((c) => (
              <div className="category-card" key={c.id}>
                <div className="flex gap-3 items-center">
                  <span
                    className="round-icon"
                    style={{ background: c.color + "30", color: c.color }}
                  >
                    <Tags size={19} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <p className="muted text-xs">
                      {c.isDefault ? "Default" : "Custom"} ·{" "}
                      {c.status === "ACTIVE" ? "Active" : "Archived"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="link-button"
                    onClick={() => open({ kind: "category", id: c.id })}
                  >
                    Edit
                  </button>
                  {c.status === "ACTIVE" && (
                    <button
                      className="link-button text-red-500"
                      onClick={() => {
                        if (window.confirm("Arsipkan kategori?")) {
                          archiveCategory(c.id);
                          notify("Kategori diarsipkan");
                        }
                      }}
                    >
                      Arsip
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Panel>
    </>
  );
}
export function Calendar() {
  const { data } = useFin(),
    { open } = useUi();
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState(dateISO(new Date()));
  const now = new Date(),
    month = new Date(now.getFullYear(), now.getMonth() + offset, 1),
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    start = (month.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: start }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  const ym = monthKey(month),
    selectedTx = recent(data).filter((t) => t.date === selected);
  return (
    <>
      <Heading
        title="Finance Calendar"
        subtitle="Jelajahi aktivitas transaksi per tanggal."
        actions={<OpenButton kind="transaction" />}
      />
      <div className="content-grid">
        <Panel className="panel-inner">
          <div className="flex justify-between items-center mb-7">
            <button
              className="btn btn-outline"
              onClick={() => setOffset((o) => o - 1)}
            >
              ←
            </button>
            <h2 className="panel-title">
              {new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
            <button
              className="btn btn-outline"
              onClick={() => setOffset((o) => o + 1)}
            >
              →
            </button>
          </div>
          <div className="calendar-grid">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
              <span className="calendar-weekday" key={d}>
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              const date = day ? `${ym}-${String(day).padStart(2, "0")}` : null;
              const items = date
                ? data.transactions.filter((t) => t.date === date)
                : [];
              return (
                <button
                  key={i}
                  disabled={!day}
                  className={`calendar-cell ${date === selected ? "selected" : ""}`}
                  onClick={() => date && setSelected(date)}
                >
                  {day && (
                    <>
                      <span>{day}</span>
                      {items.length > 0 && (
                        <span className="calendar-dots">
                          {items.length > 2
                            ? "•••"
                            : items.length === 2
                              ? "••"
                              : "•"}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel className="panel-inner">
          <h2 className="panel-title mb-2">{formatDate(selected)}</h2>
          <p className="section-subtitle mb-5">
            {selectedTx.length} transaksi tercatat
          </p>
          {selectedTx.length ? (
            <div className="flex flex-col gap-3">
              {selectedTx.map((t) => (
                <div
                  className="flex justify-between border-b border-slate-100 py-3"
                  key={t.id}
                >
                  <div>
                    <strong className="text-sm">{t.description}</strong>
                    <p className="muted text-xs">
                      {cat(data, t.categoryId).name}
                    </p>
                  </div>
                  <span
                    className={
                      t.type === "INCOME" ? "amount-pos" : "amount-neg"
                    }
                  >
                    {t.type === "INCOME" ? "+" : "−"}
                    {rupiah(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Tidak ada transaksi pada tanggal ini." />
          )}
          <button
            className="btn btn-primary mt-5"
            onClick={() => open({ kind: "transaction" })}
          >
            <Plus size={15} /> New transaction
          </button>
        </Panel>
      </div>
    </>
  );
}
export function Reports() {
  const { data } = useFin();
  const [start, setStart] = useState(
      dateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    ),
    [end, setEnd] = useState(dateISO(new Date()));
  const items = recent(data).filter((t) => t.date >= start && t.date <= end),
    tx = totals(items),
    expenses = categoryExpenses(data, items);
  return (
    <>
      <Heading
        title="Financial Reports"
        subtitle="Ringkasan transaksi untuk pencatatan dan evaluasi keuangan."
        actions={
          <Button icon={FileDown} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        }
      />
      <Panel className="panel-inner no-print">
        <div className="filters-row">
          <label className="field">
            <span>Dari tanggal</span>
            <input
              className="input-control"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Sampai tanggal</span>
            <input
              className="input-control"
              type="date"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      </Panel>
      <div className="print-heading">
        <h2>Laporan Keuangan FinTrack</h2>
        <p>
          Periode {formatDate(start)} — {formatDate(end)}
        </p>
      </div>
      <div className="kpi-grid mt-5">
        <div className="kpi-card">
          <p className="kpi-label">Income</p>
          <h3 className="kpi-value">{rupiah(tx.income)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Expenses</p>
          <h3 className="kpi-value">{rupiah(tx.expense)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Net Cash Flow</p>
          <h3 className="kpi-value">{rupiah(tx.income - tx.expense)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Transactions</p>
          <h3 className="kpi-value">{items.length}</h3>
        </div>
      </div>
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-4">Expense Breakdown</h2>
          <InsightList items={expenses} />
        </Panel>
        <Panel className="panel-inner">
          <h2 className="panel-title mb-4">Laporan</h2>
          <p className="section-subtitle">
            Semua nominal dihitung dari data demo yang saat ini tercatat dalam
            browser. Ekspor PDF menggunakan dialog cetak browser dan bukan
            generator PDF server.
          </p>
          <div className="insight-highlight mt-5">
            <span>Net Cash Flow</span>
            <strong>{rupiah(tx.income - tx.expense)}</strong>
          </div>
        </Panel>
      </div>
      <Panel className="panel-inner mt-5">
        <h2 className="panel-title">Transaction Details</h2>
        <TransactionTable items={items} showWallet />
      </Panel>
    </>
  );
}
export function Settings() {
  const { data, saveProfile, reset } = useFin(),
    { notify } = useUi();
  const [name, setName] = useState(data.profile.name),
    [email, setEmail] = useState(data.profile.email);
  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      notify("Isi nama dan email dengan benar.");
      return;
    }
    saveProfile({ name: name.trim(), email: email.trim() });
    notify("Profil demo diperbarui.");
  };
  return (
    <>
      <Heading
        title="Account Settings"
        subtitle="Kelola tampilan profil dan data aplikasi demo."
      />
      <div className="content-grid">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-5">Profile Information</h2>
          <form onSubmit={handle} className="flex flex-col gap-4">
            <label className="field">
              <span>Full name</span>
              <input
                className="input-control"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Email address</span>
              <input
                className="input-control"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Default currency</span>
              <input className="input-control" value="IDR (Rupiah)" disabled />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input
                className="input-control"
                value={data.profile.timezone}
                disabled
              />
            </label>
            <Button type="submit">Save Profile</Button>
          </form>
        </Panel>
        <Panel className="panel-inner">
          <h2 className="panel-title mb-5">Demo & Privacy</h2>
          <div className="hint-box">
            <ShieldCheck size={19} />
            <p>
              Data disimpan di <strong>localStorage browser</strong>. Ini bukan
              layanan finansial production, autentikasi nyata, atau penyimpanan
              data aman.
            </p>
          </div>
          <h3 className="font-bold mt-6 mb-3">Reset sample data</h3>
          <p className="section-subtitle">
            Kembalikan semua transaksi, wallet, kategori, dan target ke data
            contoh.
          </p>
          <button
            className="btn btn-outline mt-4"
            onClick={() => {
              if (
                window.confirm("Hapus perubahan dan kembalikan data contoh?")
              ) {
                reset();
                notify("Data demo dikembalikan.");
                setName("Maya Singh");
                setEmail("maya@fintrack.demo");
              }
            }}
          >
            <RefreshCw size={15} /> Reset Demo
          </button>
          <Link className="section-link mt-8" to="/">
            Kembali ke landing page
          </Link>
        </Panel>
      </div>
    </>
  );
}
export function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof WalletIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="feature-card">
      <span className="feature-icon">
        <Icon size={21} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Landing() {
  return (
    <div className="app-frame landing-frame">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-symbol">
            <span />
            <span />
            <span />
            <span />
          </span>
          fintrack<span className="text-emerald-500">.</span>
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
        </nav>
        <div className="flex gap-3">
          <Link to="/login" className="btn btn-outline">
            Sign in
          </Link>
          <Link to="/dashboard" className="btn btn-primary">
            Try Dashboard →
          </Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-content">
            <span className="hero-eyebrow">✦ Manage money with clarity</span>
            <h1>
              Make your money <em>make sense.</em>
            </h1>
            <p>
              Catat pemasukan, pantau pengeluaran, atur budget, dan capai tujuan
              tabungan melalui satu dashboard yang simpel dan elegan.
            </p>
            <div className="flex gap-3 flex-wrap mt-7">
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Explore Demo Dashboard →
              </Link>
              <a href="#features" className="btn btn-outline btn-large">
                See Features
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} /> Mulai dari data demo. Tanpa koneksi
              rekening.
            </div>
          </div>
          <div className="hero-preview">
            <div className="preview-top">
              <div>
                <span className="muted text-xs">Total Balance</span>
                <h3>{rupiah(34750000)}</h3>
              </div>
              <span className="trend-capsule">↗ +12.8%</span>
            </div>
            <div className="preview-columns">
              {[40, 55, 48, 63, 52, 73, 66, 78, 68, 85, 72, 96].map((v, i) => (
                <span
                  key={i}
                  style={{
                    height: `${v}%`,
                    background: i === 11 ? "#003d44" : "#d6e8e1",
                  }}
                />
              ))}
            </div>
            <div className="preview-bottom">
              <span>
                <ArrowDownLeft size={15} /> Income <b>+Rp9.580.000</b>
              </span>
              <span>
                <ArrowUpRight size={15} /> Expense <b>−Rp1.580.000</b>
              </span>
            </div>
            <div className="preview-goal">
              <span className="round-icon">
                <PiggyBank />
              </span>
              <div>
                <strong>Savings Goals</strong>
                <p>Sudah 75% dari target</p>
              </div>
              <span className="trend-capsule">75%</span>
            </div>
          </div>
        </section>
        <section id="features" className="landing-section">
          <div className="center-heading">
            <span className="eyebrow">ALL-IN-ONE FINANCIAL TRACKER</span>
            <h2>Everything you need to grow your money.</h2>
            <p>
              Mulai dari transaksi harian hingga rencana jangka panjang,
              semuanya dirancang supaya mudah dipakai.
            </p>
          </div>
          <div className="feature-grid">
            <FeatureCard
              icon={WalletIcon}
              title="Smart Wallets"
              text="Pantau saldo tunai, rekening, dan e-wallet secara manual dari satu tempat."
            />
            <FeatureCard
              icon={ChartNoAxesCombined}
              title="Visual Analytics"
              text="Lihat grafik pemasukan, pengeluaran, dan tren saldo."
            />
            <FeatureCard
              icon={Target}
              title="Savings Goals"
              text="Buat target dan lihat progres tabungan secara real-time."
            />
            <FeatureCard
              icon={CalendarDays}
              title="Money Calendar"
              text="Jelajahi riwayat transaksi melalui kalender bulanan."
            />
            <FeatureCard
              icon={Tags}
              title="Monthly Budgets"
              text="Tetapkan batas belanja agar pengeluaran lebih terkontrol."
            />
            <FeatureCard
              icon={FileDown}
              title="Easy Reports"
              text="Unduh CSV atau simpan laporan sebagai PDF melalui browser."
            />
          </div>
        </section>
        <section id="how" className="landing-how">
          <div>
            <span className="eyebrow">SIMPLE WORKFLOW</span>
            <h2>Get started in three simple steps.</h2>
            <p>Rancang keuangan dengan alur yang tidak rumit.</p>
          </div>
          <div className="steps-list">
            {[
              [
                "01",
                "Set up your wallets",
                "Buat rekening virtual untuk setiap sumber dana.",
              ],
              [
                "02",
                "Track every transaction",
                "Catat pemasukan dan pengeluaran sesuai kategori.",
              ],
              [
                "03",
                "See the whole picture",
                "Pantau dashboard, budget, target tabungan, dan laporan.",
              ],
            ].map(([n, title, description]) => (
              <div className="step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="about" className="landing-cta">
          <h2>Build better money habits, starting today.</h2>
          <p>Coba dashboard FinTrack dengan data contoh.</p>
          <Link to="/dashboard" className="btn btn-primary btn-large">
            Open Interactive Demo →
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} FinTrack — UI Portfolio Project
        </span>
        <span>React + TypeScript + Tailwind CSS</span>
      </footer>
    </div>
  );
}
export function Auth({ mode }: { mode: "login" | "register" }) {
  const { notify } = useUi();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const label = mode === "login" ? "Welcome back" : "Create an account";
  return (
    <div className="app-frame">
      <div className="auth-frame">
        <div className="auth-left">
          <Link to="/" className="brand">
            <span className="brand-symbol">
              <span />
              <span />
              <span />
              <span />
            </span>
            fintrack.
          </Link>
          <div className="auth-left-content">
            <span className="hero-eyebrow">Your money. Your future.</span>
            <h1>Take control of your financial story.</h1>
            <p>
              Every expense is a step toward clarity. Start making confident
              financial decisions with FinTrack.
            </p>
            <div className="auth-art">
              <div className="auth-balance-label">TOTAL SAVINGS</div>
              <strong>Rp23.000.000</strong>
              <div className="auth-mini-bars">
                {[30, 47, 35, 61, 53, 74, 81, 66, 94].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          <p>FinTrack — Personal finance made simple.</p>
        </div>
        <div className="auth-right">
          <Link
            to="/"
            className="text-sm text-teal-900 font-semibold mb-14 inline-block"
          >
            ← Back to home
          </Link>
          <div className="auth-form-box">
            <h1>{label}</h1>
            <p className="section-subtitle mb-8">
              {mode === "login"
                ? "Sign in to see your financial dashboard."
                : "Create a demo account to explore FinTrack."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length < 6) {
                  notify("Password demo minimal 6 karakter.");
                  return;
                }
                if (mode === "register" && !name.trim()) {
                  notify("Nama harus diisi.");
                  return;
                }
                if (!email) {
                  notify("Email harus diisi.");
                  return;
                }
                notify(
                  "Autentikasi masih simulasi; dashboard demo tersedia tanpa login.",
                );
                window.location.assign("/dashboard");
              }}
              className="flex flex-col gap-4"
            >
              {mode === "register" && (
                <label className="field">
                  <span>Full name</span>
                  <input
                    className="input-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                  />
                </label>
              )}
              <label className="field">
                <span>Email</span>
                <input
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <div className="password-field">
                  <input
                    className="input-control"
                    type={show ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    title="Show password"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </label>
              <Button type="submit" icon={null}>
                {mode === "login" ? "Sign in (Demo)" : "Register (Demo)"} →
              </Button>
            </form>
            <p className="text-center mt-6 text-sm muted">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link to="/register" className="font-bold text-teal-800">
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <Link to="/login" className="font-bold text-teal-800">
                    Sign in
                  </Link>
                </>
              )}
            </p>
            <p className="demo-disclaimer mt-8">
              <ShieldCheck size={14} /> Form simulasi, tidak membuat akun atau
              menyimpan password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
