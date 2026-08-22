import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Buyer confirms receipt of an accepted offer. This is the moment the item is
// actually marked sold: status -> sold, sold_to set to the buyer, remaining
// pending offers on the item rejected, and the offer marked completed. The
// previous client-side Item.update failed RLS (a buyer can't update the
// seller's item), so confirmation never actually marked anything sold.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const offerId = body?.offer_id;
    const lang = body?.lang === 'ar' ? 'ar' : 'en';
    if (!offerId) return Response.json({ error: 'offer_id is required' }, { status: 400 });

    const offer = await base44.asServiceRole.entities.Offer.get(offerId).catch(() => null);
    if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.buyer_id !== user.id) return Response.json({ error: 'Only the buyer can confirm receipt' }, { status: 403 });
    if (offer.status !== 'accepted') return Response.json({ error: 'Offer must be accepted first' }, { status: 400 });

    // Mark the offer completed
    await base44.asServiceRole.entities.Offer.update(offerId, { status: 'completed', received_confirmed: true });
    // Mark the item sold to this buyer
    await base44.asServiceRole.entities.Item.update(offer.item_id, {
      status: 'sold',
      sold_to: offer.buyer_id,
      sold_to_name: offer.buyer_name || null,
    }).catch(() => {});
    // Cancel any remaining pending offers on the item
    await base44.asServiceRole.entities.Offer.updateMany(
      { item_id: offer.item_id, status: 'pending' },
      { $set: { status: 'rejected' } }
    ).catch(() => {});
    // Notify the seller
    const text = lang === 'ar'
      ? `أكّد المشتري استلام «${offer.item_title || ''}» — تم البيع ✅`
      : `Buyer confirmed receipt of "${offer.item_title || ''}" — sold ✅`;
    await base44.asServiceRole.entities.Notification.create({
      user_id: offer.seller_id,
      type: 'sold',
      item_id: offer.item_id,
      item_title: offer.item_title || null,
      text,
      actor_name: user.name || user.full_name || null,
      actor_id: user.id,
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}