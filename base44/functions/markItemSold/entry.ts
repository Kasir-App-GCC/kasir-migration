import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Marks an item sold (seller only), cancels any pending offers on it, and
// notifies the buyer. Replaces the client-side Item.update which had no
// cancellation of dangling offers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id;
    const buyerId = body?.buyer_id || null;
    const buyerName = body?.buyer_name || null;
    const lang = body?.lang === 'ar' ? 'ar' : 'en';
    if (!itemId) return Response.json({ error: 'item_id is required' }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.seller_id !== user.id) return Response.json({ error: 'Only the seller can mark an item sold' }, { status: 403 });
    if (item.status === 'sold') return Response.json({ error: 'Item is already sold' }, { status: 400 });

    await base44.asServiceRole.entities.Item.update(itemId, {
      status: 'sold',
      sold_to: buyerId,
      sold_to_name: buyerName,
    });
    // Cancel all backup offers on the item (pending, countered, or accepted)
    await base44.asServiceRole.entities.Offer.updateMany(
      { item_id: itemId, status: { $in: ['pending', 'countered', 'accepted'] } },
      { $set: { status: 'rejected' } }
    ).catch(() => {});
    // Notify the buyer if known
    if (buyerId) {
      const text = lang === 'ar'
        ? `تم بيع «${item.title}» إليك 🎉`
        : `"${item.title}" has been sold to you 🎉`;
      await base44.asServiceRole.entities.Notification.create({
        user_id: buyerId,
        type: 'sold',
        item_id: itemId,
        item_title: item.title,
        item_image: item.images?.[0] || null,
        text,
        actor_name: user.name || user.full_name || null,
        actor_id: user.id,
      }).catch(() => {});
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}