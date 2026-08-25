// Best-effort in-memory per-user throttle for credit-burning functions.
// Caps calls per user within a rolling window. Resets on cold start/redeploy,
// so it's a throttle (not a hard limit) — sufficient to curb casual abuse
// without a database round-trip on every call.
const buckets = new Map<string, number[]>();

export function checkUserThrottle(
  userId: string,
  max: number,
  windowMs: number
): { allowed: boolean; count: number } {
  const now = Date.now();
  const hits = (buckets.get(userId) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(userId, hits);
    return { allowed: false, count: hits.length };
  }
  hits.push(now);
  buckets.set(userId, hits);
  return { allowed: true, count: hits.length };
}