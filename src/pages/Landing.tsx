import { useEffect, useState } from "react";
import { ArrowUp, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  FileDown,
  PiggyBank,
  ShieldCheck,
  Tags,
  Target,
  Wallet as WalletIcon,
} from "lucide-react";
import { rupiah } from "../lib/finance";
import { Footer } from "../components/Footer";

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
    <article className="feature-card">
      <span className="feature-icon">
        <Icon size={21} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function Landing() {
  const [openAboutItem, setOpenAboutItem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      ".landing-section, .landing-how, .landing-guide, .landing-about, .landing-cta",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) =>
            entry.isIntersecting && entry.target.classList.add("is-visible"),
        );
      },
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    const handleScroll = () => setShowScrollTop(window.scrollY > 480);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const aboutItems = [
    [
      "Apa itu FinTrack?",
      "FinTrack adalah aplikasi untuk membantu mencatat transaksi, memahami pola pengeluaran, dan merencanakan tujuan keuangan dalam satu tempat.",
    ],
    [
      "Siapa yang cocok menggunakan FinTrack?",
      "FinTrack cocok untuk siapa saja yang ingin mengatur keuangan pribadi, mulai dari pemula hingga pengguna yang membutuhkan pemantauan lebih teratur.",
    ],
    [
      "Apa saja yang bisa dikelola?",
      "Kamu dapat mengelola dompet, kategori, transaksi, budget, target tabungan, transaksi berulang, kalender, analitik, dan laporan.",
    ],
  ];
  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  };
  return (
    <div className="app-frame landing-frame">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          fintrack<span className="text-emerald-500">.</span>
        </Link>
        <nav>
          <button type="button" onClick={() => scrollToSection("features")}>
            Fitur
          </button>
          <button type="button" onClick={() => scrollToSection("guide")}>
            Panduan
          </button>
          <button type="button" onClick={() => scrollToSection("how")}>
            Cara Kerja
          </button>
          <button type="button" onClick={() => scrollToSection("about")}>
            Tentang
          </button>
        </nav>
        <div className="landing-desktop-login">
          <Link to="/login" className="btn btn-outline landing-login-button">
            Masuk
          </Link>
        </div>
        <button
          type="button"
          className="landing-mobile-menu-toggle"
          aria-label="Buka menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {mobileNavOpen && (
          <div className="landing-mobile-menu">
            <button type="button" onClick={() => scrollToSection("features")}>Fitur</button>
            <button type="button" onClick={() => scrollToSection("guide")}>Panduan</button>
            <button type="button" onClick={() => scrollToSection("how")}>Cara Kerja</button>
            <button type="button" onClick={() => scrollToSection("about")}>Tentang</button>
            <Link to="/login" className="btn btn-outline landing-login-button" onClick={() => setMobileNavOpen(false)}>Masuk</Link>
          </div>
        )}
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-content">
            <span className="hero-eyebrow">✦ Kelola uang dengan jelas</span>
            <h1>
              Buat uangmu <em>lebih bermakna.</em>
            </h1>
            <p>
              Catat pemasukan, pantau pengeluaran, atur anggaran, dan capai
              tujuan tabungan melalui satu dashboard yang simpel dan elegan.
            </p>
            <div className="flex gap-3 flex-wrap mt-7">
              <Link to="/register" className="btn btn-primary btn-large">
                Buat Akun Gratis <ChevronRight size={15} />
              </Link>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} /> Kelola keuanganmu dengan aman dan
              teratur.
            </div>
          </div>
          <div className="hero-preview">
            <div className="preview-top">
              <div>
                <span className="muted text-xs">Total Saldo</span>
                <h3>{rupiah(34750000)}</h3>
              </div>
              <span className="trend-capsule">↗ +12.8%</span>
            </div>
            <div className="preview-columns">
              {[40, 55, 48, 63, 52, 73, 66, 78, 68, 85, 72, 96].map((v, i) => (
                <span
                  key={i}
                  style={{
                    height: `${v}%`,
                    background: i === 11 ? "#003d44" : "#d6e8e1",
                  }}
                />
              ))}
            </div>
            <div className="preview-bottom">
              <span>
                <ArrowUpRight size={15} /> Pemasukan <b>+Rp9.580.000</b>
              </span>
              <span>
                <ArrowDownLeft size={15} /> Pengeluaran <b>−Rp1.580.000</b>
              </span>
            </div>
            <div className="preview-goal">
              <span className="round-icon">
                <PiggyBank />
              </span>
              <div>
                <strong>Target Tabungan</strong>
                <p>Sudah 75% dari target</p>
              </div>
              <span className="trend-capsule">75%</span>
            </div>
          </div>
        </section>
        <section id="features" className="landing-section">
          <div className="center-heading">
            <span className="eyebrow">ALL-IN-ONE FINANCIAL TRACKER</span>
            <h2>Semua yang kamu butuhkan untuk mengembangkan keuanganmu.</h2>
            <p>
              Mulai dari transaksi harian hingga rencana jangka panjang,
              semuanya dirancang supaya mudah dipakai.
            </p>
          </div>
          <div className="feature-grid">
            <FeatureCard
              icon={WalletIcon}
              title="Dompet Cerdas"
              text="Pantau saldo tunai, rekening, dan e-wallet secara manual dari satu tempat."
            />
            <FeatureCard
              icon={ChartNoAxesCombined}
              title="Analitik Visual"
              text="Lihat grafik pemasukan, pengeluaran, dan tren saldo."
            />
            <FeatureCard
              icon={Target}
              title="Target Tabungan"
              text="Buat target dan lihat progres tabungan secara real-time."
            />
            <FeatureCard
              icon={CalendarDays}
              title="Kalender Keuangan"
              text="Jelajahi riwayat transaksi melalui kalender bulanan."
            />
            <FeatureCard
              icon={Tags}
              title="Anggaran Bulanan"
              text="Tetapkan batas belanja agar pengeluaran lebih terkontrol."
            />
            <FeatureCard
              icon={FileDown}
              title="Laporan Mudah"
              text="Unduh CSV atau simpan laporan sebagai PDF melalui browser."
            />
          </div>
        </section>
        <section id="guide" className="landing-guide ">
          <div className="center-heading">
            <span className="eyebrow">PANDUAN FINTRACK</span>
            <h2>Kenali FinTrack dalam beberapa menit.</h2>
            <p>Ikuti panduan singkat untuk mulai mengatur keuanganmu.</p>
          </div>
          <div className="landing-guide-grid">
            <div className="landing-guide-copy">
              <span className="eyebrow">MULAI DENGAN MUDAH</span>
              <h3>Bangun kebiasaan finansial yang lebih teratur.</h3>
              <p>Ikuti alur singkat ini untuk memahami fitur utama FinTrack.</p>
              <div className="landing-guide-points">
                <div>
                  <strong>01</strong>
                  <span>Buat akun dan siapkan dompetmu.</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Catat transaksi dan kelompokkan dengan kategori.</span>
                </div>
                <div>
                  <strong>03</strong>
                  <span>
                    Atur anggaran, target tabungan, dan lihat laporan.
                  </span>
                </div>
              </div>
              <Link to="/register" className="btn btn-primary">
                Mulai sekarang <ChevronRight size={15} />
              </Link>
            </div>
            <div className="landing-video-frame">
              <video controls preload="metadata">
                <source
                  src="/FinTrack-Panduan-Penggunaan-1080p-Natural.mp4"
                  type="video/mp4"
                />
                Browser kamu tidak mendukung pemutaran video.
              </video>
            </div>
          </div>
        </section>
         <section id="how" className="landing-how">
           <div className="landing-how-inner">
             <div className="landing-how-intro">
               <span className="eyebrow">CARA KERJA</span>
               <h2>Mulai dalam tiga langkah sederhana.</h2>
               <p>Rancang keuangan dengan alur yang jelas dan tidak rumit.</p>
             </div>
             <div className="steps-list">
            {[
              [
                "01",
                "Siapkan dompetmu",
                "Buat rekening virtual untuk setiap sumber dana.",
              ],
              [
                "02",
                "Catat setiap transaksi",
                "Catat pemasukan dan pengeluaran sesuai kategori.",
              ],
              [
                "03",
                "Lihat gambaran lengkap",
                "Pantau dashboard, anggaran, target tabungan, dan laporan.",
              ],
             ].map(([n, title, description]) => (
               <div className="step" key={n}>
                 <span>{n}</span>
                 <div>
                   <h3>{title}</h3>
                   <p>{description}</p>
                 </div>
               </div>
             ))}
              </div>
            </div>
         </section>
         <section id="about" className="landing-about">
          <div className="landing-about-intro">
            <span className="eyebrow">TENTANG FINTRACK</span>
            <h2>Teman sederhana untuk keputusan finansial yang lebih baik.</h2>
            <p>
              FinTrack membantu kamu memahami ke mana uang pergi, menyusun
              rencana, dan membangun kebiasaan finansial secara bertahap tanpa
              proses yang rumit.
            </p>
          </div>
          <div className="landing-about-details">
            <div
              className="landing-about-accordion"
              data-orientation="vertical"
            >
              {aboutItems.map(([question, answer], index) => {
                const isOpen = openAboutItem === index;
                return (
                  <div className="landing-about-accordion-item" key={question}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenAboutItem(isOpen ? -1 : index)}
                      >
                        <span>{question}</span>
                        <ChevronRight
                          className={isOpen ? "is-open" : ""}
                          size={17}
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <div className="landing-about-accordion-content">
                        {answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-button"
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
