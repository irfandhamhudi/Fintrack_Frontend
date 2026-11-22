import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="app-footer">
      <div>
        <strong>
          fintrack<span>.</span>
        </strong>
        <p>Keuangan pribadi jadi sederhana.</p>
      </div>
      <nav aria-label="Navigasi footer">
        <Link to="/dashboard">Dasbor</Link>
        <Link to="/reports">Laporan</Link>
        <Link to="/settings">Pengaturan</Link>
      </nav>
      <Link className="footer-action" to="/transactions">
        Lihat transaksi <ArrowUpRight size={14} />
      </Link>
    </footer>
  );
}
