# FinTrack — React + TypeScript + Tailwind CSS

> **Tahap 2 — Migrasi frontend.** UI dan interaksi FinTrack dikonversi dari prototipe HTML/Vanilla JS menjadi aplikasi Single Page Application (SPA) menggunakan React, TypeScript, React Router, dan Tailwind CSS v4.

Desain mengikuti referensi visual yang disediakan: latar belakang gelap pada frame, antarmuka terang, aksen deep teal dan mint, kartu metrik, grafik batang bulanan, panel tabungan, dan kartu rekening visual. CSS referensi lama dipertahankan untuk konsistensi visual; tambahan komponen React diatur melalui `src/styles/react.css`.

## Jalankan proyek

**Persyaratan:** Node.js 22.12+ (disarankan Node.js 22 LTS terbaru) dan npm, dengan koneksi internet saat instalasi pertama.

```bash
# setelah mengekstrak zip
cd FinTrack_React_TypeScript
npm install
npm run dev
```

Buka **http://localhost:5173/** untuk landing page dan **http://localhost:5173/dashboard** untuk dashboard.

Build production, pengecekan tipe, dan tes logic:

```bash
npm run typecheck
npm run build
npm run test:logic
npm run preview
```

> Lingkungan pembuatan arsip ini tidak bisa mengakses npm registry. Karena itu `npm install`, `typecheck`, build Vite, dan preview browser belum dapat dijalankan di sini. Seluruh file `.ts`/`.tsx` telah diperiksa sintaksnya dengan transpiler TypeScript, dan lima tes logika keuangan telah lulus. Jalankan `npm install && npm run build` di komputer sendiri untuk validasi build lengkap.

## Halaman

| Route | Fitur |
| --- | --- |
| `/` | Landing page responsif: hero, fitur, langkah penggunaan, CTA |
| `/login`, `/register` | Form login dan registrasi demo, bukan autentikasi sebenarnya |
| `/dashboard` | Metrik, grafik saldo, riwayat transaksi, progres savings, mock kartu |
| `/tracker` | Quick action income/expense dan pengeluaran terbesar |
| `/transactions` | Tambah/edit/hapus, pencarian, filter jenis/wallet/bulan, CSV |
| `/calendar` | Kalender dan aktivitas per hari |
| `/analytics` | Income vs expenses, cash flow, kategori, grafik saldo |
| `/wallets` | Tambah/edit/arsip wallet, saldo berdasarkan transaksi |
| `/budgets` | Anggaran bulanan per kategori dan progress penggunaan |
| `/savings` | Target tabungan dan alokasi virtual |
| `/recurring` | Rule berulang dan simulasi Run once, tanpa worker |
| `/categories` | Tambah/edit/arsip kategori |
| `/reports` | Laporan periode, ringkasan dan Print/Save PDF via browser |
| `/settings` | Ubah profil tampilan, reset sample data |

Semua route menggunakan komponen React, bukan HTML yang disisipkan ke DOM dengan `innerHTML`.

## Struktur sumber

```text
FinTrack_React_TypeScript/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # React Router & layout
│   ├── components/
│   │   ├── Shell.tsx             # Shared header/nav/mobile menu
│   │   ├── UI.tsx                # Brand, panel, button, table, status, progress
│   │   ├── Charts.tsx            # Bar chart dan panel savings
│   │   └── FormModal.tsx         # Reusable modal & form
│   ├── context/
│   │   ├── FinContext.tsx        # State & operasi data finansial
│   │   └── UiContext.tsx         # Modal dan toast
│   ├── lib/
│   │   ├── types.ts             # Tipe model FinTrack
│   │   ├── finance.ts           # Fungsi kalkulasi murni
│   │   └── seed.ts              # Data demo 12 bulan
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── FinancePages.tsx      # Halaman lain
│   └── styles/
│       ├── index.css            # Import Tailwind v4
│       ├── reference.css        # CSS desain dari prototype pertama
│       └── react.css            # Styling tambahan untuk React
└── tests/
    └── finance.test.mjs
```

## Komponen reusable

- `Shell` / `Brand` untuk navigasi konsisten di semua halaman.
- `Panel`, `Heading`, `Button`, `OpenButton`, dan `Empty` untuk UI.
- `TransactionTable`, `StatGrid`, `GoalRow`, dan `Progress` untuk data keuangan.
- `BalanceChart`, `MetricCard`, `SavingsSidebar` untuk visualisasi.
- `FormModal` mengelola semua form edit/tambah berdasarkan jenis data.
- `useFin` sebagai store dan service layer awal; `useUi` untuk interaksi global.

## Catatan arsitektur dan keterbatasan

1. **Frontend only:** belum ada REST API, Express, PostgreSQL, atau Prisma.
2. **Data demo dalam localStorage:** transaksi dan pengaturan bertahan setelah refresh pada browser yang sama tetapi **tidak terisolasi secara aman antar pengguna**.
3. **Login/register simulasi:** form tidak mengirim password atau membuat akun; route dashboard dapat diakses langsung.
4. **Jadwal recurring belum otomatis:** tombol Run once merupakan simulasi maksimal sekali per bulan. Di backend nanti wajib ada worker dengan locking dan idempotency sesuai frekuensi.
5. **Savings Goal adalah pencadangan virtual**, bukan transfer bank atau pengeluaran.
6. **Ekspor PDF via Print/Save PDF di browser**; generator PDF server-side baru tahap berikutnya.
7. **Ilustrasi kartu pembayaran fiktif**, tidak menampilkan data kartu sebenarnya.
8. **Jangan masukkan data finansial pribadi sesungguhnya** sebelum backend autentikasi, penyimpanan aman, dan kontrol akses siap.
9. Nilai uang menggunakan integer rupiah; pengeluaran tidak diblokir ketika budget terlampaui.
10. Visualisasi saldo bar memperlihatkan tren 12 bulan terakhir; pemilih periode dashboard memengaruhi kartu Income/Expenses, bukan rentang bar chart.

## Tahap 3 yang disarankan — Backend API

1. Buat `server/` sebagai Express + TypeScript API.
2. PostgreSQL + Prisma dengan tabel `users`, `wallets`, `categories`, `transactions`, `budgets`, `savings_goals`, `savings_allocations`, `recurring_rules` dan `recurring_occurrences`.
3. JWT atau server sessions di cookie HttpOnly + Secure + SameSite sesuai deployment, serta CSRF protection jika diperlukan.
4. CRUD multi-user dengan ownership check pada **setiap** endpoint.
5. Pindahkan kalkulasi saldo, target tabungan, dan budget ke service layer backend dan tests.
6. Gunakan TanStack Query untuk fetch API dan error/loading state.
7. Buat worker recurring dengan job idempotent dan generator PDF backend.
8. Integration tests, Playwright end-to-end tests, CI/CD, dan deployment.

**Produk ini adalah prototipe portfolio, bukan aplikasi keuangan production.**
