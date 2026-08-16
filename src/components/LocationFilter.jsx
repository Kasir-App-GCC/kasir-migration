import React, { useState, useEffect } from "react";
import { MapPin, Search, X, Check, Crosshair } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { SAUDI_CITIES, getCityName, nearestCity } from "@/lib/constants";

export default function LocationFilter({ open, onClose }) {
  const { lang, locationFilter, setLocationFilter } = useStore();
  const t = useT();
  const [tab, setTab] = useState(locationFilter.mode);
  const [radius, setRadius] = useState(locationFilter.radius);
  const [city, setCity] = useState(locationFilter.city);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectedCoords, setDetectedCoords] = useState(null);

  useEffect(() => {
    if (open) {
      setTab(locationFilter.mode);
      setRadius(locationFilter.radius);
      setCity(locationFilter.city);
      setQuery("");
      if (locationFilter.mode === "radius" && locationFilter.lat) {
        setDetectedCity(nearestCity(locationFilter.lat, locationFilter.lng));
        setDetectedCoords({ lat: locationFilter.lat, lng: locationFilter.lng });
      } else {
        setDetectedCity(null);
        setDetectedCoords(null);
      }
    }
  }, [open]);

  if (!open) return null;

  const filtered = SAUDI_CITIES.filter((c) =>
    (lang === "ar" ? c.ar : c.en).toLowerCase().includes(query.toLowerCase()) ||
    c.en.toLowerCase().includes(query.toLowerCase()) ||
    c.ar.includes(query)
  );

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === "ar" ? "ما يدعم متصفحك تحديد الموقع" : "Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setDetectedCity(c);
        setDetectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        alert(lang === "ar" ? "ما قدرنا نحدد موقعك" : "Couldn't get your location");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const apply = () => {
    if (tab === "city") {
      setLocationFilter({ mode: "city", city, radius: 25 });
      onClose();
      return;
    }
    if (detectedCoords) {
      setLocationFilter({ mode: "radius", radius, city: detectedCity?.en || null, lat: detectedCoords.lat, lng: detectedCoords.lng });
    } else if (locationFilter.mode === "radius" && locationFilter.lat) {
      setLocationFilter({ ...locationFilter, radius });
    } else {
      setLocationFilter({ mode: "radius", radius, city: null });
    }
    onClose();
  };

  const clear = () => {
    setCity(null);
    setLocationFilter({ mode: "city", city: null, radius: 25 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-lg">{t("locationFilter")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3">
          <button
            onClick={() => setTab("city")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === "city"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t("city")}
          </button>
          <button
            onClick={() => setTab("radius")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === "radius"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t("nearMe")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {tab === "city" ? (
            <div>
              <div className="relative mb-3">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchCity")}
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-muted text-sm outline-none focus:ring-2 ring-primary/30"
                />
              </div>
              <button
                onClick={() => setCity(null)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition ${
                  city === null ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {t("allCities")}
                </span>
                {city === null && <Check size={16} />}
              </button>
              <div className="mt-1 space-y-0.5">
                {filtered.map((c) => (
                  <button
                    key={c.en}
                    onClick={() => setCity(c.en)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition ${
                      city === c.en ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                    }`}
                  >
                    <span>{lang === "ar" ? c.ar : c.en}</span>
                    {city === c.en && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Crosshair size={22} />
                </div>
                <div>
                  <p className="font-semibold">{t("nearMe")}</p>
                  <p className="text-xs text-muted-foreground">
                    {locating ? t("locating") : detectedCity ? (lang === "ar" ? `تم تحديد موقعك: ${detectedCity.ar}` : `Location found: ${detectedCity.en}`) : t("useMyLocation")}
                  </p>
                </div>
              </div>
              {locating ? (
                <div className="text-center py-6"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : !detectedCity ? (
                <button onClick={detectLocation} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold mb-4">
                  {t("useMyLocation")}
                </button>
              ) : (
                <>
                  <button onClick={detectLocation} className="text-xs text-primary font-semibold mb-3 hover:underline">
                    {lang === "ar" ? "إعادة تحديد الموقع" : "Re-detect location"}
                  </button>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t("radius")}</span>
                    <span className="text-2xl font-extrabold">
                      {radius} <span className="text-sm font-medium text-muted-foreground">{t("km")}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span>1 {t("km")}</span>
                    <span>200 {t("km")}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={clear}
            className="px-4 py-3 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/70"
          >
            {t("clearFilters")}
          </button>
          <button
            onClick={apply}
            disabled={locating}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {locating ? t("locating") : t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}