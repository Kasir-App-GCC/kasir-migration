import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Accepts an offer (seller only) and atomically rejects every OTHER pending
// offer on the same item, so a seller can no longer have multiple accepted
// offers at once. This intentionally does NOT mark the item sold — the app's
// escrow flow keeps "accepted" = price agreed, and the item is marked sold
// only when the buyer confirms receipt (see confirmReceipt). Notification
// messages stay client-side to preserve the existing chat UX.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const offerId = body?.offer_id;
    if (!offerId) return Response.json({ error: 'offer_id is required' }, { status: 400 });

    const offer = await base44.asServiceRole.entities.Offer.get(offerId).catch(() => null);
    if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.seller_id !== user.id) return Response.json({ error: 'Only the seller can accept offers' }, { status: 403 });
    if (!['pending', 'countered'].includes(offer.status)) {
      return Response.json({ error: 'Offer is no longer pending' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Offer.update(offerId, { status: 'accepted' });
    // Reject the rest of the pending offers on the same item
    await base44.asServiceRole.entities.Offer.updateMany(
      { item_id: offer.item_id, status: 'pending', id: { $ne: offerId } },
      { $set: { status: 'rejected' } }
    ).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}