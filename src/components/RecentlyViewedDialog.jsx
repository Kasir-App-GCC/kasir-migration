import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Eye, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getRecentlyViewed, clearRecentlyViewed } from "@/lib/recentlyViewed";
import ItemCard from "@/components/ItemCard";

export default function RecentlyViewedDialog({ open, onClose }) {
  const t = useT();
  const nav = useNavigate();
  const { lang } = useStore();
  const ar = lang === "ar";
  const [items, setItems] = useState(() => getRecentlyViewed());

  useEffect(() => {
    if (!open) return;
    setItems(getRecentlyViewed());
    const handler = () => setItems(getRecentlyViewed());
    window.addEventListener("recently-viewed-changed", handler);
    return () => window.removeEventListener("recently-viewed-changed", handler);
  }, [open]);

  if (!open) return null;

  const openItem = (id) => {
    onClose();
    nav(`/item/${id}`);
  };

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-lg max-h-[70vh] rounded-t-3xl sm:rounded-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Eye size={18} /> {ar ? "شاهدت مؤخراً" : "Recently viewed"}
          </h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition"
              >
                <Trash2 size={13} /> {ar ? "مسح" : "Clear"}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {items.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((it) => (
                <ItemCard key={it.id} item={it} onClick={() => openItem(it.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Eye size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">{ar ? "لا توجد عناصر" : "No items yet"}</p>
              <p className="text-sm mt-1">{ar ? "تصفّح الإعلانات وستظهر هنا" : "Browse listings and they'll show up here"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}