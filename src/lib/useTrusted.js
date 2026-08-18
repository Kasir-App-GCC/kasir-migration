import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: userId -> boolean. Shared across all components so a
// seller seen in the feed, chat list, and detail page is fetched only once.
const cache = new Map();

export async function fetchTrusted(userId) {
  if (!userId) return false;
  if (cache.has(userId)) return cache.get(userId);
  try {
    const p = await base44.functions.invoke("getPublicProfile", { user_id: userId });
    const val = !!p?.data?.is_trusted;
    cache.set(userId, val);
    return val;
  } catch {
    return false;
  }
}

export function useTrusted(userId) {
  const [trusted, setTrusted] = useState(() => (userId && cache.has(userId) ? cache.get(userId) : false));
  useEffect(() => {
    if (!userId) return;
    if (cache.has(userId)) { setTrusted(cache.get(userId)); return; }
    let active = true;
    fetchTrusted(userId).then((v) => { if (active) setTrusted(v); });
    return () => { active = false; };
  }, [userId]);
  return trusted;
}