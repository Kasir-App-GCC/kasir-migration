// Cumulative tiered boost pricing based on total accumulated boost time.
// Each new hour is priced by where it lands in the 0–168h accumulated range
// (existing boost + new hours), so stacking short boosts can't re-earn the
// cheapest first-tier rate every time — that's the whole point of the model.
//
// Tiers (base SAR/hr + cross-country SAR/hr add-on):
//   0–24h  → 5 + 3
//   24–48h → 4 + 3
//   48h–1wk → 3 + 2
// Total accumulated boost is capped at 1 week (168h); minimum purchase is 2h.

export const BOOST_MAX_HOURS = 168;
export const BOOST_MIN_HOURS = 2;

const TIERS = [
  { upTo: 24, base: 5, cross: 3 },
  { upTo: 48, base: 4, cross: 3 },
  { upTo: 168, base: 3, cross: 2 },
];

function tierAt(hour) {
  for (const t of TIERS) if (hour < t.upTo) return t;
  return null;
}

// Cost of adding `hours` new boost hours on top of `startHour` already-accumulated hours.
export function computeBoostCost(startHour, hours, cross) {
  const start = Math.max(0, Math.min(startHour, BOOST_MAX_HOURS));
  const end = Math.min(start + Math.max(0, hours), BOOST_MAX_HOURS);
  let baseAmount = 0;
  let crossAmount = 0;
  for (let h = start; h < end; h++) {
    const tier = tierAt(h);
    if (!tier) break;
    baseAmount += tier.base;
    if (cross) crossAmount += tier.cross;
  }
  return { amount: baseAmount + crossAmount, baseAmount, crossAmount, effectiveHours: end - start };
}

// Breakdown of the new hours by tier segment, for display.
export function buildBoostSegments(startHour, hours) {
  const start = Math.max(0, Math.min(startHour, BOOST_MAX_HOURS));
  const end = Math.min(start + Math.max(0, hours), BOOST_MAX_HOURS);
  const segments = [];
  let h = start;
  while (h < end) {
    const tier = tierAt(h);
    if (!tier) break;
    const segEnd = Math.min(end, tier.upTo);
    segments.push({ base: tier.base, cross: tier.cross, hours: segEnd - h });
    h = segEnd;
  }
  return segments;
}

// Remaining accumulated boost hours from a featured_until ISO string.
export function existingBoostHours(featuredUntil) {
  if (!featuredUntil) return 0;
  const ms = new Date(featuredUntil).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.min(BOOST_MAX_HOURS, Math.ceil(ms / 3600000));
}