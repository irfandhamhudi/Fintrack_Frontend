import { Edit3 } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import {
  budgetAlertLevel,
  budgetRate,
  cat,
  monthNames,
  rupiah,
  spentBudget,
} from "../lib/finance";
import { Empty, Heading, OpenButton, Panel, Progress } from "../components/UI";

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
        title="Anggaran Bulanan"
        subtitle="Rencanakan batas pengeluaran agar tetap terkendali."
        actions={<OpenButton kind="budget" />}
      />
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Total Anggaran</p>
          <h3 className="kpi-value">{rupiah(max)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Sudah Digunakan</p>
          <h3 className="kpi-value">{rupiah(spent)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Sisa</p>
          <h3 className="kpi-value">{rupiah(Math.max(0, max - spent))}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Penggunaan</p>
          <h3 className="kpi-value">
            {max ? Math.round((spent / max) * 100) : 0}%
          </h3>
        </div>
      </div>
      <div className="cards-grid mt-5">
        {budgets.map((b) => {
          const u = spentBudget(b, data),
            pct = budgetRate(b, data),
            alert = budgetAlertLevel(b, data);
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
                  className={`status-pill ${alert === "over" ? "status-over" : ""}`}
                >
                  {alert === "over"
                    ? "Melebihi batas"
                    : alert === "warning"
                      ? "Peringatan 80%"
                      : "Sesuai target"}
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
                <Edit3 size={14} /> Ubah Anggaran
              </button>
            </Panel>
          );
        })}
      </div>
      {!budgets.length && (
        <Panel className="panel-inner mt-5 budgets-empty-panel">
          <Empty
            title="Belum ada anggaran"
            text="Tambahkan anggaran untuk mengatur batas pengeluaranmu."
          />
        </Panel>
      )}
    </>
  );
}
