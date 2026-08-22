import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Lets the rated seller post a single public reply to a review about them.
// RLS only lets the rater (or admin) update a Rating, so the reply is written
// with the service role AFTER verifying the caller is the rated seller — this
// prevents the seller from editing the score/review text itself.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const ratingId = body?.rating_id;
    const reply = String(body?.reply || "").trim().slice(0, 500);
    if (!ratingId || !reply) return Response.json({ error: "Missing rating_id or reply" }, { status: 400 });

    const rating = await base44.entities.Rating.get(ratingId);
    if (!rating) return Response.json({ error: "Not found" }, { status: 404 });
    // Only the seller being reviewed (role "buyer" = a buyer rated them) can reply.
    if (rating.rated_user_id !== user.id) return Response.json({ error: "Only the rated seller can reply" }, { status: 403 });
    if (rating.role !== "buyer") return Response.json({ error: "Only sellers can reply to buyer reviews" }, { status: 403 });
    if (rating.seller_reply) return Response.json({ error: "Already replied" }, { status: 409 });

    await base44.asServiceRole.entities.Rating.update(ratingId, {
      seller_reply: reply,
      seller_reply_date: new Date().toISOString(),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}