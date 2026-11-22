import { useState } from "react";
import { FileDown } from "lucide-react";
import { useFin } from "../context/FinContext";
import {
  categoryExpenses,
  dateISO,
  formatDate,
  recent,
  rupiah,
  totals,
} from "../lib/finance";
import {
  Empty,
  Heading,
  Panel,
  Progress,
  TransactionTable,
  Button,
} from "../components/UI";

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
        <Empty className="report-insight-empty-state" />
      )}
    </div>
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
        title="Laporan Keuangan"
        subtitle="Ringkasan transaksi untuk pencatatan dan evaluasi keuangan."
        actions={
          <Button icon={FileDown} onClick={() => window.print()}>
            Cetak / Simpan PDF
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
          <p className="kpi-label">Pemasukan</p>
          <h3 className="kpi-value">{rupiah(tx.income)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pengeluaran</p>
          <h3 className="kpi-value">{rupiah(tx.expense)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Net Cash Flow</p>
          <h3 className="kpi-value">{rupiah(tx.income - tx.expense)}</h3>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Transaksi</p>
          <h3 className="kpi-value">{items.length}</h3>
        </div>
      </div>
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-4">Rincian Pengeluaran</h2>
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
