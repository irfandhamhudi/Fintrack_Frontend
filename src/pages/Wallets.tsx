import { Edit3, Trash2, Wallet as WalletIcon } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { rupiah, walletBalance } from "../lib/finance";
import { DataNotice, Heading, OpenButton, Panel } from "../components/UI";

export function Wallets() {
  const { data, archiveWallet, unarchiveWallet, removeWallet } = useFin();
  const { open, notify } = useUi();
  return (
    <>
      <Heading
        title="Dompet Saya"
        subtitle="Pisahkan saldo tunai, bank, dan e-wallet dalam catatanmu."
        actions={<OpenButton kind="wallet" />}
      />
      <div className="wallet-grid">
        {data.wallets.map((w, i) => (
          <Panel key={w.id} className="wallet-ui-card">
            {w.cardImage && (
              <img
                className="wallet-page-card-image"
                src={w.cardImage}
                alt={`Kartu ${w.name}`}
              />
            )}
            <div className="wallet-header">
              <div className="flex gap-3 items-center">
                <span
                  className="wallet-bubble"
                  style={{ background: w.color ?? "#003d44" }}
                >
                  <WalletIcon size={20} />
                </span>
                <div>
                  <strong className="wallet-name">{w.name}</strong>
                  <p className="muted text-xs">{w.type}</p>
                </div>
              </div>
              <span className="status-pill">
                {w.status === "ACTIVE" ? "Aktif" : "Diarsipkan"}
              </span>
            </div>
            <h2 className="wallet-amount">{rupiah(walletBalance(w, data))}</h2>
            <p className="muted text-xs mt-2">
              Saldo awal {rupiah(w.initial)} - Pemasukan{" "}
              {rupiah(
                data.transactions
                  .filter((t) => t.walletId === w.id && t.type === "INCOME")
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </p>
            <div className="wallet-footer">
              <button
                onClick={() => open({ kind: "wallet", id: w.id })}
                className="link-button"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(`Hapus dompet ${w.name}?`)) return;
                  try {
                    removeWallet(w.id);
                    notify("Dompet dihapus");
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                         : "Dompet tidak dapat dihapus",
                       "error",
                     );
                  }
                }}
                className="link-button"
              >
                <Trash2 size={14} /> Hapus
              </button>
              {w.status === "ARCHIVED" && (
                <button
                  onClick={() => {
                    unarchiveWallet(w.id);
                    notify("Dompet dikeluarkan dari arsip");
                  }}
                  className="link-button"
                >
                  Keluarkan dari Arsip
                </button>
              )}
              {w.status === "ACTIVE" && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Arsipkan wallet ini? Riwayat transaksi tetap tersimpan.",
                      )
                    ) {
                      archiveWallet(w.id);
                      notify("Wallet diarsipkan");
                    }
                  }}
                  className="link-button"
                >
                  Arsipkan
                </button>
              )}
            </div>
            <span className="wallet-number">0{i + 1}</span>
          </Panel>
        ))}
      </div>
      <DataNotice />
    </>
  );
}
