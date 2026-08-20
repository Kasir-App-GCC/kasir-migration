import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: userId -> { trusted, rating, count }. Shared across all
// components so a seller seen in the feed, chat list, and detail page is
// fetched only once.
const cache = new Map();

export async function fetchSellerInfo(userId) {
  if (!userId) return { trusted: false, rating: null, count: 0 };
  if (cache.has(userId)) return cache.get(userId);
  try {
    const p = await base44.functions.invoke("getPublicProfile", { user_id: userId });
    const info = {
      trusted: !!p?.data?.is_trusted,
      rating: p?.data?.rating_count ? Number(p.data.rating_avg) : null,
      count: p?.data?.rating_count || 0,
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
    if (cache.has(id)) out[id] = cache.get(id);
    else toFetch.push(id);
  }
  if (toFetch.length) {
    try {
      const res = await base44.functions.invoke("getPublicProfiles", { user_ids: toFetch });
      const results = res?.data?.results || {};
      for (const id of toFetch) {
        const p = results[id];
        const info = p
          ? { trusted: !!p.is_trusted, rating: p.rating_count ? Number(p.rating_avg) : null, count: p.rating_count || 0 }
          : { trusted: false, rating: null, count: 0 };
        cache.set(id, info);
        out[id] = info;
      }
    } catch {
      for (const id of toFetch) {
        const info = { trusted: false, rating: null, count: 0 };
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

export function useTrusted(userId) {
  const [trusted, setTrusted] = useState(() => (userId && cache.has(userId) ? cache.get(userId).trusted : false));
  useEffect(() => {
    if (!userId) return;
    if (cache.has(userId)) { setTrusted(cache.get(userId).trusted); return; }
    let active = true;
    fetchSellerInfo(userId).then((info) => { if (active) setTrusted(info.trusted); });
    return () => { active = false; };
  }, [userId]);
  return trusted;
}

// Returns the full cached seller info: { trusted, rating, count }.
export function useSellerInfo(userId) {
  const [info, setInfo] = useState(() =>
    userId && cache.has(userId) ? cache.get(userId) : { trusted: false, rating: null, count: 0 }
  );
  useEffect(() => {
    if (!userId) return;
    if (cache.has(userId)) { setInfo(cache.get(userId)); return; }
    let active = true;
    fetchSellerInfo(userId).then((i) => { if (active) setInfo(i); });
    return () => { active = false; };
  }, [userId]);
  return info;
}