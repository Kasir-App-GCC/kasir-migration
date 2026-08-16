import { SAUDI_CITIES } from "@/lib/constants";

export function cityCoords(name) {
  if (!name) return null;
  const c = SAUDI_CITIES.find((x) => x.en === name || x.ar === name);
  return c && c.lat ? c : null;
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchLocation(it, loc) {
  if (!loc) return true;
  if (loc.mode === "city") {
    if (!loc.city) return true;
    return it.city === loc.city;
  }
  if (loc.mode === "radius") {
    if (!loc.lat || !loc.lng) return true;
    // Use the item's exact GPS pin if present; otherwise fall back to city center
    const c = (it.lat && it.lng) ? { lat: it.lat, lng: it.lng } : cityCoords(it.city);
    if (!c) return false;
    return distanceKm(loc.lat, loc.lng, c.lat, c.lng) <= loc.radius;
  }
  return true;
}