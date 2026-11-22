import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { cat, recent } from "../lib/finance";
import {
  Heading,
  OpenButton,
  Panel,
  SearchInput,
  StatGrid,
  TransactionTable,
  Button,
} from "../components/UI";
import { Select } from "../components/ui/select";
import type { EntryType, Transaction } from "../lib/types";

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
        title="Transaksi"
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
              Ekspor CSV
            </Button>
            <OpenButton kind="transaction" />
          </>
        }
      />
      <StatGrid data={data} transactions={items} />
      <Panel className="panel-inner mt-5">
        <div className="panel-heading-row">
          <h2 className="panel-title">
            Riwayat Transaksi{" "}
            <span className="muted text-sm font-normal">({items.length})</span>
          </h2>
        </div>
        <div className="filters-row">
          <SearchInput value={search} onChange={setSearch} />
          <Select
            value={type}
            onValueChange={(value) => setType(value as typeof type)}
            options={[
              { value: "ALL", label: "Semua jenis" },
              { value: "INCOME", label: "Pemasukan" },
              { value: "EXPENSE", label: "Pengeluaran" },
            ]}
          />
          <Select
            value={walletId}
            onValueChange={setWallet}
            options={[
              { value: "ALL", label: "Semua wallet" },
              ...data.wallets.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
          <Select
            value={month}
            onValueChange={setMonth}
            options={[
              { value: "ALL", label: "Semua bulan" },
              ...periods.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
        <div className="transactions-empty-table">
          <TransactionTable items={items} showActions showWallet />
        </div>
      </Panel>
    </>
  );
}
