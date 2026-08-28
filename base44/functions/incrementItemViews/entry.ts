import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Increments a listing's view count server-side so unauthenticated (guest)
// views are counted too. The Item entity's update RLS only allows the seller
// or an admin, so a client-side increment silently failed for guests (and for
// any logged-in non-owner it wrote the whole record). This runs as the service
// role and atomically $inc's views, skipping the owner's own views.
//
// Security: the public function URL could be abused to inflate views, so a
// best-effort per-instance rate limiter caps calls per IP and de-dupes repeated
// views of the same item from the same IP within a short window.

const ipHits = new Map<string, number[]>();
const recentItemViews = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const DEDUPE_MS = 30_000;
// Prune expired entries periodically to prevent unbounded memory growth.
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPrune = 0;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  return fwd.split(",")[0].trim() || "anon";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const itemId = String(body.item_id || "");
    if (!itemId) return Response.json({ error: "item_id required" }, { status: 400 });

    // Rate limit by IP to curb artificial inflation via the public URL.
    const ip = clientIp(req);
    const now = Date.now();
    // Periodic pruning: remove expired entries from both Maps to prevent
    // unbounded memory growth on long-lived instances.
    if (now - lastPrune > PRUNE_INTERVAL_MS) {
      lastPrune = now;
      for (const [k, ts] of ipHits) {
        const filtered = ts.filter((t) => now - t < WINDOW_MS);
        if (filtered.length) ipHits.set(k, filtered); else ipHits.delete(k);
      }
      for (const [k, t] of recentItemViews) {
        if (now - t > 24 * 60 * 60 * 1000) recentItemViews.delete(k);
      }
    }
    const hits = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    if (hits.length >= MAX_PER_WINDOW) {
      return Response.json({ ok: true, counted: false, reason: "rate_limited" });
    }
    hits.push(now);
    ipHits.set(ip, hits);

    // De-duplicate repeated views: per-user (24h) for authenticated viewers,
    // per-IP (1h) for public/unauthenticated viewers — IP-based so guest views
    // can't be inflated by replaying the public URL.
    const isAuth = !!body.viewer_id;
    const dedupeKey = isAuth ? `user|${body.viewer_id}|${itemId}` : `ip|${ip}|${itemId}`;
    const dedupeMs = isAuth ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const last = recentItemViews.get(dedupeKey);
    if (last && now - last < dedupeMs) {
      return Response.json({ ok: true, counted: false });
    }
    recentItemViews.set(dedupeKey, now);

    // Don't count the owner's own views.
    if (body.seller_id && body.viewer_id && String(body.viewer_id) === String(body.seller_id)) {
      return Response.json({ ok: true, counted: false });
    }

    await base44.asServiceRole.entities.Item.updateMany({ id: itemId }, { $inc: { views: 1 } });
    return Response.json({ ok: true, counted: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}