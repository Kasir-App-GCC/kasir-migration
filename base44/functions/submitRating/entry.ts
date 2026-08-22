import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Server-side rating creation with real authorization: a buyer may only rate
// the seller of an item actually sold to them, and a seller may only rate the
// actual buyer. Enforces one rating per (item, rater, role). The previous
// client-side Rating.create let anyone create ratings for anyone with no
// transaction, inflating scores.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id;
    const role = body?.role; // "buyer" (caller bought) | "seller" (caller sold)
    const score = Number(body?.score);
    const review = (body?.review || '').toString().slice(0, 1000);
    const ratedUserId = body?.rated_user_id || null;
    if (!itemId) return Response.json({ error: 'item_id is required' }, { status: 400 });
    if (!['buyer', 'seller'].includes(role)) return Response.json({ error: 'Invalid role' }, { status: 400 });
    if (!Number.isFinite(score) || score < 1 || score > 5) return Response.json({ error: 'Score must be 1-5' }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.status !== 'sold') return Response.json({ error: 'Item must be sold before rating' }, { status: 400 });

    let ratedId, ratedName, raterRole;
    if (role === 'buyer') {
      // caller is the buyer, rating the seller
      if (item.sold_to !== user.id) return Response.json({ error: 'You can only rate after purchasing this item' }, { status: 403 });
      ratedId = item.seller_id;
      ratedName = item.seller_name;
      raterRole = 'buyer';
    } else {
      // caller is the seller, rating the buyer
      if (item.seller_id !== user.id) return Response.json({ error: 'Only the seller can rate the buyer' }, { status: 403 });
      if (!ratedUserId) return Response.json({ error: 'rated_user_id is required' }, { status: 400 });
      if (item.sold_to !== ratedUserId) return Response.json({ error: 'You can only rate the actual buyer' }, { status: 403 });
      ratedId = ratedUserId;
      ratedName = item.sold_to_name;
      raterRole = 'seller';
    }

    // One rating per (item, rater, role)
    const existing = await base44.asServiceRole.entities.Rating.filter(
      { item_id: itemId, rater_user_id: user.id, role: raterRole },
      '-created_date',
      1
    );
    if (existing && existing.length) return Response.json({ error: 'You have already rated this transaction' }, { status: 409 });

    await base44.asServiceRole.entities.Rating.create({
      rated_user_id: ratedId,
      rated_user_name: ratedName,
      rater_user_id: user.id,
      rater_name: user.name || user.full_name || null,
      score,
      review,
      item_id: itemId,
      role: raterRole,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}