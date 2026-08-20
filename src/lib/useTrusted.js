import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: userId -> { trusted, rating, count, _ts }. Shared across all
// components so a seller seen in the feed, chat list, and detail page is
// fetched only once. Entries expire after CACHE_TTL so a seller verified
// after their info was first cached (trusted:false) eventually refreshes
// and the verified badge appears without requiring a full page reload.
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached(userId) {
  if (!cache.has(userId)) return null;
  const entry = cache.get(userId);
  if (Date.now() - (entry._ts || 0) > CACHE_TTL) {
    cache.delete(userId);
    return null;
  }
  return entry;
}

export async function fetchSellerInfo(userId) {
  if (!userId) return { trusted: false, rating: null, count: 0 };
  const cached = getCached(userId);
  if (cached) return cached;
  try {
    const p = await base44.functions.invoke("getPublicProfile", { user_id: userId });
    const info = {
      trusted: !!p?.data?.is_trusted,
      rating: p?.data?.rating_count ? Number(p.data.rating_avg) : null,
      count: p?.data?.rating_count || 0,
      _ts: Date.now(),
    };
    cache.set(userId, info);
    return info;
  } catch {
    return { trusted: false, rating: null, count: 0 };
  }
}

// Batched fetch: returns a map of userId -> { trusted, rating, count } for many
// sellers in one backend call (getPublicProfiles). Populates the shared cache so
// the per-card useSellerInfo hook hits the cache instead of firing N individual
// getPublicProfile requests — the old N+1 that saturated phones and hung the feed.
export async function fetchSellerInfos(userIds) {
  const unique = Array.from(new Set((userIds || []).filter(Boolean)));
  if (!unique.length) return {};
  const out = {};
  const toFetch = [];
  for (const id of unique) {
    const cached = getCached(id);
    if (cached) out[id] = cached;
    else toFetch.push(id);
  }
  if (toFetch.length) {
    try {
      const res = await base44.functions.invoke("getPublicProfiles", { user_ids: toFetch });
      const results = res?.data?.results || {};
      for (const id of toFetch) {
        const p = results[id];
        const info = p
          ? { trusted: !!p.is_trusted, rating: p.rating_count ? Number(p.rating_avg) : null, count: p.rating_count || 0, _ts: Date.now() }
          : { trusted: false, rating: null, count: 0, _ts: Date.now() };
        cache.set(id, info);
        out[id] = info;
      }
    } catch {
      for (const id of toFetch) {
        const info = { trusted: false, rating: null, count: 0, _ts: Date.now() };
        cache.set(id, info);
        out[id] = info;
      }
    }
  }
  return out;
}

export async function fetchTrusted(userId) {
  return (await fetchSellerInfo(userId)).trusted;
}

// Drop a seller's cached profile so the next read re-fetches fresh data.
// Called after admin actions (e.g. verification approval) so the verified
// badge appears instantly without waiting for the TTL to expire.
export function invalidateSellerCache(userId) {
  if (userId) cache.delete(userId);
}

export function useTrusted(userId) {
  const [trusted, setTrusted] = useState(() => (userId && getCached(userId) ? getCached(userId).trusted : false));
  useEffect(() => {
    if (!userId) return;
    const cached = getCached(userId);
    if (cached) { setTrusted(cached.trusted); return; }
    let active = true;
    fetchSellerInfo(userId).then((info) => { if (active) setTrusted(info.trusted); });
    return () => { active = false; };
  }, [userId]);
  return trusted;
}

// Returns the full cached seller info: { trusted, rating, count }.
export function useSellerInfo(userId) {
  const [info, setInfo] = useState(() =>
    userId && getCached(userId) ? getCached(userId) : { trusted: false, rating: null, count: 0 }
  );
  useEffect(() => {
    if (!userId) return;
    const cached = getCached(userId);
    if (cached) { setInfo(cached); return; }
    let active = true;
    fetchSellerInfo(userId).then((i) => { if (active) setInfo(i); });
    return () => { active = false; };
  }, [userId]);
  return info;
}