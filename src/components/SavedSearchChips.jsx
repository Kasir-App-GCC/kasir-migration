import React, { useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

// Horizontal strip of the user's saved searches. Tapping a chip re-applies
// its filters (via onApply); the X button deletes it.
export default function SavedSearchChips({ onApply }) {
  const { user, lang } = useStore();
  const [searches, setSearches] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      try {
        const list = await base44.entities.SavedSearch.filter({ user_id: user.id }, "-created_date", 50);
        if (alive) setSearches(list || []);
      } catch {
        if (alive) setSearches([]);
      }
    })();
    return () => { alive = false; };
  }, [user, tick]);

  const del = async (id) => {
    try { await base44.entities.SavedSearch.delete(id); } catch {}
    setTick((x) => x + 1);
  };

  if (!searches.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
      {searches.map((s) => (
        <div key={s.id} className="relative shrink-0">
          <button
            onClick={() => onApply?.(s)}
            className="inline-flex items-center gap-1.5 ps-7 pe-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 active:scale-95 transition"
          >
            <Bookmark size={12} className="absolute start-2.5" />
            <span className="max-w-[150px] truncate">{s.name || (lang === "ar" ? "بحث محفوظ" : "Saved search")}</span>
          </button>
          <button
            onClick={() => del(s.id)}
            className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow active:scale-90"
            aria-label={lang === "ar" ? "حذف" : "Delete"}
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}