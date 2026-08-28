import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Server-side favorite toggle. Increments/decrements the item's favorites_count
// via the service role (Item update RLS blocks non-owner writes, so a
// client-side $inc silently failed for buyers). Also creates/deletes the
// Favorite record. Returns the new fav state so the client can update its
// local cache.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = String(body.item_id || "");
    if (!itemId) return Response.json({ error: "item_id required" }, { status: 400 });
    const unmark = !!body.unmark;

    if (unmark) {
      await base44.asServiceRole.entities.Favorite.deleteMany({ user_id: user.id, item_id: itemId }).catch(() => {});
      await base44.asServiceRole.entities.Item.updateMany({ id: itemId }, { $inc: { favorites_count: -1 } }).catch(() => {});
      return Response.json({ ok: true, fav: false });
    }

    // Check for existing favorite to avoid double-counting.
    const existing = await base44.entities.Favorite.filter({ user_id: user.id, item_id: itemId }, "-created_date", 1).catch(() => []);
    if (existing && existing.length) {
      return Response.json({ ok: true, fav: true });
    }

    await base44.asServiceRole.entities.Favorite.create({ user_id: user.id, item_id: itemId }).catch(() => {});
    await base44.asServiceRole.entities.Item.updateMany({ id: itemId }, { $inc: { favorites_count: 1 } }).catch(() => {});
    return Response.json({ ok: true, fav: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}