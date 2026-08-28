const CC_BY_COUNTRY = {
  SA: "SA", AE: "AE", OM: "OM", BH: "BH", KW: "KW", QA: "QA",
};

// GCC-only enforcement: the marketplace operates exclusively in Saudi Arabia,
// UAE, Oman, Bahrain, Kuwait, and Qatar. Locations outside the GCC (e.g.
// Jordan, Iraq, Iran) are rejected at the geocoding layer so every location
// field across the app (listing form, buy requests, map) is covered in one
// place. A generous bounding box gives a fast first reject; the country code
// returned by the geocoding API gives the precise second check.
const GCC_CODES = new Set(["SA", "AE", "OM", "BH", "KW", "QA"]);
const CC3_TO_CC2 = { SAU: "SA", ARE: "AE", OMN: "OM", BHR: "BH", KWT: "KW", QAT: "QA" };
const GCC_BBOX = { minLat: 15, maxLat: 33, minLng: 34, maxLng: 61 };

function inGccBbox(lat, lng) {
  return (
    lat >= GCC_BBOX.minLat && lat <= GCC_BBOX.maxLat &&
    lng >= GCC_BBOX.minLng && lng <= GCC_BBOX.maxLng
  );
}

function normalizeCc(raw) {
  if (!raw) return "";
  const upper = String(raw).toUpperCase();
  if (GCC_CODES.has(upper)) return upper;
  if (CC3_TO_CC2[upper]) return CC3_TO_CC2[upper];
  return upper;
}

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
    .filter((d) => !isNaN(d.lat) && !isNaN(d.lng) && inGccBbox(d.lat, d.lng));
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
    .filter((d) => !isNaN(d.lat) && !isNaN(d.lng) && inGccBbox(d.lat, d.lng));
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
  return { name: a.Match_addr || a.ShortLabel || a.LongLabel || null, city: a.City || "", state: a.Region || a.Subregion || "", cc: normalizeCc(a.CountryCode || a.country_code || "") };
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
  if (!name) return null;
  return { name, city: a.city || a.town || a.village || "", state: a.state || a.state_district || "", cc: normalizeCc(a.country_code || "") };
}

// Security: this is a public function (used on public pages for location
// detection), so we can't require login. Instead of a fragile Origin/Referer
// check (which breaks across the published app, builder preview, and custom
// domains, and is trivially spoofed by non-browser callers), we rate-limit
// per IP — the same pattern used by incrementItemViews. This prevents the
// server-to-server abuse / third-party rate-limit exhaustion the access
// control was meant to stop, while working from any legitimate app domain.
const ipHits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 30;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  return fwd.split(",")[0].trim() || "anon";
}

export default async function (req) {
  try {
    // Security: this is a public function (used on public pages for location
    // detection), so we can't require login. Instead of a fragile Origin/Referer
    // check (which breaks across the published app, builder preview, and custom
    // domains, and is trivially spoofed by non-browser callers), we rate-limit
    // per IP — the same pattern used by incrementItemViews. This prevents the
    // server-to-server abuse / third-party rate-limit exhaustion the access
    // control was meant to stop, while working from any legitimate app domain.
    const ip = clientIp(req);
    const now = Date.now();
    const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (hits.length >= RATE_MAX_PER_WINDOW) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    hits.push(now);
    ipHits.set(ip, hits);

    const body = await req.json().catch(() => ({}));
    const country = String(body?.country || "SA").toUpperCase();
    const lang = body?.lang === "ar" ? "ar" : "en";

    // GCC-only: reject any request targeting a non-GCC country.
    if (!GCC_CODES.has(country)) {
      return Response.json({ error: "Location must be within the GCC" }, { status: 400 });
    }

    // Reverse geocoding: lat/lng → place name.
    // Nominatim first (more reliable locality names for Saudi/Gulf),
    // ArcGIS as fallback.
    const lat = parseFloat(body?.lat);
    const lng = parseFloat(body?.lng);
    if (!isNaN(lat) && !isNaN(lng) && !body?.query) {
      // Validate lat/lng ranges to prevent abuse.
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return Response.json({ name: null, city: null, state: null });
      }
      // Fast reject: coordinates clearly outside the GCC bounding box (e.g.
      // Jordan, Iraq, Iran) — no need to call the geocoding APIs.
      if (!inGccBbox(lat, lng)) {
        return Response.json({ name: null, city: null, state: null, outOfArea: true });
      }
      let result = null;
      try { result = await reverseGeocodeNominatim(lat, lng, lang); } catch {}
      if (!result || !result.name || result.name.length < 4) {
        try { const r2 = await reverseGeocodeArcGIS(lat, lng, lang); if (r2) result = r2; } catch {}
      }
      // Precise check: the geocoding API's country code must be GCC. This
      // catches coordinates inside the bbox but in a neighboring country.
      if (result && result.cc && !GCC_CODES.has(result.cc)) {
        return Response.json({ name: null, city: null, state: null, outOfArea: true });
      }
      return Response.json(result
        ? { name: result.name, city: result.city || null, state: result.state || null }
        : { name: null, city: null, state: null });
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