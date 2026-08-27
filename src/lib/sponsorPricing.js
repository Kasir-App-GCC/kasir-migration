// Client-side mirror of base44/shared/sponsorPricing.ts — used for live price
// display in the sponsor dialog. The server recomputes authoritatively on
// charge, so this can't be tampered with to pay less.
export const SPONSOR_MIN_WEEKS = 1;
export const SPONSOR_MAX_WEEKS = 12;

export function computeSponsorPrice(weeks) {
  const w = Math.max(SPONSOR_MIN_WEEKS, Math.min(SPONSOR_MAX_WEEKS, Math.floor(Number(weeks) || 0)));
  return 20 + 90 * w;
}