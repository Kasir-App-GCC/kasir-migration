import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Accepts an offer (seller only). Other offers on the item are intentionally
// LEFT as backups — the accepted buyer may not be serious (no-show), so
// keeping pending/countered offers lets the seller fall back to them. Backup
// offers are only cancelled once the item is actually sold, in confirmReceipt
// or markItemSold. Notification messages stay client-side for the chat UX.
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
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}