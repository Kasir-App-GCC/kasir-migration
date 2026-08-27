import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { computeSponsorPrice, SPONSOR_MIN_WEEKS, SPONSOR_MAX_WEEKS } from "../../shared/sponsorPricing.ts";

// Creates a SponsorRequest record (status "pending") and notifies all admins
// for review. No payment is taken here — the admin approves first, then the
// user pays via the invoice created at approval time (see reviewSponsorRequest).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = (body.item_id || "").toString();
    const weeks = Math.floor(Number(body.weeks) || 0);

    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });
    if (weeks < SPONSOR_MIN_WEEKS || weeks > SPONSOR_MAX_WEEKS) {
      return Response.json({ error: "Invalid duration" }, { status: 400 });
    }

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id && item.created_by_id !== user.id) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const amount = computeSponsorPrice(weeks);

    // One open request per item at a time — avoid duplicate pending requests.
    const existing = await base44.entities.SponsorRequest.filter(
      { item_id: itemId, user_id: user.id, status: { $in: ["pending", "approved"] } },
      "-created_date",
      5
    ).catch(() => []);
    if (existing && existing.length > 0) {
      return Response.json({ ok: true, already_pending: true, request_id: existing[0].id, status: existing[0].status });
    }

    const request = await base44.entities.SponsorRequest.create({
      item_id: item.id,
      item_title: item.title || "",
      user_id: user.id,
      user_name: user.full_name || user.username || user.email || "",
      weeks,
      amount,
      status: "pending",
    });

    // Notify all admins of the new sponsorship request.
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, "-created_date", 500);
      for (const admin of admins || []) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          type: "admin_message",
          text: `طلب رعاية جديد: "${item.title || ""}" (${weeks} أسبوع)`,
          actor_name: "طلب رعاية",
          item_id: item.id,
          item_title: item.title || "",
          reference_id: request.id,
        });
      }
    } catch (e) {}

    return Response.json({ ok: true, request_id: request.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}