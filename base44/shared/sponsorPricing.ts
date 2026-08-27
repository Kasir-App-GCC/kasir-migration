// Server-side self-service sponsorship pricing (SAR). Linear: 1 week = 330,
// each extra week +270 → 2 weeks = 600, 3 weeks = 870, … 12 weeks = 3300.
// Priced for enterprises/merchants moving volume (premium top-of-feed pin),
// not casual individuals — hence the premium per-week cost.
export const SPONSOR_MIN_WEEKS = 1;
export const SPONSOR_MAX_WEEKS = 12;

export function computeSponsorPrice(weeks: number): number {
  const w = Math.max(SPONSOR_MIN_WEEKS, Math.min(SPONSOR_MAX_WEEKS, Math.floor(Number(weeks) || 0)));
  return 60 + 270 * w;
}