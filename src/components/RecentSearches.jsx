import React, { useState, useEffect } from "react";
import { Clock, Search } from "lucide-react";
import { useT } from "@/lib/i18n";

const STORAGE_KEY = "kasir:recent_searches";
const MAX_RECENT = 8;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRecentSearch(term) {
  const t = term.trim();
  if (!t) return;
  try {
    const existing = getRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase());
    const updated = [t, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearRecentSearches() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// `visible` is driven by the parent input's focus state so the dropdown
// only appears while the search field is active.
export default function RecentSearches({ visible, onPick, onClose }) {
  const t = useT();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (visible) setRecent(getRecentSearches());
  }, [visible]);

  if (!visible || !recent.length) return null;

  return (
    <div className="absolute top-full inset-x-0 mt-1 z-30 rounded-2xl bg-card border border-border/60 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <Clock size={13} /> {t("recentSearches")}
        </span>
        <button
          onClick={() => { clearRecentSearches(); setRecent([]); }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {t("clearRecent")}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {recent.map((term, i) => (
          <button
            key={i}
            onClick={() => { onClose?.(); onPick(term); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted text-start transition"
          >
            <Search size={14} className="text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{term}</span>
          </button>
        ))}
      </div>
    </div>
  );
}