import { RefreshCw } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { cat, rupiah } from "../lib/finance";
import { Empty, Heading, OpenButton, Panel } from "../components/UI";

export function Recurring() {
  const { data, toggleRecurring, runRecurring } = useFin(),
    { notify } = useUi();
  return (
    <>
      <Heading
        title="Transaksi Berulang"
        subtitle="Atur pengeluaran atau pemasukan rutin."
        actions={<OpenButton kind="recurring" />}
      />
      <Panel className="panel-inner">
        <div className="panel-heading-row mb-5">
          <h2 className="panel-title">Aturan terjadwal</h2>
          <span className="pill-select">{data.recurring.length} aturan</span>
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
                  {
                    (
                      {
                        DAILY: "Harian",
                        WEEKLY: "Mingguan",
                        MONTHLY: "Bulanan",
                      } as const
                    )[r.frequency]
                  }{" "}
                  · Hari {r.day} · {cat(data, r.categoryId).name}
                  {r.nextRun
                    ? ` · Berikutnya ${new Date(`${r.nextRun}T00:00:00`).toLocaleDateString("id-ID")}`
                    : ""}
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
                  {r.status === "ACTIVE" ? "Jeda" : "Lanjutkan"}
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
                         "error",
                       );
                    }
                  }}
                  disabled={r.status !== "ACTIVE"}
                >
                  Jalankan sekali
                </button>
              </div>
            </div>
          ))}
        </div>
        {!data.recurring.length && <Empty className="recurring-empty-state" />}
      </Panel>
      {/* <div className="hint-box mt-5">
        <Clock3 size={18} />
        <p>
          <strong>Mode prototype:</strong> jadwal tidak dieksekusi otomatis.
          Tombol <b>Jalankan sekali</b> hanya demonstrasi, dengan batas satu transaksi
          per bulan per rule. Pada tahap backend perlu queue/worker dan
          idempotency yang tepat untuk frekuensi harian/mingguan/bulanan.
        </p>
      </div> */}
    </>
  );
}
