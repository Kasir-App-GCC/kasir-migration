import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Notifies every user who saved a listing when its price drops. Called from
// the EditListing screen after the seller saves a lower price. The caller must
// own the item; Favorite + Notification are written with the service role since
// the seller isn't the owner of those favoriter records.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id;
    const oldPrice = Number(body?.old_price);
    const newPrice = Number(body?.new_price);
    if (!itemId || !Number.isFinite(newPrice)) return Response.json({ error: "Missing item_id or new_price" }, { status: 400 });
    if (Number.isFinite(oldPrice) && newPrice >= oldPrice) return Response.json({ ok: true, skipped: true });

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id) return Response.json({ error: "Only the seller can notify price drops" }, { status: 403 });

    const favs = await base44.asServiceRole.entities.Favorite.filter({ item_id: itemId }, "-created_date", 500);
    const text = `🔥 انخفض سعر "${item.title || ""}" — قد يعجبك الآن`;
    let sent = 0;
    for (const f of (favs || [])) {
      if (!f.user_id || f.user_id === user.id) continue;
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: f.user_id,
          type: "price_drop",
          text,
          item_id: itemId,
          item_title: item.title || "",
          item_image: (item.images && item.images[0]) || "",
          actor_name: user.name || user.full_name || "",
        });
        sent++;
      } catch {}
    }
    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}