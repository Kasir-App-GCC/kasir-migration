import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { matchLocation } from "@/lib/location";
import { getCities } from "@/lib/countries";
import MapSearchBar from "@/components/MapSearchBar";

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 13, { duration: 0.8 });
  }, [target]);
  return null;
}

function thumbIcon(item, lang) {
  const img = item.images?.[0] || `https://picsum.photos/seed/${encodeURIComponent(item.title || item.id)}/96/96`;
  const price = formatPrice(item.price, lang, item.country);
  const sold = item.status === "sold";
  const html = `
    <div style="position:relative;width:54px;height:54px;">
      <img src="${img}" style="width:54px;height:54px;object-fit:cover;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);${sold ? "filter:grayscale(1) opacity(.7);" : ""}"/>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#f59e0b;color:#0f172a;font-size:9px;font-weight:800;line-height:1;padding:2px 5px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.4);border:1px solid rgba(180,120,0,.4);">${price}</div>
    </div>`;
  return L.divIcon({
    className: "souqna-thumb",
    html,
    iconSize: [54, 54],
    iconAnchor: [27, 27],
  });
}

export default function MapView() {
  const { categories, subcategories } = useOutletContext();
  const { locationFilter, lang, prefs, country } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const query = { country, archived: { $ne: true }, review_status: { $nin: ["pending", "rejected"] } };
        if (categories.length === 1) query.category = categories[0];
        else if (categories.length > 1) query.category = { $in: categories };
        if (subcategories.length) query.subcategory = { $in: subcategories };
        const all = await base44.entities.Item.filter(query, "-created_date", 200);
        setItems(all || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [country, categories, subcategories]);

  const cityCoords = useMemo(() => {
    const m = new Map();
    getCities(country).forEach((c) => m.set(c.en, { lat: c.lat, lng: c.lng }));
    return m;
  }, [country]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (categories.length && !categories.includes(it.category)) return false;
      if (subcategories.length && !(Array.isArray(it.subcategory) ? it.subcategory.some((s) => subcategories.includes(s)) : subcategories.includes(it.subcategory))) return false;
      if (!prefs.showSold && it.status === "sold") return false;
      if (!matchLocation(it, locationFilter, country)) return false;
      return true;
    });
  }, [items, categories, subcategories, prefs.showSold, locationFilter, country]);

  const withCoords = useMemo(() => {
    return filtered
      .map((it) => {
        if (it.lat && it.lng) return { ...it, _lat: it.lat, _lng: it.lng };
        const c = cityCoords.get(it.city);
        if (c) return { ...it, _lat: c.lat, _lng: c.lng };
        return null;
      })
      .filter(Boolean);
  }, [filtered, cityCoords]);

  const center = useMemo(() => {
    if (locationFilter.mode === "radius" || locationFilter.mode === "map") {
      if (locationFilter.lat && locationFilter.lng) return [locationFilter.lat, locationFilter.lng];
    }
    const first = withCoords[0];
    if (first) return [first._lat, first._lng];
    const c = getCities(country)[0];
    return c ? [c.lat, c.lng] : [24.7136, 46.6753];
  }, [locationFilter, withCoords, country]);

  return (
    <div className="pt-2">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-bold text-lg">{lang === "ar" ? "عرض الخريطة" : "Map view"}</h2>
        <span className="text-xs text-muted-foreground">{withCoords.length} {t("items")}</span>
      </div>
      <div className="mb-2">
        <MapSearchBar country={country} onSelect={(r) => setFlyTarget(r)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : withCoords.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-semibold">{t("noResults")}</p>
          <p className="text-sm mt-1">{t("noResultsDesc")}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-border/60">
          <MapContainer
            center={center}
            zoom={11}
            scrollWheelZoom
            style={{ height: "72vh", width: "100%" }}
            className="relative z-0"
          >
            <MapReady />
            <FlyTo target={flyTarget} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {withCoords.map((it) => (
              <Marker
                key={it.id}
                position={[it._lat, it._lng]}
                icon={thumbIcon(it, lang)}
                eventHandlers={{ click: () => nav(`/item/${it.id}`) }}
              />
            ))}
          </MapContainer>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        {lang === "ar" ? "اضغط على صورة الإعلان لفتحه" : "Tap a listing photo to open it"}
      </p>
    </div>
  );
}