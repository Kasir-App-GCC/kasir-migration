import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Increments a listing's view count server-side so unauthenticated (guest)
// views are counted too. The Item entity's update RLS only allows the seller
// or an admin, so a client-side increment silently failed for guests (and for
// any logged-in non-owner it wrote the whole record). This runs as the service
// role and atomically $inc's views, skipping the owner's own views.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const itemId = String(body.item_id || "");
    if (!itemId) return Response.json({ error: "item_id required" }, { status: 400 });

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