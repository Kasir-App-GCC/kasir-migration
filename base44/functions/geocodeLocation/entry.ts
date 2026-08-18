import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const CC_BY_COUNTRY = {
  SA: "SA", AE: "AE", OM: "OM", BH: "BH", KW: "KW", QA: "QA",
};

// ArcGIS World Geocoding — free, no API key, much better coverage for Saudi/Gulf
// short/informal addresses than OpenStreetMap. Falls back to Nominatim if empty.
async function geocodeArcGIS(query, cc, lang) {
  const params = new URLSearchParams({
    singleLine: query,
    f: "json",
    maxLocations: "6",
    outFields: "Addr_type,LongLabel,ShortLabel",
    langCode: lang === "ar" ? "ar" : "en",
  });
  if (cc) params.set("sourceCountry", cc);
  const url = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?" + params.toString();
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) return [];
  const data = await r.json();
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  return candidates
    .map((c) => {
      const lat = c?.location?.y;
      const lng = c?.location?.x;
      return {
        label: c?.address || c?.attributes?.LongLabel || c?.attributes?.ShortLabel || "",
        lat: typeof lat === "number" ? lat : parseFloat(lat),
        lng: typeof lng === "number" ? lng : parseFloat(lng),
      };
    })
    .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));
}

async function geocodeNominatim(query, cc, lang) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=" +
    encodeURIComponent(query) +
    (cc ? "&countrycodes=" + cc.toLowerCase() : "") +
    "&accept-language=" + lang;
  const r = await fetch(url, {
    headers: { "User-Agent": "Kasir/1.0 (local marketplace app)", "Accept": "application/json" },
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (Array.isArray(data) ? data : [])
    .map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
    .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));
}

// Reverse geocode lat/lng → a short, accurate place name.
// Tries ArcGIS first (better Gulf coverage), falls back to Nominatim.
async function reverseGeocodeArcGIS(lat, lng, lang) {
  const params = new URLSearchParams({
    location: `${lng},${lat}`,
    f: "json",
    langCode: lang === "ar" ? "ar" : "en",
    outFields: "Addr_type,LongLabel,ShortLabel,Match_addr",
  });
  const url = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?" + params.toString();
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) return null;
  const data = await r.json();
  const a = data?.address;
  if (!a) return null;
  // Prefer a concise locality-level label; fall back to longer labels.
  return a.Match_addr || a.ShortLabel || a.LongLabel || null;
}

async function reverseGeocodeNominatim(lat, lng, lang) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=" +
    encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) +
    "&zoom=16&accept-language=" + lang;
  const r = await fetch(url, {
    headers: { "User-Agent": "Kasir/1.0 (local marketplace app)", "Accept": "application/json" },
  });
  if (!r.ok) return null;
  const data = await r.json();
  if (!data) return null;
  // Build a concise label from address parts: locality + city, falling back to display_name.
  const a = data.address || {};
  const locality = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.district || a.hamlet || a.village || a.town || a.city || "";
  const region = a.city || a.town || a.village || a.county || a.state_district || a.state || "";
  const parts = [locality, region].filter(Boolean);
  let name = parts.length > 1 && parts[0] !== parts[1] ? parts.join(", ") : (parts[0] || data.display_name || "");
  // If we only got one part, fall back to a trimmed display_name (first 3 components).
  if (!name && data.display_name) name = data.display_name.split(",").slice(0, 3).join(",").trim();
  return name || null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const country = String(body?.country || "SA").toUpperCase();
    const lang = body?.lang === "ar" ? "ar" : "en";

    // Reverse geocoding: lat/lng → place name.
    // Nominatim first (more reliable locality names for Saudi/Gulf),
    // ArcGIS as fallback.
    const lat = parseFloat(body?.lat);
    const lng = parseFloat(body?.lng);
    if (!isNaN(lat) && !isNaN(lng) && !body?.query) {
      let name = null;
      try { name = await reverseGeocodeNominatim(lat, lng, lang); } catch {}
      if (!name || name.length < 4) {
        try { name = await reverseGeocodeArcGIS(lat, lng, lang); } catch {}
      }
      return Response.json({ name });
    }

    const query = String(body?.query || "").trim().slice(0, 200);
    if (query.length < 3) return Response.json({ results: [] });

    const cc = CC_BY_COUNTRY[country] || "";
    let results = [];
    try {
      results = await geocodeArcGIS(query, cc, lang);
    } catch {}
    if (!results.length) {
      try {
        results = await geocodeNominatim(query, cc, lang);
      } catch {}
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}