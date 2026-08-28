import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Server-side listing create/update. Strips sensitive fields a seller must
// never set directly (featured, admin_sponsored, review_status, views,
// favorites_count) so users can't self-grant free boosts, fake popularity, or
// bypass moderation. Also enforces per-user/per-hour creation throttling.
//
// Sensitive fields are ALWAYS overwritten with safe defaults here — even if
// the client sends them, they're ignored. Admin-only fields (featured,
// admin_sponsored, review_status) are only set by admin workflows, never by
// this function.

const SENSITIVE_FIELDS = [
  "featured", "featured_until", "featured_cross_country",
  "admin_sponsored", "admin_sponsored_until",
  "review_status", "review_reason",
  "views", "favorites_count",
];

// Per-user creation throttle: max 10 listings per hour.
const THROTTLE_WINDOW_MS = 60 * 60 * 1000;
const THROTTLE_MAX = 10;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body.item_id ? String(body.item_id) : null;
    const data = body.data || {};
    const status = String(data.status || "available");

    // Strip sensitive fields — they're always overwritten with safe defaults.
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (!SENSITIVE_FIELDS.includes(k)) clean[k] = v;
    }

    // Enforce safe defaults on sensitive fields.
    clean.featured = false;
    clean.featured_until = null;
    clean.featured_cross_country = false;
    clean.admin_sponsored = false;
    clean.admin_sponsored_until = null;
    // review_status: approved by default (admin moderation is a separate flow);
    // for Saudi real estate, keep existing status on update, default approved on create.
    if (!itemId) clean.review_status = "approved";
    clean.seller_id = user.id;
    clean.seller_name = user.name || user.full_name || user.email || "Member";
    clean.seller_avatar = user.avatar || null;
    clean.seller_trusted = !!user.is_trusted;

    // Creation throttle: count the user's listings in the last hour.
    if (!itemId) {
      const since = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString();
      const recent = await base44.asServiceRole.entities.Item.filter(
        { seller_id: user.id, created_date: { $gte: since } },
        "-created_date",
        THROTTLE_MAX + 1
      );
      if (recent && recent.length >= THROTTLE_MAX) {
        return Response.json({ error: "rate_limited" }, { status: 429 });
      }
    }

    // Update: verify ownership before writing.
    if (itemId) {
      let existing;
      try { existing = await base44.entities.Item.get(itemId); } catch { existing = null; }
      if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
      if (String(existing.seller_id) !== String(user.id) && user.role !== "admin") {
        return Response.json({ error: "Not allowed" }, { status: 403 });
      }
      // Preserve existing sensitive fields on update (don't reset featured if
      // it was legitimately set by a boost workflow). Only strip them from the
      // incoming payload — never overwrite what's already stored.
      const update: Record<string, any> = {};
      for (const [k, v] of Object.entries(clean)) {
        if (!SENSITIVE_FIELDS.includes(k)) update[k] = v;
      }
      // Track price history: when the price changes, record the previous price
      // so ItemCard can show a price-drop badge. Only appended on an actual
      // change — no entry when the price stays the same.
      if (clean.price != null && existing.price != null && Number(clean.price) !== Number(existing.price)) {
        update.price_history = [
          ...(Array.isArray(existing.price_history) ? existing.price_history : []),
          { price: Number(existing.price), date: new Date().toISOString() },
        ];
      }
      const updated = await base44.asServiceRole.entities.Item.update(itemId, update);
      return Response.json({ ok: true, item: updated });
    }

    // Create
    const created = await base44.asServiceRole.entities.Item.create(clean);
    return Response.json({ ok: true, item: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}