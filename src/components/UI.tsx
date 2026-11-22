import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  FileChartColumn,
  Filter,
  Inbox,
  Plus,
  Search,
  Target,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { useUi, type ModalKind } from "../context/UiContext";
import { useFin } from "../context/FinContext";
import { cat, compact, formatDate, rupiah, wallet } from "../lib/finance";
import type { FinState, Transaction } from "../lib/types";

export function Brand({ expanded = true }: { expanded?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Beranda FinTrack">
      {expanded && (
        <span className="brand-name">
          fintrack<span style={{ color: "#05bc8b" }}>.</span>
        </span>
      )}
    </Link>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function Button({
  children,
  icon: Icon = Plus,
  tone = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  icon?: LucideIcon | null;
  tone?: "primary" | "outline" | "soft";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn-${tone}`}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
export function OpenButton({
  kind,
  id,
  label,
  type,
}: {
  kind: ModalKind;
  id?: string;
  label?: string;
  type?: "INCOME" | "EXPENSE";
}) {
  const { open } = useUi();
  return (
    <Button onClick={() => open({ kind, id, type })}>
      {label ??
        {
          transaction: "Tambah Transaksi",
          wallet: "Tambah Dompet",
          category: "Kategori Baru",
          budget: "Buat Anggaran",
          goal: "Target Baru",
          allocation: "Tambah Tabungan",
          recurring: "Berulang Baru",
        }[kind]}
    </Button>
  );
}
export function Heading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-title-row">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="toolbar">{actions}</div>
    </div>
  );
}
export function Empty({
  title = "Belum ada data",
  text = "Mulai tambahkan data untuk melihat ringkasan.",
  className = "",
  icon: Icon = Inbox,
}: {
  title?: string;
  text?: string;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <Icon />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
export function Stat({
  label,
  amount,
  icon: Icon = WalletIcon,
  tone = "",
}: {
  label: string;
  amount: number;
  icon?: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="kpi-card">
      <span className={`kpi-icon ${tone}`}>
        <Icon />
      </span>
      <p className="kpi-label">{label}</p>
      <h3 className="kpi-value">{rupiah(amount)}</h3>
      <p className="kpi-small">Ringkasan keuangan kamu</p>
    </div>
  );
}
export function StatGrid({
  data,
  transactions,
}: {
  data: FinState;
  transactions: Transaction[];
}) {
  const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((n, t) => n + t.amount, 0),
    expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((n, t) => n + t.amount, 0);
  return (
    <div className="kpi-grid">
      <Stat
        label="Total Saldo"
        amount={
          data.wallets.reduce((n, w) => n + w.initial, 0) +
          data.transactions.reduce(
            (n, t) => n + (t.type === "INCOME" ? t.amount : -t.amount),
            0,
          )
        }
        icon={WalletIcon}
      />
      <Stat label="Pemasukan" amount={income} icon={ArrowUpRight} />
      <Stat
        label="Pengeluaran"
        amount={expense}
        icon={ArrowDownLeft}
        tone="red"
      />
      <Stat
        label="Target Tersimpan"
        amount={data.goals.reduce((n, g) => n + g.allocated, 0)}
        icon={Target}
        tone="yellow"
      />
    </div>
  );
}
export function TransactionTable({
  items,
  showActions = false,
  showWallet = false,
}: {
  items: Transaction[];
  showActions?: boolean;
  showWallet?: boolean;
}) {
  const { data, removeTransaction } = useFin();
  const { open, notify, askConfirm } = useUi();
  if (!items.length)
    return (
      <Empty
        title="Transaksi tidak ditemukan"
        text="Coba gunakan kata kunci lain atau ubah filter pencarian."
        icon={Search}
        className="report-transaction-empty-state search-empty-state"
      />
    );
  return (
    <div className="table-scroll">
      <table className="fin-table">
        <thead>
          <tr>
            <th>Transaksi</th>
            <th>Tanggal</th>
            <th>Jumlah</th>
            <th>Status</th>
            <th>Kategori</th>
            {showWallet && <th>Wallet</th>}
            {showActions && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="tx-merchant">
                  <span
                    className={`tx-icon ${t.type === "EXPENSE" ? "out" : ""}`}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowUpRight size={15} />
                    ) : (
                      <ArrowDownLeft size={15} />
                    )}
                  </span>
                  <span>{t.description || cat(data, t.categoryId).name}</span>
                </div>
              </td>
              <td>{formatDate(t.date)}</td>
              <td className={t.type === "INCOME" ? "amount-pos" : "amount-neg"}>
                {t.type === "INCOME" ? "+" : "−"}
                {rupiah(t.amount)}
              </td>
              <td>
                <span className="status-pill">Selesai</span>
              </td>
              <td className="type-pill">{cat(data, t.categoryId).name}</td>
              {showWallet && <td>{wallet(data, t.walletId).name}</td>}
              {showActions && (
                <td>
                  <div className="flex gap-2">
                    <button
                      className="text-[#00665b] text-xs font-bold hover:underline"
                      onClick={() => open({ kind: "transaction", id: t.id })}
                    >
                      Ubah
                    </button>
                    <button
                      className="text-[#b05b4e] text-xs font-bold hover:underline"
                       onClick={async () => {
                        if (await askConfirm("Hapus transaksi ini?")) {
                          removeTransaction(t.id);
                          notify("Transaksi dihapus");
                        }
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Progress({
  value,
  color = "#00c993",
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="goal-track" aria-label={label ?? `${pct}%`}>
      <div
        className="goal-progress"
        style={{ width: `${pct}%`, backgroundColor: color }}
      >
        {pct > 15 ? `${Math.round(value)}%` : ""}
      </div>
    </div>
  );
}
export function GoalRow({
  name,
  saved,
  target,
  color,
}: {
  name: string;
  saved: number;
  target: number;
  color?: string;
}) {
  return (
    <div className="goal-row">
      <div className="goal-name-row">
        <span>{name}</span>
        <span>
          <strong>{compact(saved)}</strong> / {compact(target)}
        </span>
      </div>
      <Progress value={target ? (saved / target) * 100 : 0} color={color} />
    </div>
  );
}
export function PageActions() {
  return (
    <div className="toolbar">
      <OpenButton kind="transaction" />
      <Link className="btn btn-outline" to="/reports">
        <FileChartColumn size={16} /> Laporan
      </Link>
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Cari transaksi...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-inline">
      <Search size={15} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
export function DataNotice() {
  return (
    <p className="demo-disclaimer">
      <CircleDollarSign size={14} /> Data contoh untuk prototipe. Tidak
      terhubung dengan bank atau pembayaran asli.
    </p>
  );
}
export function FilterLink() {
  return (
    <Link to="/transactions" className="outline-filter">
      <Filter size={14} /> Saring
    </Link>
  );
}
export function SectionLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="section-link">
      {children}
      <ChevronRight size={15} />
    </Link>
  );
}
export function SecondaryLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="btn btn-outline" to={to}>
      {children}
    </Link>
  );
}
export const cardIcons = {
  wallet: WalletIcon,
  credit: CreditCard,
  calendar: CalendarDays,
  download: Download,
};
