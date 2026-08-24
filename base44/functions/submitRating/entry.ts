import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Creates a rating server-side. Rating.create RLS is admin-only, so ratings
// can only be created here, which enforces:
//  - The caller is a party (buyer or seller) of the offer.
//  - The offer is accepted or completed.
//  - The rated user is the OTHER party (no self-ratings).
//  - One rating per (offer, rater) — duplicates are rejected.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const offerId = String(body.offer_id || "");
    if (!offerId) return Response.json({ error: "offer_id required" }, { status: 400 });
    const score = Number(body.score);
    if (!score || score < 1 || score > 5) return Response.json({ error: "Invalid score" }, { status: 400 });

    let offer;
    try { offer = await base44.entities.Offer.get(offerId); } catch { offer = null; }
    if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });
    if (String(offer.buyer_id) !== String(user.id) && String(offer.seller_id) !== String(user.id))
      return Response.json({ error: "Not a party" }, { status: 403 });
    if (offer.status !== "accepted" && offer.status !== "completed")
      return Response.json({ error: "Offer not accepted" }, { status: 400 });

    const isBuyer = String(offer.buyer_id) === String(user.id);
    const ratedId = isBuyer ? offer.seller_id : offer.buyer_id;
    const ratedName = isBuyer ? offer.seller_name : offer.buyer_name;
    if (String(ratedId) === String(user.id)) return Response.json({ error: "Can't rate yourself" }, { status: 400 });

    const existing = await base44.entities.Rating.filter(
      { rater_user_id: user.id, offer_id: offerId },
      "-created_date",
      1
    );
    if (existing && existing.length) return Response.json({ error: "already_rated" }, { status: 409 });

    const review = String(body.review || "").slice(0, 1000);
    const created = await base44.asServiceRole.entities.Rating.create({
      rated_user_id: ratedId,
      rated_user_name: ratedName,
      rater_user_id: String(user.id),
      rater_name: String(user.name || ""),
      score,
      review,
      item_id: offer.item_id,
      offer_id: offerId,
      role: isBuyer ? "buyer" : "seller",
    });
    return Response.json({ ok: true, rating: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}