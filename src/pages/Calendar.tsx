import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import {
  cat,
  dateISO,
  formatDate,
  monthKey,
  recent,
  rupiah,
} from "../lib/finance";
import { Empty, Heading, OpenButton, Panel } from "../components/UI";

export function Calendar() {
  const { data, removeTransaction } = useFin();
  const { open, askConfirm } = useUi();
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get("date");
  const initialDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : dateISO(new Date());
  const [offset, setOffset] = useState(() => {
      const date = new Date(`${initialDate}T00:00:00`);
      const today = new Date();
      return (
        (date.getFullYear() - today.getFullYear()) * 12 +
        date.getMonth() -
        today.getMonth()
      );
    }),
    [selected, setSelected] = useState(initialDate);
  const now = new Date(),
    month = new Date(now.getFullYear(), now.getMonth() + offset, 1),
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    start = (month.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: start }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  const ym = monthKey(month),
    selectedTx = recent(data).filter((t) => t.date === selected),
    selectedGoals = data.goals.filter((goal) => goal.date === selected);
  return (
    <>
      <Heading
        title="Kalender Keuangan"
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
              const goalsOnDate = date
                ? data.goals.filter((goal) => goal.date === date)
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
                      {(items.length > 0 || goalsOnDate.length > 0) && (
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
        <Panel className="panel-inner calendar-detail-panel">
          <h2 className="panel-title mb-2">{formatDate(selected)}</h2>
          <p className="section-subtitle mb-5">
            {selectedTx.length} transaksi · {selectedGoals.length} target
          </p>
          {selectedTx.length || selectedGoals.length ? (
            <div className="calendar-transaction-list flex flex-col gap-3">
              {selectedGoals.map((goal) => (
                <div
                  className="calendar-goal-item flex justify-between border-b border-slate-100 py-3"
                  key={goal.id}
                >
                  <div>
                    <strong className="text-sm">{goal.name}</strong>
                    <p className="muted text-xs">Target tabungan</p>
                  </div>
                  <span className="amount-pos">
                    {rupiah(goal.allocated)} / {rupiah(goal.target)}
                  </span>
                </div>
              ))}
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
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={
                        t.type === "INCOME" ? "amount-pos" : "amount-neg"
                      }
                    >
                      {t.type === "INCOME" ? "+" : "−"}
                      {rupiah(t.amount)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline text-xs"
                        onClick={() => open({ kind: "transaction", id: t.id })}
                      >
                        Ubah
                      </button>
                      <button
                        className="btn btn-outline text-xs"
                         onClick={async () => {
                           if (await askConfirm(`Hapus transaksi ${t.description}?`))
                             removeTransaction(t.id);
                         }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Tidak ada transaksi atau target pada tanggal ini." />
          )}
          {/* <button
            className="btn btn-primary mt-5"
            onClick={() => open({ kind: "transaction" })}
          >
            <Plus size={15} /> Transaksi baru
          </button> */}
        </Panel>
      </div>
    </>
  );
}
