import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: userId -> { trusted, rating, count, _ts }. Shared across all
// components so a seller seen in the feed, chat list, and detail page is
// fetched only once. Entries expire after CACHE_TTL so a seller verified
// after their info was first cached (trusted:false) eventually refreshes
// and the verified badge appears without requiring a full page reload.
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Pub-sub: userId -> Set of callbacks. When invalidateSellerCache runs,
// every mounted useSellerInfo hook for that user re-reads the cache so
// the verified badge appears on already-mounted cards instantly.
const listeners = new Map();

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

// Update a seller's cached profile and notify mounted hooks so the verified
// badge appears instantly on already-mounted cards. If `patch` is omitted the
// entry is deleted (next read re-fetches); otherwise the entry is updated in
// place. Called after admin actions (e.g. verification approval).
export function invalidateSellerCache(userId, patch) {
  if (!userId) return;
  if (patch) {
    const cur = cache.get(userId) || { trusted: false, rating: null, count: 0, _ts: Date.now() };
    cache.set(userId, { ...cur, ...patch, _ts: Date.now() });
  } else {
    cache.delete(userId);
  }
  const cbs = listeners.get(userId);
  if (cbs) cbs.forEach((cb) => cb());
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
// Subscribes to cache invalidations so the component re-renders the moment
// a seller's trust status changes (e.g. admin approves verification).
export function useSellerInfo(userId) {
  const [info, setInfo] = useState(() =>
    userId && getCached(userId) ? getCached(userId) : { trusted: false, rating: null, count: 0 }
  );
  useEffect(() => {
    if (!userId) return;
    const apply = () => {
      const cached = getCached(userId);
      if (cached) setInfo(cached);
      else fetchSellerInfo(userId).then((i) => setInfo(i));
    };
    const cached = getCached(userId);
    if (cached) { setInfo(cached); } else { let active = true; fetchSellerInfo(userId).then((i) => { if (active) setInfo(i); }); }
    let cbs = listeners.get(userId);
    if (!cbs) { cbs = new Set(); listeners.set(userId, cbs); }
    cbs.add(apply);
    return () => {
      const s = listeners.get(userId);
      if (s) s.delete(apply);
      if (s && s.size === 0) listeners.delete(userId);
    };
  }, [userId]);
  return info;
}