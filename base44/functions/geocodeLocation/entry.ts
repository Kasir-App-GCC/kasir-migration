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
    headers: { "User-Agent": "Souqna/1.0 (local marketplace app)", "Accept": "application/json" },
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (Array.isArray(data) ? data : [])
    .map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
    .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || "").trim().slice(0, 200);
    if (query.length < 3) return Response.json({ results: [] });

    const country = String(body?.country || "SA").toUpperCase();
    const lang = body?.lang === "ar" ? "ar" : "en";
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