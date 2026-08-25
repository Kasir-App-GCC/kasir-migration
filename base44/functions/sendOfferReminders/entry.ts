import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Scans for pending offers that have been waiting 2+ days without a response
// and sends a reminder notification to the party who needs to act:
//   - buyer_offer    → the seller must accept/reject/counter
//   - seller_counter  → the buyer must respond to the counter
// Uses updated_date as the "last action" timestamp so modifying an offer
// restarts the 2-day clock. reminder_sent_at prevents duplicate reminders
// (only re-notifies if the offer was touched since the last reminder).
// Called from a scheduled workflow; runs as the service role (no user
// context). We query the server for offers already past the 2-day threshold
// (oldest first) so we process the most stale ones first — instead of only
// the 500 newest pending offers, which at scale would miss older stale ones.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const cutoff = new Date(now - TWO_DAYS_MS).toISOString();
    const offers = await base44.asServiceRole.entities.Offer.filter(
      { status: "pending", updated_date: { $lt: cutoff } },
      "updated_date",
      500
    );

    const stale = (offers || []).filter((o) => {
      const updated = o.updated_date ? new Date(o.updated_date).getTime() : 0;
      const reminded = o.reminder_sent_at ? new Date(o.reminder_sent_at).getTime() : 0;
      // Only remind if we haven't reminded since the last update
      return reminded < updated;
    });

    let sent = 0;
    for (const o of stale) {
      const isBuyerOffer = o.direction !== "seller_counter";
      const recipientId = isBuyerOffer ? o.seller_id : o.buyer_id;
      const actorName = isBuyerOffer ? o.buyer_name : o.seller_name;
      if (!recipientId) continue;
      const title = o.item_title || "";
      const text = isBuyerOffer
        ? `لديك عرض معلق على "${title}" بانتظار ردك منذ يومين`
        : `لديك معارضة سعر على "${title}" بانتظار ردك منذ يومين`;
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: recipientId,
          type: "offer_reminder",
          text,
          item_id: o.item_id || null,
          item_title: title || null,
          chatroom_id: o.chatroom_id || null,
          offer_amount: o.amount || null,
          actor_name: actorName || "",
        });
        await base44.asServiceRole.entities.Offer.update(o.id, {
          reminder_sent_at: new Date().toISOString(),
        });
        sent++;
      } catch {}
    }

    return Response.json({ ok: true, checked: (offers || []).length, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}