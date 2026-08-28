import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Server-side mark-as-sold. Validates the caller is the item's seller, updates
// the status, and creates the "sold" notification to the buyer (if any) via
// the service role — so Notification.create RLS (admin-only) doesn't block it.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = String(body.item_id || "");
    if (!itemId) return Response.json({ error: "item_id required" }, { status: 400 });
    const buyerId = body.buyer_id ? String(body.buyer_id) : null;
    const buyerName = body.buyer_name ? String(body.buyer_name) : null;
    const unmark = !!body.unmark;

    let item;
    try { item = await base44.entities.Item.get(itemId); } catch { item = null; }
    if (!item) return Response.json({ error: "Not found" }, { status: 404 });
    if (String(item.seller_id) !== String(user.id) && user.role !== "admin") {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    if (unmark) {
      const updated = await base44.asServiceRole.entities.Item.update(itemId, {
        status: "available", sold_to: null, sold_to_name: null,
      });
      return Response.json({ ok: true, item: updated });
    }

    const updated = await base44.asServiceRole.entities.Item.update(itemId, {
      status: "sold",
      sold_to: buyerId || null,
      sold_to_name: buyerName || null,
    });

    if (buyerId) {
      try {
        const text = `تم بيع «${item.title || ""}» إليك 🎉 · "${item.title || ""}" has been sold to you 🎉`;
        await base44.asServiceRole.entities.Notification.create({
          user_id: buyerId,
          type: "sold",
          item_id: itemId,
          item_title: item.title || "",
          item_image: item.images?.[0] || null,
          text,
        });
      } catch {}
    }

    return Response.json({ ok: true, item: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}