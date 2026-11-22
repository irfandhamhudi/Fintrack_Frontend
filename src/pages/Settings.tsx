import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Bell,
  Camera,
  Download,
  RefreshCw,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { Heading, Panel, Button } from "../components/UI";
import { api } from "../lib/api";

export function Settings() {
  const { data, saveProfile, reset, loading: dataLoading } = useFin(),
    { notify } = useUi();
   const [name, setName] = useState(data.profile.name),
     [email, setEmail] = useState(data.profile.email),
     [avatarUrl, setAvatarUrl] = useState(data.profile.avatarUrl ?? ""),
     [avatarLoading, setAvatarLoading] = useState(false);
   const initials = name
     .trim()
     .split(/\s+/)
     .slice(0, 2)
     .map((part) => part.charAt(0).toUpperCase())
     .join("") || "FT";
  useEffect(() => {
    setName(data.profile.name);
    setEmail(data.profile.email);
    setAvatarUrl(data.profile.avatarUrl ?? "");
  }, [data.profile.name, data.profile.email, data.profile.avatarUrl]);
  const handle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAvatarLoading(true);
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      notify("Isi nama dan email dengan benar.", "error");
      setAvatarLoading(false);
      return;
    }
    try {
      await saveProfile({
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl || undefined,
      });
      notify("Profil berhasil diperbarui.");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Profil gagal diperbarui.",
        "error",
      );
    } finally {
      setAvatarLoading(false);
    }
  };
  return (
    <>
      <Heading
        title="Pengaturan Akun"
        subtitle="Kelola tampilan profil dan data aplikasi demo."
      />
      <div className="content-grid settings-grid">
         <Panel className={`panel-inner settings-profile-panel ${dataLoading ? "settings-loading" : ""}`}>
           <h2 className="panel-title mb-5">Informasi Profil</h2>
           <div className="profile-avatar-upload settings-skeleton-surface">
            <div className="profile-avatar-preview">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar profil"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    setAvatarUrl("");
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <label className="btn btn-outline profile-avatar-button">
              <Camera size={15} />{" "}
              {avatarLoading ? "Mengunggah…" : "Ganti avatar"}
              <input
                type="file"
                 accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                hidden
                disabled={avatarLoading}
                onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                   if (!file) return;
                   const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
                   const allowedAvatarExtensions = /\.(jpe?g|png|webp)$/i;
                   if (!allowedAvatarTypes.includes(file.type) || !allowedAvatarExtensions.test(file.name)) {
                     notify("Format avatar hanya JPG, JPEG, PNG, atau WEBP.", "error");
                     event.target.value = "";
                     return;
                   }
                   if (file.size > 8 * 1024 * 1024) {
                    notify("Ukuran avatar maksimal 8 MB.", "error");
                    event.target.value = "";
                    return;
                  }
                  setAvatarLoading(true);
                  try {
                    const result = await api.upload(file, "avatar");
                    setAvatarUrl(result.url);
                    notify("Avatar berhasil diunggah.");
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                        : "Avatar gagal diunggah.",
                      "error",
                    );
                  } finally {
                    setAvatarLoading(false);
                  }
                }}
              />
            </label>
          </div>
          <form onSubmit={handle} className="flex flex-col gap-4">
             <label className={`field ${dataLoading ? "settings-field-loading" : ""}`}>
               <span>Nama lengkap</span>
              <input
                className="input-control"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
             <label className={`field ${dataLoading ? "settings-field-loading" : ""}`}>
               <span>Alamat email</span>
              <input
                className="input-control"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
             <label className={`field ${dataLoading ? "settings-field-loading" : ""}`}>
               <span>Mata uang bawaan</span>
              <input className="input-control" value="IDR (Rupiah)" disabled />
            </label>
             <label className={`field ${dataLoading ? "settings-field-loading" : ""}`}>
               <span>Zona waktu</span>
              <input
                className="input-control"
                value={data.profile.timezone}
                disabled
              />
            </label>
             <Button type="submit" disabled={dataLoading || avatarLoading}>{dataLoading ? "Memuat data…" : "Simpan Profil"}</Button>
          </form>
        </Panel>
        <Panel className="panel-inner settings-side-panel">
          <div className="settings-side-heading">
            <span className="settings-side-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 className="panel-title">Privasi & Data</h2>
              <p className="section-subtitle">
                Kelola profil dan data keuanganmu dengan aman.
              </p>
            </div>
          </div>
          <div className="settings-account-summary">
            <div className="settings-summary-heading">
              <div>
                <strong>Ringkasan akun</strong>
                <p>Aktivitas akunmu saat ini.</p>
              </div>
            </div>
            <div className="settings-summary-grid">
              {dataLoading ? Array.from({ length: 4 }, (_, index) => (
                <div className="settings-summary-skeleton" key={index}>
                  <span />
                  <strong />
                </div>
              )) : <>
                <div>
                  <span>Bergabung sejak</span>
                  <strong>
                    {data.profile.createdAt
                      ? new Date(data.profile.createdAt).toLocaleDateString(
                          "id-ID",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </strong>
                </div>
                <div><span>Transaksi tercatat</span><strong>{data.transactions.length}</strong></div>
                <div><span>Dompet aktif</span><strong>{data.wallets.filter((wallet) => wallet.status === "ACTIVE").length}</strong></div>
                <div><span>Budget aktif</span><strong>{data.budgets.filter((budget) => budget.month === new Date().getMonth() + 1 && budget.year === new Date().getFullYear()).length}</strong></div>
              </>}
            </div>
          </div>
          <div className={`settings-info-list ${dataLoading ? "settings-info-loading" : ""}`}>
            {dataLoading ? Array.from({ length: 3 }, (_, index) => (
              <div className="settings-info-row settings-info-skeleton" key={index}>
                <span className="settings-info-icon" />
                <div><strong /><p /></div>
                <span />
              </div>
            )) : <>
              <div className="settings-info-row">
                <span className="settings-info-icon"><ShieldCheck size={16} /></span>
                <div><strong>Keamanan akun</strong><p>Sesi login dan akses akun terlindungi.</p></div>
                <span className="settings-status-dot">Aktif</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-info-icon"><RefreshCw size={16} /></span>
                <div><strong>Sinkronisasi data</strong><p>Informasi terbaru siap digunakan.</p></div>
                <span className="settings-status-dot">Terbaru</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-info-icon"><Bell size={16} /></span>
                <div><strong>Notifikasi</strong><p>Pengingat budget dan transaksi berulang aktif.</p></div>
                <span className="settings-status-dot">Aktif</span>
              </div>
            </>}
          </div>
          <div className="settings-reset-block">
            <button
              className="btn btn-outline settings-reset-button settings-refresh-button"
              onClick={() => {
                reset();
                notify("Data terbaru dimuat dari server.");
                setName(data.profile.name);
                setEmail(data.profile.email);
              }}
            >
                <RefreshCw size={15} className={dataLoading ? "settings-refresh-spinning" : ""} /> {dataLoading ? "Memuat data…" : "Muat ulang data"}
            </button>
            <button
              type="button"
              className="btn btn-soft settings-reset-button"
              onClick={() =>
                notify("Fitur export data sedang disiapkan.", "info")
              }
            >
              <Download size={15} /> Export data
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
export function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof WalletIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="feature-card">
      <span className="feature-icon">
        <Icon size={21} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
