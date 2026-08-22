import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Increments an item's view counter as the service role. The Item entity's
// update RLS only permits the seller (or admin) to update, so a buyer's
// client-side Item.update was silently rejected — views never moved. This
// function runs the increment server-side so any authenticated viewer counts.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id;
    if (!itemId) return Response.json({ error: 'item_id is required' }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    // Don't inflate a seller's own views.
    if (item.seller_id === user.id) return Response.json({ ok: true, counted: false });

    await base44.asServiceRole.entities.Item.update(itemId, { views: (Number(item.views) || 0) + 1 });
    return Response.json({ ok: true, counted: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}