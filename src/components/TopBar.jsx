import React from "react";
import { Link } from "react-router-dom";
import { Tag, Sun, Moon, Monitor, Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCityName } from "@/lib/constants";
import useUnreadChats from "@/hooks/useUnreadChats";

export default function TopBar({ onOpenLocation }) {
  const { lang, setLang, theme, setTheme, locationFilter } = useStore();
  const t = useT();
  const unread = useUnreadChats();

  const locLabel =
    locationFilter.mode === "radius" || locationFilter.mode === "map"
      ? locationFilter.city
        ? `${getCityName(locationFilter.city, lang)} · ${locationFilter.radius} ${t("km")}`
        : `${t("within")} ${locationFilter.radius} ${t("km")}`
      : locationFilter.city
      ? getCityName(locationFilter.city, lang)
      : t("allCities");

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const cycle = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Tag size={18} className="-rotate-12" />
          </div>
          <span className="font-extrabold text-lg tracking-tight hidden sm:block">{t("appName")}</span>
        </div>

        <button
          onClick={onOpenLocation}
          className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium min-w-0"
        >
          <span className="text-primary shrink-0">📍</span>
          <span className="truncate">{locLabel}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link to="/notifications" className="relative w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-sm font-bold"
          >
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button
            onClick={cycle}
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center"
            title={theme}
          >
            <ThemeIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}