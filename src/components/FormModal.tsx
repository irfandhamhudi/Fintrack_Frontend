import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { todayISO } from "../lib/finance";
import { api as httpApi } from "../lib/api";
import type { EntryType, RecurringFrequency, WalletType } from "../lib/types";
import { Select as ShadcnSelect } from "./ui/select";

type Option = { value: string; label: string };
function Field({
  name,
  label,
  children,
  wide = false,
}: {
  name: string;
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "full" : ""}`} htmlFor={`field-${name}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input({
  name,
  type = "text",
  defaultValue,
  placeholder,
  min,
  max,
  required = true,
}: {
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
}) {
  const numeric = type === "number";
  const formatted =
    numeric && defaultValue !== undefined
      ? Number(defaultValue).toLocaleString("id-ID")
      : defaultValue;
  return (
    <input
      id={`field-${name}`}
      name={name}
      className="input-control"
      type={numeric ? "text" : type}
      inputMode={numeric ? "numeric" : undefined}
      defaultValue={formatted}
      placeholder={
        numeric && placeholder
          ? Number(placeholder).toLocaleString("id-ID")
          : placeholder
      }
      min={numeric ? undefined : min}
      max={numeric ? undefined : max}
      required={required}
      onChange={
        numeric
          ? (event) => {
              const digits = event.currentTarget.value.replace(/\D/g, "");
              event.currentTarget.value = digits
                ? Number(digits).toLocaleString("id-ID")
                : "";
            }
          : undefined
      }
    />
  );
}
function Select({
  name,
  options,
  defaultValue,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <ShadcnSelect
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      disabled={disabled}
      options={options}
      onValueChange={onChange}
    />
  );
}
function choices<T extends string>(items: T[]): Option[] {
  const labels: Record<string, string> = {
    BANK: "Bank",
    CASH: "Tunai",
    EWALLET: "Dompet digital",
    OTHER: "Lainnya",
    EXPENSE: "Pengeluaran",
    INCOME: "Pemasukan",
    DAILY: "Harian",
    WEEKLY: "Mingguan",
    MONTHLY: "Bulanan",
  };
  return items.map((value) => ({ value, label: labels[value] ?? value }));
}
export default function FormModal() {
  const { modal, close, notify, updateModal } = useUi();
  const api = useFin();
  const { data } = api;
  const [type, setType] = useState<EntryType>("EXPENSE"),
    [categoryIcon, setCategoryIcon] = useState("tags"),
     [cardImagePreview, setCardImagePreview] = useState(""),
     [saving, setSaving] = useState(false);
  useEffect(
    () =>
      setCategoryIcon(
        modal?.kind === "category"
          ? (data.categories.find((c) => c.id === modal.id)?.icon ?? "tags")
          : "tags",
      ),
    [modal, data.categories],
  );
  useEffect(
    () =>
      setCardImagePreview(
        modal?.kind === "wallet"
          ? (data.wallets.find((w) => w.id === modal.id)?.cardImage ?? "")
          : "",
      ),
    [modal, data.wallets],
  );
  useEffect(
    () =>
      setType(
        modal?.type ??
          (modal?.kind === "transaction"
            ? (data.transactions.find((t) => t.id === modal.id)?.type ??
              "INCOME")
            : modal?.kind === "recurring"
              ? (data.recurring.find((r) => r.id === modal.id)?.type ??
                "EXPENSE")
              : "EXPENSE"),
      ),
    [modal, data.transactions, data.recurring],
  );
  if (!modal) return null;
  const transaction = data.transactions.find((t) => t.id === modal.id),
    category = data.categories.find((c) => c.id === modal.id),
    wallet = data.wallets.find((w) => w.id === modal.id),
    budget = data.budgets.find((b) => b.id === modal.id),
    goal = data.goals.find((g) => g.id === modal.id);
  const options: Record<string, string> = {
    transaction: transaction ? "Ubah Transaksi" : "Transaksi Baru",
    wallet: wallet ? "Ubah Dompet" : "Dompet Baru",
    category: category ? "Ubah Kategori" : "Kategori Baru",
    budget: budget ? "Ubah Anggaran" : "Anggaran Bulanan",
    goal: goal ? "Ubah Target Tabungan" : "Target Tabungan Baru",
    allocation: `Tambah Tabungan${goal ? ` — ${goal.name}` : ""}`,
    recurring: "Transaksi Berulang Baru",
  };
  const wallets = data.wallets
    .filter((w) => w.status === "ACTIVE")
    .map((w) => ({ value: w.id, label: w.name }));
  const cats = data.categories
    .filter((c) => c.type === type && c.status === "ACTIVE")
    .map((c) => ({ value: c.id, label: c.name }));
  const selectOrError = (v: string, name: string, opts: Option[]) => {
    if (!opts.some((o) => o.value === v))
      throw Error(`${name} tidak tersedia.`);
    return v;
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const values = new FormData(event.currentTarget),
      s = (key: string) => String(values.get(key) ?? "").trim(),
      n = (key: string) => Number(s(key).replace(/\./g, ""));
    try {
      if (modal.kind === "transaction") {
        const amount = n("amount"),
          walletId = s("walletId"),
          categoryId = s("categoryId"),
          txType = s("type") as EntryType;
        if (!Number.isSafeInteger(amount) || amount <= 0)
          throw Error("Nominal harus lebih besar dari nol.");
        selectOrError(walletId, "Dompet", wallets);
        selectOrError(
          categoryId,
          "Kategori",
          data.categories
            .filter((c) => c.type === txType && c.status === "ACTIVE")
            .map((c) => ({ value: c.id, label: c.name })),
        );
        api.addTransaction(
          {
            type: txType,
            amount,
            walletId,
            categoryId,
            description: s("description"),
            date: s("date"),
          },
          transaction?.id,
        );
      }
       if (modal.kind === "wallet") {
         const initial = n("initial");
         if (!Number.isSafeInteger(initial) || initial < 0)
           throw Error("Saldo awal harus angka bulat positif atau nol.");
         const imageFile = values.get("cardImage");
         const uploadedImage = imageFile instanceof File && imageFile.size > 0
           ? (await httpApi.upload(imageFile)).url
           : cardImagePreview;
           await api.saveWallet(
         {
             name: s("name"),
             initial,
             type: s("type") as WalletType,
             status: wallet?.status ?? "ACTIVE",
             color: wallet?.color ?? "#003d44",
             accountNumber: wallet?.accountNumber,
             cardImage: uploadedImage.startsWith("data:") ? wallet?.cardImage : uploadedImage,
           },
          wallet?.id,
        );
      }
      if (modal.kind === "category") {
        if (!s("name")) throw Error("Nama kategori wajib diisi.");
        api.saveCategory(
          {
            name: s("name"),
            type: category?.type ?? (s("type") as EntryType),
            icon: s("icon"),
            color: s("color"),
            status: category?.status ?? "ACTIVE",
          },
          category?.id,
        );
      }
      if (modal.kind === "budget") {
        if (!Number.isSafeInteger(n("limit")) || n("limit") <= 0)
          throw Error("Budget harus positif.");
        const today = new Date(),
          cid = budget?.categoryId ?? s("categoryId");
        if (!cid) throw Error("Pilih kategori.");
        if (
          !budget &&
          data.budgets.some(
            (b) =>
              b.categoryId === cid &&
              b.month === today.getMonth() + 1 &&
              b.year === today.getFullYear(),
          )
        )
          throw Error("Budget untuk kategori ini sudah ada.");
        api.saveBudget(
          {
            categoryId: cid,
            limit: n("limit"),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
          },
          budget?.id,
        );
      }
      if (modal.kind === "goal") {
        if (!Number.isSafeInteger(n("target")) || n("target") <= 0)
          throw Error("Target harus positif.");
        api.saveGoal(
          {
            name: s("name"),
            target: n("target"),
            date: s("date"),
            color: s("color"),
          },
          goal?.id,
        );
      }
      if (modal.kind === "allocation") {
        if (!goal) throw Error("Target tidak ditemukan.");
        if (!Number.isSafeInteger(n("amount")) || n("amount") <= 0)
          throw Error("Jumlah alokasi harus positif.");
        if (n("amount") > goal.target - goal.allocated)
          throw Error("Nominal melebihi sisa target.");
        api.allocateGoal(goal.id, n("amount"), s("walletId"));
      }
      if (modal.kind === "recurring") {
        const amount = n("amount"),
          day = n("day");
        if (
          !Number.isSafeInteger(amount) ||
          amount <= 0 ||
          !Number.isInteger(day) ||
          day < 1 ||
          day > 31
        )
          throw Error("Nominal atau hari jadwal tidak valid.");
        if (
          !data.categories.some(
            (c) => c.id === s("categoryId") && c.type === type,
          )
        )
          throw Error("Pilih kategori sesuai jenis transaksi.");
        api.saveRecurring({
          type: s("type") as EntryType,
          amount,
          description: s("description"),
          walletId: s("walletId"),
          categoryId: s("categoryId"),
          frequency: s("frequency") as RecurringFrequency,
          day,
          status: "ACTIVE",
        });
      }
      close();
      notify("Data berhasil disimpan.");
     } catch (err) {
       notify(err instanceof Error ? err.message : "Data tidak dapat disimpan.", "error");
     } finally {
       setSaving(false);
     }
   };
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={options[modal.kind]}
      >
        <div className="modal-top">
          <div>
            <h2>{options[modal.kind]}</h2>
            <p>
              Kelola data FinTrack. Semua perubahan disimpan sebagai demo lokal.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup formulir"
            className="circle-action"
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <form key={`${modal.kind}-${modal.id ?? "new"}`} onSubmit={save}>
          <div className="form-grid">
            {modal.kind === "transaction" && (
              <>
                <div
                  className="transaction-type-tabs full"
                  role="tablist"
                  aria-label="Jenis transaksi"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={type === "INCOME"}
                    className={type === "INCOME" ? "active" : ""}
                    onClick={() => setType("INCOME")}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={type === "EXPENSE"}
                    className={type === "EXPENSE" ? "active" : ""}
                    onClick={() => setType("EXPENSE")}
                  >
                    Pengeluaran
                  </button>
                  <input type="hidden" name="type" value={type} />
                </div>
                <Field name="amount" label="Nominal (Rp)" wide>
                  <Input
                    name="amount"
                    type="number"
                    min={1}
                    defaultValue={transaction?.amount}
                    placeholder="350000"
                  />
                </Field>
                <Field name="walletId" label="Dompet">
                  <Select
                    name="walletId"
                    value={
                      modal.walletId ??
                      transaction?.walletId ??
                      wallets[0]?.value
                    }
                    onChange={(value) => updateModal({ walletId: value })}
                    options={wallets}
                  />
                </Field>
                <Field name="categoryId" label="Kategori">
                  <ShadcnSelect
                    key={`category-${type}`}
                    name="categoryId"
                    defaultValue={
                      transaction?.type === type
                        ? transaction.categoryId
                        : cats[0]?.value
                    }
                    options={cats}
                  />
                </Field>
                <Field name="description" label="Deskripsi" wide>
                  <Input
                    name="description"
                    defaultValue={transaction?.description}
                    placeholder="Contoh: Belanja kebutuhan"
                  />
                </Field>
                <Field name="date" label="Tanggal transaksi" wide>
                  <Input
                    name="date"
                    type="date"
                    defaultValue={transaction?.date ?? todayISO()}
                  />
                </Field>
              </>
            )}
            {modal.kind === "wallet" && (
              <>
                <Field name="name" label="Nama dompet" wide>
                  <Input
                    name="name"
                    defaultValue={wallet?.name}
                    placeholder="Contoh: BRI Utama"
                  />
                </Field>
                <Field name="type" label="Jenis dompet">
                  <Select
                    name="type"
                    defaultValue={wallet?.type ?? "BANK"}
                    options={choices(["BANK", "CASH", "EWALLET", "OTHER"])}
                  />
                </Field>
                <Field name="initial" label="Saldo awal (Rp)">
                  <Input
                    name="initial"
                    type="number"
                    min={0}
                    defaultValue={wallet?.initial ?? 0}
                  />
                </Field>
                <Field name="cardImage" label="Gambar kartu ATM" wide>
                  <div
                    className={`wallet-upload-box ${cardImagePreview ? "has-preview" : ""}`}
                  >
                    {cardImagePreview ? (
                      <div className="wallet-card-preview-wrap">
                        <img
                          className="wallet-card-preview"
                          src={cardImagePreview}
                          alt={`Kartu ${wallet?.name ?? "wallet"}`}
                        />
                      </div>
                    ) : (
                      <div className="wallet-upload-empty">
                        <ImagePlus size={26} />
                        <strong>Upload gambar kartu</strong>
                         <span>JPG, PNG, atau WEBP · Maks. 8 MB</span>
                      </div>
                    )}
                    <div className="wallet-upload-actions">
                      <label
                        className="wallet-upload-trigger"
                        htmlFor="field-cardImage"
                      >
                        <Upload size={15} />
                        {cardImagePreview ? "Ganti gambar" : "Pilih gambar"}
                      </label>
                      {cardImagePreview && (
                        <button
                          type="button"
                          className="wallet-upload-delete"
                          onClick={(event) => {
                            setCardImagePreview("");
                            const hidden =
                              event.currentTarget.form?.elements.namedItem(
                                "cardImageData",
                              ) as HTMLInputElement | null;
                            if (hidden) hidden.value = "";
                            const fileInput =
                              event.currentTarget.form?.elements.namedItem(
                                "cardImage",
                              ) as HTMLInputElement | null;
                            if (fileInput) fileInput.value = "";
                          }}
                        >
                          Hapus gambar
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id="field-cardImage"
                    className="wallet-upload-input"
                    name="cardImage"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const form = input.form;
                       const file = input.files?.[0];
                       if (!file || !form) return;
                       if (file.size > 8 * 1024 * 1024) {
                         input.value = "";
                         notify("Ukuran gambar maksimal 8 MB.", "error");
                         return;
                       }
                       const reader = new FileReader();
                      reader.onload = () => {
                        const hidden = form.elements.namedItem(
                          "cardImageData",
                        ) as HTMLInputElement | null;
                        const result = String(reader.result ?? "");
                        setCardImagePreview(result);
                        if (hidden) hidden.value = result;
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <input
                    type="hidden"
                    name="cardImageData"
                    defaultValue={wallet?.cardImage}
                  />
                </Field>
              </>
            )}
            {modal.kind === "category" && (
              <>
                <Field name="name" label="Nama kategori" wide>
                  <Input
                    name="name"
                    defaultValue={category?.name}
                    placeholder="Contoh: Hobi"
                  />
                </Field>
                <Field name="type" label="Jenis">
                  <Select
                    name="type"
                    defaultValue={category?.type ?? "EXPENSE"}
                    options={choices(["EXPENSE", "INCOME"])}
                  />
                </Field>
                <Field name="icon" label="Ikon">
                  <Select
                    name="icon"
                    value={categoryIcon}
                    onChange={setCategoryIcon}
                    options={choices([
                      "tags",
                      "shopping-bag",
                      "utensils",
                      "car",
                      "gift",
                      "coffee",
                      "heart",
                      "gamepad-2",
                      "briefcase",
                    ])}
                  />
                </Field>
                <Field name="color" label="Warna aksen" wide>
                  <Select
                    name="color"
                    defaultValue={category?.color ?? "#00bf90"}
                    options={[
                      { value: "#00bf90", label: "Emerald" },
                      { value: "#f1be56", label: "Yellow" },
                      { value: "#8b96d8", label: "Lavender" },
                      { value: "#dd8d97", label: "Coral" },
                      { value: "#4587a8", label: "Blue" },
                    ]}
                  />
                </Field>
              </>
            )}
            {modal.kind === "budget" && (
              <>
                <Field name="categoryId" label="Kategori pengeluaran" wide>
                  <Select
                    name="categoryId"
                    defaultValue={
                      budget?.categoryId ??
                      data.categories.find(
                        (c) => c.type === "EXPENSE" && c.status === "ACTIVE",
                      )?.id
                    }
                    disabled={!!budget}
                    options={data.categories
                      .filter(
                        (c) => c.type === "EXPENSE" && c.status === "ACTIVE",
                      )
                      .map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Field>
                <Field name="limit" label="Batas bulanan (Rp)">
                  <Input
                    name="limit"
                    type="number"
                    min={1}
                    defaultValue={budget?.limit}
                    placeholder="2000000"
                  />
                </Field>
                <Field name="period" label="Periode">
                  <input
                    className="input-control"
                    disabled
                    value={`${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date())}`}
                  />
                </Field>
              </>
            )}
            {modal.kind === "goal" && (
              <>
                <Field name="name" label="Nama target" wide>
                  <Input
                    name="name"
                    defaultValue={goal?.name}
                    placeholder="Contoh: Dana Darurat"
                  />
                </Field>
                <Field name="target" label="Nominal target (Rp)">
                  <Input
                    name="target"
                    type="number"
                    min={1}
                    defaultValue={goal?.target}
                    placeholder="10000000"
                  />
                </Field>
                <Field name="date" label="Tanggal target (opsional)">
                  <Input
                    name="date"
                    type="date"
                    defaultValue={goal?.date}
                    required={false}
                  />
                </Field>
                <Field name="color" label="Warna aksen" wide>
                  <Select
                    name="color"
                    defaultValue={goal?.color ?? "#00bf90"}
                    options={[
                      { value: "#00bf90", label: "Emerald" },
                      { value: "#003d44", label: "Deep Teal" },
                      { value: "#f3cc50", label: "Yellow" },
                    ]}
                  />
                </Field>
              </>
            )}
            {modal.kind === "allocation" && (
              <>
                <p className="col-span-2 section-subtitle">
                  Target: Rp{goal?.target.toLocaleString("id-ID")} · Terkumpul:
                  Rp{goal?.allocated.toLocaleString("id-ID")}
                </p>
                <Field name="walletId" label="Sumber dana">
                  <Select
                    name="walletId"
                    defaultValue={
                      data.wallets.find((wallet) => wallet.status === "ACTIVE")
                        ?.id
                    }
                    options={wallets}
                  />
                </Field>
                <Field name="amount" label="Nominal alokasi (Rp)">
                  <Input
                    name="amount"
                    type="number"
                    min={1}
                    max={goal ? goal.target - goal.allocated : undefined}
                    placeholder="500000"
                  />
                </Field>
              </>
            )}
            {modal.kind === "recurring" && (
              <>
                <Field name="type" label="Transaction type">
                  <Select
                    name="type"
                    defaultValue="EXPENSE"
                    options={choices(["EXPENSE", "INCOME"])}
                    onChange={(v) => setType(v as EntryType)}
                  />
                </Field>
                <Field name="amount" label="Nominal (Rp)">
                  <Input name="amount" type="number" min={1} />
                </Field>
                <Field name="walletId" label="Dompet">
                  <Select
                    name="walletId"
                    defaultValue={wallets[0]?.value}
                    options={wallets}
                  />
                </Field>
                <Field name="categoryId" label="Kategori">
                  <ShadcnSelect
                    key={`recurring-category-${type}`}
                    name="categoryId"
                    defaultValue={cats[0]?.value}
                    options={cats}
                  />
                </Field>
                <Field name="description" label="Nama jadwal" wide>
                  <Input
                    name="description"
                    placeholder="Contoh: Langganan internet"
                  />
                </Field>
                <Field name="frequency" label="Frekuensi">
                  <Select
                    name="frequency"
                    defaultValue="MONTHLY"
                    options={choices(["DAILY", "WEEKLY", "MONTHLY"])}
                  />
                </Field>
                <Field name="day" label="Hari dalam bulan (1–31)">
                  <Input
                    name="day"
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={1}
                  />
                </Field>
              </>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={close}>
              Batal
            </button>
             <button className="btn btn-primary" type="submit" disabled={saving} aria-busy={saving}>
               {saving ? "Menyimpan perubahan…" : "Simpan Perubahan"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
