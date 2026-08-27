// Device-local "recently viewed" items (localStorage, max 20). Stored as
// lightweight snapshots — enough for ItemCard to render without a re-fetch.
const KEY = "kasir_recently_viewed";
const MAX = 20;

export function getRecentlyViewed() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item) {
  if (!item?.id) return;
  try {
    const list = getRecentlyViewed().filter((i) => i.id !== item.id);
    // Keep only the fields ItemCard needs to render — drop heavy/unneeded data.
    const snap = {
      id: item.id,
      title: item.title,
      price: item.price,
      images: item.images?.slice(0, 3) || [],
      category: item.category,
      condition: item.condition,
      city: item.city,
      country: item.country || "SA",
      status: item.status,
      seller_id: item.seller_id,
      seller_name: item.seller_name,
      seller_avatar: item.seller_avatar,
      seller_trusted: item.seller_trusted,
      featured: item.featured,
      featured_until: item.featured_until,
      admin_sponsored: item.admin_sponsored,
      admin_sponsored_until: item.admin_sponsored_until,
      views: item.views,
      favorites_count: item.favorites_count,
      created_date: item.created_date,
    };
    list.unshift(snap);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event("recently-viewed-changed"));
  } catch {}
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("recently-viewed-changed"));
}