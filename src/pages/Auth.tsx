import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useUi } from "../context/UiContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/UI";

export function Auth({ mode }: { mode: "login" | "register" }) {
  const { notify } = useUi();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const label = mode === "login" ? "Selamat datang kembali" : "Buat akun";
  return (
    <div className="app-frame">
      <div className="auth-frame">
        <div className="auth-left">
          <Link to="/" className="brand">
            fintrack.
          </Link>
          <div className="auth-left-content">
            <span className="hero-eyebrow">Uangmu. Masa depanmu.</span>
            <h1>Kendalikan perjalanan keuanganmu.</h1>
            <p>
              Setiap pengeluaran adalah langkah menuju kejelasan. Mulai buat
              keputusan keuangan dengan percaya diri bersama FinTrack.
            </p>
            <div className="auth-art">
              <div className="auth-balance-label">TOTAL TABUNGAN</div>
              <strong>Rp23.000.000</strong>
              <div className="auth-mini-bars">
                {[30, 47, 35, 61, 53, 74, 81, 66, 94].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          <p>FinTrack — Personal finance made simple.</p>
        </div>
        <div className="auth-right">
          <Link
            to="/"
            className="text-sm text-teal-900 font-semibold mb-14 inline-flex items-center gap-1"
          >
            <ChevronLeft size={15} /> Kembali ke beranda
          </Link>
          <div className="auth-form-box">
            <h1>{label}</h1>
            <p className="section-subtitle mb-8">
              {mode === "login"
                ? "Masuk untuk melihat dasbor keuanganmu."
                : "Buat akun untuk mulai mengelola keuanganmu."}
            </p>
            <form
               onSubmit={async (e) => {
                e.preventDefault();
                if (password.length < 6) {
                  notify("Password minimal 6 karakter.", "error");
                  return;
                }
                if (mode === "register" && !name.trim()) {
                  notify("Nama harus diisi.", "error");
                  return;
                }
                if (!email) {
                  notify("Email harus diisi.", "error");
                  return;
                }
                 const error = await (mode === "login"
                   ? login(email, password)
                   : register(name, email, password));
                if (error) {
                  notify(error, "error");
                  return;
                }
                navigate("/dashboard", { replace: true });
              }}
              className="flex flex-col gap-4"
            >
              {mode === "register" && (
                <label className="field">
                  <span>Nama lengkap</span>
                  <input
                    className="input-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                  />
                </label>
              )}
              <label className="field">
                <span>Email</span>
                <input
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <div className="password-field">
                  <input
                    className="input-control"
                    type={show ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    title="Tampilkan kata sandi"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </label>
              <Button type="submit" icon={null}>
                {mode === "login" ? "Masuk" : "Daftar"}{" "}
                <ChevronRight size={15} />
              </Button>
            </form>
            <p className="text-center mt-6 text-sm muted">
              {mode === "login" ? (
                <>
                  Baru di sini?{" "}
                  <Link to="/register" className="font-bold text-teal-800">
                    Buat akun
                  </Link>
                </>
              ) : (
                <>
                  Sudah terdaftar?{" "}
                  <Link to="/login" className="font-bold text-teal-800">
                    Masuk
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
