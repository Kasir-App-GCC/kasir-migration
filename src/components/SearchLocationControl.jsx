import React, { useState } from "react";
import { Crosshair } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCities, nearestCityInCountry } from "@/lib/countries";
import SheetSelect from "@/components/SheetSelect";

// Compact inline location picker for the search filter panel.
// "Near me" requires geolocation; otherwise the user falls back to picking a city.
export default function SearchLocationControl() {
  const { lang, locationFilter, setLocationFilter, country } = useStore();
  const t = useT();
  const [locating, setLocating] = useState(false);

  const mode = locationFilter.mode || "city";
  const radius = locationFilter.radius || 25;
  const city = locationFilter.city || "";
  const hasCoords = (mode === "radius" || mode === "map") && locationFilter.lat;

  const switchToCity = () => setLocationFilter({ mode: "city", city: city || null, radius: 25 });
  const switchToRadius = () => setLocationFilter({ mode: "radius", radius, city: null, ...(hasCoords ? { lat: locationFilter.lat, lng: locationFilter.lng } : {}) });

  const detect = () => {
    if (!navigator.geolocation) {
      alert(lang === "ar" ? "ما يدعم متصفحك تحديد الموقع" : "Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const c = nearestCityInCountry(pos.coords.latitude, pos.coords.longitude, country);
        setLocationFilter({ mode: "radius", radius, city: c?.en || null, lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        alert(lang === "ar" ? "ما قدرنا نحدد موقعك — اختر مدينة بدلاً من ذلك" : "Couldn't get your location — pick a city instead");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div>
      <div className="flex gap-1 mb-3">
        <button
          onClick={switchToCity}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${mode === "city" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {t("city")}
        </button>
        <button
          onClick={switchToRadius}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${mode === "radius" || mode === "map" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {t("nearMe")}
        </button>
      </div>

      {mode === "city" ? (
        <SheetSelect
          value={city}
          onChange={(v) => setLocationFilter({ mode: "city", city: v || null, radius: 25 })}
          placeholder={t("allCities")}
          label={t("city")}
          buttonClassName="px-3 py-2.5 rounded-xl text-sm"
          options={[
            { value: "", label: t("allCities") },
            ...getCities(country).map((c) => ({ value: c.en, label: lang === "ar" ? c.ar : c.en })),
          ]}
        />
      ) : hasCoords ? (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("radius")}</span>
            <span className="text-lg font-extrabold">{radius} <span className="text-xs font-medium text-muted-foreground">{t("km")}</span></span>
          </div>
          <input type="range" min={1} max={200} value={radius} onChange={(e) => setLocationFilter({ ...locationFilter, radius: Number(e.target.value) })} className="w-full accent-primary" />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>1 {t("km")}</span>
            <span>200 {t("km")}</span>
          </div>
          <button onClick={detect} className="mt-3 text-xs text-primary font-semibold hover:underline">
            {lang === "ar" ? "إعادة تحديد الموقع" : "Re-detect location"}
          </button>
        </div>
      ) : (
        <div>
          <button onClick={detect} disabled={locating} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            <Crosshair size={16} /> {locating ? t("locating") : t("useMyLocation")}
          </button>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            {lang === "ar" ? "أو اختر مدينة من تبويب المدينة" : "Or pick a city from the City tab"}
          </p>
        </div>
      )}
    </div>
  );
}