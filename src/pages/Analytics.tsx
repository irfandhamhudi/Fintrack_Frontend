import { useEffect, useState } from "react";
import { useFin } from "../context/FinContext";
import {
  cashFlowForecast,
  categoryExpenses,
  periodTransactions,
  rupiah,
  totals,
} from "../lib/finance";
import { Empty, Heading, Panel, Progress, StatGrid } from "../components/UI";
import { BalanceChart } from "../components/Charts";

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
        <div className="analytics-empty-state">
          <Empty />
        </div>
      )}
    </div>
  );
}

export function Analytics() {
  const { data } = useFin();
  const [period, setPeriod] = useState<"week" | "month" | "year">(
    () =>
      (localStorage.getItem("fintrack-analytics-period") as
        | "week"
        | "month"
        | "year"
        | null) ?? "month",
  );
  const [balancePeriod, setBalancePeriod] = useState<"week" | "month" | "year">(
    () =>
      (localStorage.getItem("fintrack-analytics-balance-period") as
        | "week"
        | "month"
        | "year"
        | null) ?? "month",
  );
  useEffect(() => {
    localStorage.setItem("fintrack-analytics-period", period);
  }, [period]);
  useEffect(() => {
    localStorage.setItem("fintrack-analytics-balance-period", balancePeriod);
  }, [balancePeriod]);
  const tx = periodTransactions(data, period),
    t = totals(tx),
    categories = categoryExpenses(data, tx),
    forecast = cashFlowForecast(data, 30),
    lowestForecast = forecast.reduce(
      (lowest, point) => (point.balance < lowest.balance ? point : lowest),
      forecast[0],
    );
  return (
    <>
      <Heading
        title="Analitik"
        subtitle="Pahami kebiasaan pengeluaran dan arus kasmu."
        actions={
          <div className="period-switch">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={period === p ? "active" : ""}
              >
                {p === "week" ? "Minggu" : p === "month" ? "Bulan" : "Tahun"}
              </button>
            ))}
          </div>
        }
      />
      <StatGrid data={data} transactions={tx} />
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-2">Pemasukan vs Pengeluaran</h2>
          <p className="section-subtitle mb-6">Ringkasan periode terpilih</p>
          {[
            ["Pemasukan", t.income, "#08bf91"],
            ["Pengeluaran", t.expense, "#ecc55b"],
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
            <span>Arus Kas Bersih</span>
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
          <h2 className="panel-title mb-6">Pengeluaran berdasarkan Kategori</h2>
          <InsightList items={categories} />
        </Panel>
      </div>
      <Panel className="panel-inner mt-5 analytics-balance-panel">
        <div className="chart-heading">
          <h2 className="panel-title mb-2">Tren Saldo</h2>
          <div className="period-switch">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setBalancePeriod(p)}
                className={balancePeriod === p ? "active" : ""}
              >
                {p === "week" ? "Minggu" : p === "month" ? "Bulan" : "Tahun"}
              </button>
            ))}
          </div>
        </div>
        <BalanceChart period={balancePeriod} />
      </Panel>
      <Panel className="panel-inner mt-5 forecast-panel">
        <div className="chart-heading">
          <div>
            <h2 className="panel-title mb-2">Prediksi Arus Kas</h2>
            <p className="section-subtitle">
              Estimasi 30 hari dari saldo dan transaksi berulang.
            </p>
          </div>
          <strong
            className={lowestForecast.balance < 0 ? "amount-neg" : "amount-pos"}
          >
            Titik terendah: {rupiah(lowestForecast.balance)}
          </strong>
        </div>
        <div className="forecast-grid">
          {forecast
            .filter(
              (_, index) => index % 5 === 0 || index === forecast.length - 1,
            )
            .map((point) => (
              <div
                className={`forecast-point ${point.balance < 0 ? "forecast-risk" : ""}`}
                key={point.date}
              >
                <span>{point.label}</span>
                <strong>{rupiah(point.balance)}</strong>
                {point.change !== 0 && (
                  <small>
                    {point.change > 0 ? "+" : "−"}
                    {rupiah(Math.abs(point.change))}
                  </small>
                )}
              </div>
            ))}
        </div>
      </Panel>
    </>
  );
}
