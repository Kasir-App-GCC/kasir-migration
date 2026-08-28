import { fetchSellerInfos } from "@/lib/useTrusted";

// Thin shared wrapper over the module-level seller cache in useTrusted.js.
// Exposes a Map-returning getMany(ids) so Home's refresh / loadFeatured /
// loadSponsored / loadMore all share one deduped, in-memory seller cache
// keyed by seller_id — overlapping ids are served from cache without a
// redundant backend fetch.
export async function getSellerInfos(ids) {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (!unique.length) return {};
  return fetchSellerInfos(unique);
}