import React, { useState } from "react";
import { Tag, Sun, Moon, Monitor } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCityName } from "@/lib/constants";
import { COUNTRIES, getCountry } from "@/lib/countries";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function TopBar({ onOpenLocation }) {
  const { lang, setLang, theme, setTheme, locationFilter, country, setCountry } = useStore();
  const t = useT();
  const [countryOpen, setCountryOpen] = useState(false);
  const current = getCountry(country);

  const locLabel =
    locationFilter.mode === "radius" || locationFilter.mode === "map"
      ? (locationFilter.name || (locationFilter.city ? getCityName(locationFilter.city, lang) : ""))
        ? `${locationFilter.name || getCityName(locationFilter.city, lang)} · ${locationFilter.radius} ${t("km")}`
        : `${t("within")} ${locationFilter.radius} ${t("km")}`
      : locationFilter.city
      ? getCityName(locationFilter.city, lang)
      : t("allCities");

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const cycle = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60 pt-[env(safe-area-inset-top)]">
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
          <div className="relative">
            <button
              onClick={() => setCountryOpen((v) => !v)}
              className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-lg leading-none"
              title={lang === "ar" ? current.ar : current.en}
            >
              {current.flag}
            </button>
            {countryOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCountryOpen(false)} />
                <div className="absolute end-0 mt-1 z-50 w-44 rounded-2xl bg-background border border-border shadow-xl py-1">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); setCountryOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-start ${c.code === country ? "font-bold text-primary" : ""}`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span>{lang === "ar" ? c.ar : c.en}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <NotificationsDropdown />
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