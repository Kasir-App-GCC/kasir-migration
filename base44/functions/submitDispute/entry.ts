import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Opens a dispute server-side. Dispute.create RLS is admin-only, so disputes
// can only be created here, which enforces:
//  - The caller is a party of the offer, and the offer is accepted/completed.
//  - One open dispute per offer (no spamming).
//  - Rate limit: max 10 disputes by a user in 24h.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const offerId = String(body.offer_id || "");
    if (!offerId) return Response.json({ error: "offer_id required" }, { status: 400 });
    const reason = String(body.reason || "").trim();
    if (!reason) return Response.json({ error: "Reason required" }, { status: 400 });
    const description = String(body.description || "").trim().slice(0, 2000);

    let offer;
    try { offer = await base44.entities.Offer.get(offerId); } catch { offer = null; }
    if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });
    if (String(offer.buyer_id) !== String(user.id) && String(offer.seller_id) !== String(user.id))
      return Response.json({ error: "Not a party" }, { status: 403 });
    if (offer.status !== "accepted" && offer.status !== "completed")
      return Response.json({ error: "Offer not accepted" }, { status: 400 });

    const open = await base44.entities.Dispute.filter(
      { offer_id: offerId, status: { $in: ["open", "in_progress"] } },
      "-created_date",
      1
    );
    if (open && open.length) return Response.json({ error: "dispute_already_open" }, { status: 409 });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let recent = [];
    try {
      recent = await base44.entities.Dispute.filter(
        { complainant_id: user.id, created_date: { $gte: since } },
        "-created_date",
        20
      );
    } catch {}
    if (recent && recent.length >= 10) return Response.json({ error: "rate_limit" }, { status: 429 });

    const isSeller = String(offer.seller_id) === String(user.id);
    const respondentId = isSeller ? offer.buyer_id : offer.seller_id;
    const respondentName = isSeller ? offer.buyer_name : offer.seller_name;
    const created = await base44.asServiceRole.entities.Dispute.create({
      item_id: offer.item_id,
      item_title: offer.item_title,
      offer_id: offerId,
      chatroom_id: offer.chatroom_id,
      complainant_id: String(user.id),
      complainant_name: String(user.name || ""),
      respondent_id: respondentId,
      respondent_name: respondentName,
      reason,
      description,
      status: "open",
    });
    // Deliberately do NOT notify the respondent — disputes are reviewed by
    // admins only, and alerting the other party causes friction between users.
    return Response.json({ ok: true, dispute: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}