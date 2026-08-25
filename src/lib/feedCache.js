// In-memory stale-while-revalidate cache for listing feeds.
//
// Survives client-side navigation (the "return from item detail" case) so the
// feed renders instantly from cache, then refreshes in the background — the
// cards never disappear and the page never reloads from scratch on every
// tab-back. Cleared on a full page reload (cold start), which is expected and
// matches how OfferUp/Marketplace behave.
//
// Entries are keyed by a page+filter signature and store the last fetched
// snapshot plus a timestamp so a staleness check can decide whether a
// background refresh is worth firing on focus.

const cache = new Map();

export const FEED_STALE_MS = 60_000;

export function readFeedCache(key) {
  return cache.get(key) || null;
}

export function writeFeedCache(key, snapshot) {
  cache.set(key, { ...snapshot, ts: Date.now() });
}

export function clearFeedCache(key) {
  if (key) cache.delete(key);
  else cache.clear();
}