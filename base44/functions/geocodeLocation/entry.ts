import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const CC_BY_COUNTRY = {
  SA: "sa", AE: "ae", OM: "om", BH: "bh", KW: "kw", QA: "qa",
};

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

    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=" +
      encodeURIComponent(query) +
      (cc ? "&countrycodes=" + cc : "") +
      "&accept-language=" + lang;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Souqna/1.0 (local marketplace app)",
        "Accept": "application/json",
      },
    });
    if (!r.ok) return Response.json({ results: [] });

    const data = await r.json();
    const results = (Array.isArray(data) ? data : [])
      .map((d) => ({
        label: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
      }))
      .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}