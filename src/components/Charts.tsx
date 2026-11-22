import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import doneImage from "../assets/done.png";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ListFilter,
  ReceiptText,
} from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import {
  balancePoints,
  compact,
  rupiah,
  type BalancePeriod,
} from "../lib/finance";
import { GoalRow } from "./UI";

export function BalanceChart({
  period = "month",
  sourceData,
}: {
  period?: BalancePeriod;
  sourceData?: ReturnType<typeof useFin>["data"];
}) {
  const { data: contextData } = useFin();
  const data = sourceData ?? contextData;
  const points = useMemo(() => balancePoints(data, period), [data, period]);
  const currentIndex =
    period === "month"
      ? new Date().getMonth()
      : period === "week"
        ? points.length - 1
        : points.length - 1;
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  useEffect(
    () => setSelectedIndex(currentIndex),
    [currentIndex, points.length],
  );
  const selectedPoint = points[Math.min(selectedIndex, points.length - 1)];
  const max = Math.max(1, ...points.map((point) => point.balance));
  return (
    <div className="balance-chart">
      <div className="chart-yaxis">
        {[4, 3, 2, 1, 0].map((i) => (
          <span key={i}>{compact((max * i) / 4)}</span>
        ))}
      </div>
      <div className="chart-plot">
        <div className="chart-gridlines">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} />
          ))}
        </div>
        <div className="chart-bars" role="img" aria-label="Grafik saldo">
          {points.map((point, index) => (
            <button
              type="button"
              className={`bar-column ${selectedIndex === index ? "featured" : ""}`}
              key={point.detail}
              onClick={() => setSelectedIndex(index)}
              title={`${point.detail}: ${rupiah(point.balance)}`}
            >
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={
                    {
                      "--h": `${Math.max(3, (point.balance / max) * 100)}%`,
                    } as CSSProperties
                  }
                />
              </span>
              <span className="bar-label">{point.label}</span>
            </button>
          ))}
        </div>
        {selectedPoint && (
          <div className="chart-selection" aria-live="polite">
            <strong>{selectedPoint.detail}</strong>
            <span>{rupiah(selectedPoint.balance)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
export function SavingsSidebar() {
  const { data } = useFin();
  const navigate = useNavigate();
  const { open, updateModal, selectedWalletId, setSelectedWalletId } = useUi();
  const [frontCardId, setFrontCardId] = useState<string>();
  const selectedCardId =
    frontCardId ??
    (selectedWalletId === "ALL"
      ? data.wallets.find((wallet) => wallet.status === "ACTIVE")?.id
      : selectedWalletId);
  const goals = data.goals,
    total = goals.reduce((n, g) => n + g.allocated, 0),
    displayedCards = data.wallets
      .filter((wallet) => wallet.status === "ACTIVE" && wallet.cardImage)
      .slice(0, 3);
  const segments = goals.slice(0, 3).map((g, i) => ({
    value: g.allocated,
    color: i === 0 ? "#003d44" : i === 1 ? "#04ca93" : "#f8d35c",
  }));
  let cursor = 0;
  const gradient = segments
    .map((s) => {
      const start = cursor;
      cursor += total ? (s.value / total) * 360 : 0;
      return `${s.color} ${start}deg ${cursor}deg`;
    })
    .join(", ");
  return (
    <>
      <div className="savings-card">
        <div className="panel-heading-row">
          <h2 className="panel-title">Tabungan</h2>
          <Link to="/savings" className="pill-select flex items-center gap-2">
            <ListFilter size={13} /> Semua
          </Link>
        </div>
        <div className="donut-wrap">
          <div
            className="donut"
            style={{
              background: total ? `conic-gradient(${gradient})` : "#e9f2ee",
            }}
          >
            <div className="donut-inner">
              <small>Total tersimpan</small>
              <strong>{compact(total)}</strong>
            </div>
          </div>
        </div>
        <div className="goal-list">
          {goals.slice(0, 3).map((g) => (
            <GoalRow
              key={g.id}
              name={g.name}
              saved={g.allocated}
              target={g.target}
              color={g.color}
            />
          ))}
        </div>
        <div className="side-divider" />
        <div className="cards-area">
          <div className="panel-heading-row">
            <h2 className="panel-title">
              Kartu Saya{" "}
              <span className="text-sm font-normal muted">
                ({displayedCards.length})
              </span>
            </h2>
            <Link to="/wallets" className="pill-select">
              + Tambah Kartu
            </Link>
          </div>
          <div className="cards-stack uploaded-card-stack">
            {(() => {
              const cards = displayedCards;
              const orderedCards = frontCardId
                ? [
                    ...cards.filter((wallet) => wallet.id === frontCardId),
                    ...cards.filter((wallet) => wallet.id !== frontCardId),
                  ]
                : cards;
              return orderedCards.map((wallet, index) => (
                <button
                  key={wallet.id}
                  type="button"
                  className="uploaded-card-button"
                  onClick={() => {
                    setFrontCardId(wallet.id);
                    setSelectedWalletId(wallet.id);
                    updateModal({ walletId: wallet.id });
                  }}
                  aria-label={`Tampilkan kartu ${wallet.name} di depan`}
                  style={{
                    zIndex: 10 - index,
                    transform: `translateY(-${index * 28}px) scale(${1 - index * 0.03})`,
                  }}
                >
                  <img
                    className="uploaded-card-image"
                    src={wallet.cardImage}
                    alt={`Kartu ${wallet.name}`}
                  />
                </button>
              ));
            })()}
          </div>
          <div className="small-duo">
            <button
              onClick={() =>
                open({
                  kind: "transaction",
                  type: "INCOME",
                  walletId: selectedCardId,
                })
              }
            >
              <ArrowUpRight size={15} /> Terima Uang
            </button>
            <button
              onClick={() =>
                open({
                  kind: "transaction",
                  type: "EXPENSE",
                  walletId: selectedCardId,
                })
              }
            >
              <ArrowDownLeft size={15} /> Tambah Pengeluaran
            </button>
          </div>
          {!data.wallets.some((wallet) => wallet.cardImage) && (
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Upload gambar kartu ATM dari halaman Dompet Saya untuk
              menampilkannya di sini.
            </p>
          )}
        </div>
      </div>
      <div className="upcoming-panel">
        <div className="panel-heading-row">
          <h2 className="panel-title">Pembayaran Mendatang</h2>
          <Link to="/recurring" className="section-link">
            Lihat semua
          </Link>
        </div>
        <div className="upcoming-list">
          {data.recurring.slice(0, 3).map((item) => (
            <div className="upcoming-row" key={item.id}>
              <span className="upcoming-icon">
                <CalendarClock size={15} />
              </span>
              <span className="upcoming-copy">
                <strong>{item.description}</strong>
                <small>
                  {
                    (
                      {
                        DAILY: "Harian",
                        WEEKLY: "Mingguan",
                        MONTHLY: "Bulanan",
                      } as const
                    )[item.frequency]
                  }{" "}
                  · hari {item.day}
                </small>
              </span>
              <strong
                className={
                  item.type === "EXPENSE" ? "amount-neg" : "amount-pos"
                }
              >
                {item.type === "EXPENSE" ? "−" : "+"}
                {rupiah(item.amount)}
              </strong>
            </div>
          ))}
          {!data.recurring.length && (
            <div className="side-empty-state">
              <ReceiptText size={28} />
              <strong>Tidak ada pembayaran terjadwal</strong>
              <span>Jadwal pembayaran akan tampil di sini.</span>
            </div>
          )}
        </div>
      </div>
      <div className="events-panel">
        <div className="panel-heading-row">
          <h2 className="panel-title">Acara Mendatang</h2>
          <Link to="/calendar" className="section-link">
            Lihat kalender
          </Link>
        </div>
        <div className="event-list">
          {data.goals
            .filter((goal) => goal.date)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
            .map((goal) => {
              const eventDate = goal.date
                ? new Date(`${goal.date}T00:00:00`)
                : null;
              const validDate = eventDate && !Number.isNaN(eventDate.getTime());
              return (
                <button
                  className="event-row event-row-button"
                  key={goal.id}
                  type="button"
                  onClick={() => navigate(`/calendar?date=${goal.date}`)}
                >
                  <div className="event-date">
                    <strong>
                      {validDate
                        ? String(eventDate.getDate()).padStart(2, "0")
                        : "—"}
                    </strong>
                    <small>
                      {validDate
                        ? eventDate
                            .toLocaleDateString("id-ID", { month: "short" })
                            .replace(".", "")
                        : "Segera"}
                    </small>
                    {validDate && (
                      <small>{String(eventDate.getFullYear()).slice(-2)}</small>
                    )}
                  </div>
                  <span className="upcoming-copy">
                    <strong>{goal.name}</strong>
                    <small className="event-goal-progress">
                      {rupiah(goal.allocated)} / {rupiah(goal.target)}
                    </small>
                  </span>
                  {goal.allocated >= goal.target && (
                    <span
                      className="event-goal-complete"
                      aria-label="Target tercapai"
                      title="Target tercapai"
                    >
                      <img src={doneImage} alt="Target tercapai" />
                    </span>
                  )}
                </button>
              );
            })}
          {!data.goals.some((goal) => goal.date) && (
            <div className="side-empty-state">
              <CalendarDays size={28} />
              <strong>Tidak ada acara mendatang</strong>
              <span>Target dengan tanggal akan tampil di sini.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export function MetricCard({
  title,
  amount,
  trend,
}: {
  title: string;
  amount: number;
  trend?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-head">{title}</div>
      <div className="metric-value-box">
        <div className="flex justify-between items-center gap-1">
          <strong className="metric-amount">{rupiah(amount)}</strong>
          {trend && <span className="metric-trend">{trend}</span>}
        </div>
        <p className="metric-caption">Periode yang dipilih</p>
      </div>
    </div>
  );
}
