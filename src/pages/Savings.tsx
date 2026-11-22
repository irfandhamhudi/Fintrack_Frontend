import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { formatDate, rupiah, totalBalance } from "../lib/finance";
import { Heading, OpenButton, Panel, Progress } from "../components/UI";

export function Savings() {
  const { data, removeGoal } = useFin(),
    { open } = useUi();
  const total = data.goals.reduce((n, g) => n + g.allocated, 0);
  return (
    <>
      <Heading
        title="Target Tabungan"
        subtitle="Wujudkan tujuan keuangan lewat alokasi tabungan."
        actions={<OpenButton kind="goal" />}
      />
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Total Tersimpan</p>
          <h3 className="kpi-value">{rupiah(total)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Target</p>
          <h3 className="kpi-value">{data.goals.length}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Completed</p>
          <h3 className="kpi-value">
            {data.goals.filter((g) => g.allocated >= g.target).length}
          </h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Saldo Belum Dialokasikan</p>
          <h3 className="kpi-value">{rupiah(totalBalance(data) - total)}</h3>
        </div>
      </div>
      <Panel className="panel-inner mt-5">
        <div className="panel-heading-row">
          <h2 className="panel-title">Saldo dialokasikan per wallet</h2>
          <span className="muted text-xs">Sumber dana tabungan</span>
        </div>
        <div className="wallet-allocation-list">
          {data.wallets.map((wallet) => {
            const allocated = data.goals.reduce(
              (sum, goal) =>
                sum +
                (goal.allocations?.[wallet.id] ??
                  (goal.walletId === wallet.id ? goal.allocated : 0)),
              0,
            );
            return (
              <div className="wallet-allocation-row" key={wallet.id}>
                <span>{wallet.name}</span>
                <strong>{rupiah(allocated)}</strong>
              </div>
            );
          })}
        </div>
      </Panel>
      <div className="cards-grid mt-5">
        {data.goals.map((g) => (
          <Panel key={g.id} className="progress-item">
            <div className="flex justify-between items-start">
              <span className="round-icon">
                <Target size={20} />
              </span>
              <span className="status-pill">
                {g.allocated >= g.target ? "Selesai" : "Dalam proses"}
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
            <div className="mt-6">
              <button
                className="btn btn-primary w-full justify-center"
                onClick={() => open({ kind: "allocation", id: g.id })}
              >
                <Plus size={15} /> Tambah Tabungan
              </button>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn btn-outline flex-1 justify-center"
                  title="Ubah target"
                  aria-label={`Ubah target ${g.name}`}
                  onClick={() => open({ kind: "goal", id: g.id })}
                >
                  <Pencil size={15} /> Ubah
                </button>
                <button
                  className="btn btn-outline flex-1 justify-center"
                  title="Hapus target"
                  aria-label={`Hapus target ${g.name}`}
                  onClick={() => {
                    if (window.confirm(`Hapus target tabungan ${g.name}?`))
                      removeGoal(g.id);
                  }}
                >
                  <Trash2 size={15} /> Hapus
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <p className="section-subtitle mt-5">
        Alokasi hanya pencadangan virtual, bukan pengeluaran atau transfer bank.
      </p>
    </>
  );
}
