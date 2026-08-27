import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getRecentlyViewed, clearRecentlyViewed } from "@/lib/recentlyViewed";
import ItemCard from "@/components/ItemCard";

export default function RecentlyViewed() {
  const t = useT();
  const nav = useNavigate();
  const { lang } = useStore();
  const ar = lang === "ar";
  const [items, setItems] = useState(() => getRecentlyViewed());

  useEffect(() => {
    const handler = () => setItems(getRecentlyViewed());
    window.addEventListener("recently-viewed-changed", handler);
    return () => window.removeEventListener("recently-viewed-changed", handler);
  }, []);

  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-lg">{ar ? "شاهدت مؤخراً" : "Recently viewed"}</h2>
        <button
          onClick={() => clearRecentlyViewed()}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <Trash2 size={13} /> {ar ? "مسح" : "Clear"}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map((it) => (
          <div key={it.id} className="shrink-0 w-40">
            <ItemCard item={it} onClick={() => nav(`/item/${it.id}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}