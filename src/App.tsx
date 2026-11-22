import { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { UiProvider, useUi } from "./context/UiContext";
import { Shell } from "./components/Shell";
import FormModal from "./components/FormModal";
import Dashboard from "./pages/Dashboard";
import { Analytics } from "./pages/Analytics";
import { Auth } from "./pages/Auth";
import { Budgets } from "./pages/Budgets";
import { Calendar } from "./pages/Calendar";
import { Categories } from "./pages/Categories";
import { Recurring } from "./pages/Recurring";
import { Reports } from "./pages/Reports";
import { Savings } from "./pages/Savings";
import { Settings } from "./pages/Settings";
import { Tracker } from "./pages/Tracker";
import { Transactions } from "./pages/Transactions";
import { Wallets } from "./pages/Wallets";
import { Landing } from "./pages/Landing";

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-frame" aria-busy="true" />;
  return user ? <Shell /> : <Navigate to="/login" replace />;
}

function GuestRoute({ mode }: { mode: "login" | "register" }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Auth mode={mode} />;
}

function GuestLanding() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function Overlay() {
  const { toast, confirm, notify } = useUi();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => notify("", "info"), 3800);
    return () => clearTimeout(timer);
  }, [toast, notify]);
  return (
    <>
      <FormModal />
      {confirm && (
        <div className="confirm-backdrop" role="presentation">
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <div className="confirm-header">
              <div className="confirm-icon"><AlertCircle size={22} /></div>
              <span className="confirm-eyebrow">Perlu konfirmasi</span>
            </div>
            <h2 id="confirm-title">Lanjutkan tindakan ini?</h2>
            <p id="confirm-description">{confirm.message}</p>
            <div className="confirm-note">
              <AlertCircle size={15} />
              <span>Perubahan ini dapat memengaruhi data yang tersimpan.</span>
            </div>
            <div className="confirm-actions">
              <button type="button" className="btn btn-outline" onClick={() => { confirm.resolve(false); }}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={() => { confirm.resolve(true); }}>Ya, lanjutkan</button>
            </div>
          </div>
        </div>
      )}
      {toast &&
        (() => {
          const Icon =
            toast.tone === "error"
              ? AlertCircle
              : toast.tone === "warning"
                ? TriangleAlert
                : toast.tone === "info"
                  ? Info
                  : CheckCircle2;
          return (
            <div
              role={toast.tone === "error" ? "alert" : "status"}
              className={`react-toast react-toast-${toast.tone}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => notify("", "info")}
              >
                <X size={16} />
              </button>
            </div>
          );
        })()}
    </>
  );
}
export default function App() {
  return (
    <UiProvider>
      <Routes>
        <Route path="/" element={<GuestLanding />} />
        <Route path="/login" element={<GuestRoute mode="login" />} />
        <Route path="/register" element={<GuestRoute mode="register" />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Overlay />
    </UiProvider>
  );
}
