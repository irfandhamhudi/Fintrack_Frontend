import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import {
  categoryExpenses,
  periodTransactions,
  recent,
  rupiah,
} from "../lib/finance";
import {
  Empty,
  Heading,
  OpenButton,
  Panel,
  Progress,
  StatGrid,
  TransactionTable,
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
        title="Pelacak Keuangan"
        subtitle="Catat pemasukan dan pengeluaran lebih cepat."
        actions={<OpenButton kind="transaction" />}
      />
      <StatGrid data={data} transactions={tx} />
      <div className="content-grid mt-5">
        <Panel className="panel-inner">
          <h2 className="panel-title mb-2">Transaksi cepat</h2>
          <p className="section-subtitle mb-5">
            Apa aktivitas keuanganmu hari ini?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="quick-tile"
              onClick={() => open({ kind: "transaction", type: "INCOME" })}
            >
              <span className="quick-icon green">
                <ArrowUpRight />
              </span>
              <strong>Pemasukan</strong>
              <small>Catat pemasukan</small>
            </button>
            <button
              className="quick-tile"
              onClick={() => open({ kind: "transaction", type: "EXPENSE" })}
            >
              <span className="quick-icon gold">
                <ArrowDownLeft />
              </span>
              <strong>Pengeluaran</strong>
              <small>Catat pengeluaran</small>
            </button>
          </div>
          <h3 className="panel-title mt-8 mb-3">Baru ditambahkan</h3>
          <div className="tracker-empty-area-table">
            <TransactionTable items={recent(data).slice(0, 4)} />
          </div>
        </Panel>
        <Panel className="panel-inner">
          <div className="flex justify-between items-center mb-5">
            <h2 className="panel-title">Pengeluaran Teratas</h2>
            <Link to="/analytics" className="section-link">
              Analytics
            </Link>
          </div>
          <div className="tracker-empty-area">
            <InsightList items={categories.slice(0, 5)} />
          </div>
          {/* <DataNotice /> */}
        </Panel>
      </div>
    </>
  );
}
