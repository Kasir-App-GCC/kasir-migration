import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Search as SearchIcon, SlidersHorizontal, X, MapPin, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { matchLocation, cityCoords } from "@/lib/location";
import { getCities } from "@/lib/countries";
import Price from "@/components/Price";

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points]);
  return null;
}

const pinIcon = L.divIcon({
  className: "souqna-pin",
  html: '<div style="font-size:26px;line-height:1;transform:translateY(-2px)">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

export default function MapView() {
  const { lang, country, locationFilter, prefs } = useStore();
  const t = useT();
  const nav = useNavigate();
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const [condition, setCondition] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await base44.entities.Item.list("-created_date", 120);
        setItems(all || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    return items.filter((it) => {
      if (cats.length && !cats.includes(it.category)) return false;
      if (!prefs.showSold && it.status === "sold") return false;
      if (!matchLocation(it, locationFilter, country)) return false;
      if (q && !(`${it.title} ${it.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (condition && it.condition !== condition) return false;
      if (minPrice && Number(it.price) < Number(minPrice)) return false;
      if (maxPrice && Number(it.price) > Number(maxPrice)) return false;
      return true;
    });
  }, [items, cats, locationFilter, country, q, condition, minPrice, maxPrice, prefs.showSold]);

  const points = useMemo(() => {
    const pts = [];
    results.forEach((it) => {
      const c = it.lat && it.lng ? { lat: it.lat, lng: it.lng } : cityCoords(it.city);
      if (c && c.lat && c.lng) pts.push({ item: it, pos: [c.lat, c.lng] });
    });
    return pts;
  }, [results]);

  const center = useMemo(() => {
    if (locationFilter?.lat && locationFilter?.lng) return [locationFilter.lat, locationFilter.lng];
    const cities = getCities(country || "SA");
    return cities[0] ? [cities[0].lat, cities[0].lng] : [24.7136, 46.6753];
  }, [country, locationFilter]);

  const reset = () => {
    setMinPrice("");
    setMaxPrice("");
    setCondition("");
    setCats([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-10 pe-3 py-2.5 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="px-3.5 rounded-2xl bg-muted hover:bg-muted/70 flex items-center gap-1.5 text-sm font-semibold"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Category button-filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCats([])}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            cats.length === 0 ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"
          }`}
        >
          {t("all")}
        </button>
        {CATEGORIES.filter((c) => c.id !== "all").map((c) => {
          const active = cats.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => setCats(active ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                active ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"
              }`}
            >
              <c.icon size={13} /> {ar ? c.ar : c.en}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <MapPin size={12} /> {points.length} {t("results")}
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-border/60" style={{ height: "calc(100vh - 240px)", minHeight: 320 }}>
        <MapContainer center={center} zoom={11} scrollWheelZoom className="relative z-0 w-full h-full">
          <MapReady />
          <FitBounds points={points.map((p) => p.pos)} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {points.map(({ item, pos }) => (
            <Marker key={item.id} position={pos} icon={pinIcon}>
              <Popup>
                <div className="w-44">
                  <img src={item.images?.[0]} alt={item.title} className="w-full h-24 object-cover rounded-lg mb-1.5" />
                  <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                  <p className="text-primary font-extrabold text-sm">
                    <Price value={item.price} lang={lang} country={item.country} />
                  </p>
                  <button
                    onClick={() => nav(`/item/${item.id}`)}
                    className="mt-1.5 w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                  >
                    {t("viewItem")}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground font-medium">{t("noResults")}</p>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{t("filters")}</h3>
              <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("condition")}</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(condition === c.id ? "" : c.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold ${condition === c.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {ar ? c.ar : c.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("price")}</label>
                <div className="flex gap-2">
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t("minPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("maxPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={reset} className="px-4 py-3 rounded-xl bg-muted text-muted-foreground font-semibold">{t("reset")}</button>
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold">{t("applyFilters")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}