import { useState } from "react";
import {
  Archive,
  Briefcase,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  Heart,
  Pencil,
  ShoppingBag,
  Trash2,
  Tags,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useFin } from "../context/FinContext";
import { useUi } from "../context/UiContext";
import { Heading, OpenButton, Panel } from "../components/UI";
import type { EntryType } from "../lib/types";

const categoryIcons: Record<string, LucideIcon> = {
  tags: Tags,
  "shopping-bag": ShoppingBag,
  utensils: Utensils,
  car: Car,
  gift: Gift,
  coffee: Coffee,
  heart: Heart,
  "gamepad-2": Gamepad2,
  briefcase: Briefcase,
};

export function Categories() {
  const { data, archiveCategory, removeCategory } = useFin(),
    { open, notify } = useUi();
  const [type, setType] = useState<EntryType>("EXPENSE");
  return (
    <>
      <Heading
        title="Kategori"
        subtitle="Atur pengelompokan pemasukan dan pengeluaran."
        actions={<OpenButton kind="category" />}
      />
      <Panel className="panel-inner">
        <div className="period-switch mb-5">
          <button
            onClick={() => setType("EXPENSE")}
            className={type === "EXPENSE" ? "active" : ""}
          >
            Expense
          </button>
          <button
            onClick={() => setType("INCOME")}
            className={type === "INCOME" ? "active" : ""}
          >
            Income
          </button>
        </div>
        <div className="cards-grid">
          {data.categories
            .filter((c) => c.type === type)
            .map((c) => (
               <div className="category-card" key={c.id ?? `${c.type}-${c.name}`}>
                <div className="flex gap-3 items-center">
                  <span
                    className="round-icon"
                    style={{ background: c.color + "30", color: c.color }}
                  >
                    {(() => {
                      const Icon = categoryIcons[c.icon] ?? Tags;
                      return <Icon size={19} />;
                    })()}
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <p className="muted text-xs">
                      {c.isDefault ? "Bawaan" : "Kustom"} ·{" "}
                      {c.status === "ACTIVE" ? "Aktif" : "Diarsipkan"}
                    </p>
                  </div>
                </div>
                <div className="category-actions">
                  {c.status === "ACTIVE" && (
                    <button
                      className="btn btn-primary w-full justify-center"
                      onClick={() => {
                        if (window.confirm("Arsipkan kategori?")) {
                          archiveCategory(c.id);
                          notify("Kategori diarsipkan");
                        }
                      }}
                    >
                      <Archive size={14} />
                      Arsip
                    </button>
                  )}
                  <div className="category-actions-row">
                    <button
                      className="btn btn-outline flex-1 justify-center"
                      onClick={() => open({ kind: "category", id: c.id })}
                    >
                      <Pencil size={14} />
                      Ubah
                    </button>
                    {!c.isDefault && (
                      <button
                        className="btn btn-outline flex-1 justify-center"
                        onClick={() => {
                          if (!window.confirm("Hapus kategori ini?")) return;
                          try {
                            removeCategory(c.id);
                            notify("Kategori dihapus");
                          } catch (err) {
                            notify(
                              err instanceof Error
                                ? err.message
                                : "Kategori tidak dapat dihapus",
                               "error",
                             );
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Panel>
    </>
  );
}
