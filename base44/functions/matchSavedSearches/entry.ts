import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { WORKFLOW_SECRET } from '../../shared/workflowSecret.ts';

// Called by the "Saved Search Alert" workflow whenever a new Item is created.
// Reads all SavedSearch records (service role), matches them against the new
// item, and creates a "saved_search_match" Notification for each matching
// buyer (excluding the seller's own searches). The existing Notification Push
// workflow then fires the native push. A shared secret is verified so the
// public function URL can't be abused by external callers.

function matchSearch(s, item) {
  if (s.country && item.country && s.country !== item.country) return false;
  if (s.category && s.category !== "all" && item.category && item.category !== s.category) return false;
  if (Array.isArray(s.subcategory) && s.subcategory.length) {
    const itemSubs = Array.isArray(item.subcategory) ? item.subcategory : [];
    if (!s.subcategory.some((sub) => itemSubs.includes(sub))) return false;
  }
  if (s.city && item.city && String(s.city).toLowerCase() !== String(item.city).toLowerCase()) return false;
  if (typeof s.price_min === "number" && s.price_min > 0 && (item.price == null || item.price < s.price_min)) return false;
  if (typeof s.price_max === "number" && s.price_max > 0 && (item.price == null || item.price > s.price_max)) return false;
  if (s.condition && item.condition && s.condition !== item.condition) return false;
  if (s.query) {
    const q = String(s.query).toLowerCase().trim();
    if (q) {
      const hay = `${item.title || ""} ${item.description || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (body?.secret !== WORKFLOW_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const itemId = String(body?.item_id || "").trim();
    if (!itemId) return Response.json({ error: "No item_id" }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.status && item.status !== "available") return Response.json({ matched: 0 });

    const searches = await base44.asServiceRole.entities.SavedSearch.list("-created_date", 500);
    const list = searches || [];

    let matched = 0;
    for (const s of list) {
      if (!s.user_id) continue;
      if (s.user_id === item.seller_id) continue; // don't notify the seller about their own listing
      if (!matchSearch(s, item)) continue;
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: s.user_id,
          type: "saved_search_match",
          item_id: item.id,
          item_title: item.title || "",
          item_image: (Array.isArray(item.images) && item.images[0]) || "",
          text: `إعلان جديد يطابق بحثك المحفوظ`,
          actor_name: item.title || "",
        });
        matched++;
      } catch {}
    }

    return Response.json({ ok: true, checked: list.length, matched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}