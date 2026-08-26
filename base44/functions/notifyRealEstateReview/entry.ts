import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Notifies all admin users when a Saudi real estate listing is submitted for
// review (review_status "pending"). Called from the Sell flow (new listing)
// and the EditListing flow (re-submission of a rejected listing). Each created
// Notification record triggers the "Notification Push" workflow, which
// delivers the native push to each admin.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.item_id || "").trim();
    if (!itemId) return Response.json({ error: "No item_id" }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    // Only the listing's seller (or an admin) may trigger admin notifications.
    if (item.seller_id !== caller.id && caller.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, "-created_date", 500);
    const title = item.title || "";
    const text = `إعلان عقاري جديد بحاجة للمراجعة: "${title}"`;
    const img = (Array.isArray(item.images) && item.images[0]) || "";

    let notified = 0;
    for (const admin of admins || []) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          type: "listing_pending_review",
          item_id: item.id,
          item_title: title,
          item_image: img,
          text,
          actor_name: item.seller_name || "",
        });
        notified++;
      } catch {}
    }

    return Response.json({ ok: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}