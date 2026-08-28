import React, { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

// Dismissible "Search near you?" banner shown on first Home visit instead of
// auto-opening the location dialog. Tapping it opens the LocationFilter;
// dismissing persists in localStorage so it never nags again.
const DISMISS_KEY = "kasir_loc_banner_dismissed";

export default function LocationBanner({ onOpenLocation }) {
  const { lang, locationFilter } = useStore();
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Don't show once the user has picked a location filter.
  if (dismissed) return null;
  if (locationFilter.mode === "radius" || (locationFilter.mode === "city" && locationFilter.city)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
      <button onClick={onOpenLocation} className="flex-1 flex items-center gap-3 text-start min-w-0">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
          <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
            {lang === "ar" ? "ابحث قربك؟" : "Search near you?"}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300/80 truncate">
            {lang === "ar" ? "اعثر على إعلانات قريبة من موقعك" : "Find listings close to your location"}
          </p>
        </div>
      </button>
      <button onClick={dismiss} aria-label={lang === "ar" ? "إغلاق" : "Dismiss"} className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shrink-0">
        <X size={16} className="text-emerald-600 dark:text-emerald-400" />
      </button>
    </div>
  );
}