import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "../../shared/boostPricing.ts";

// Creates a pending BoostRequest with the promotion amount computed
// server-side from the item's stored price, so the client can't set a
// tampered amount. Only the listing's owner may request a boost.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = (body.item_id || "").toString();
    const hours = Math.floor(Number(body.hours) || 0);
    const crossCountry = !!body.cross_country;

    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });
    if (hours < BOOST_MIN_HOURS || hours > BOOST_MAX_HOURS) {
      return Response.json({ error: "Invalid duration" }, { status: 400 });
    }

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id && item.created_by_id !== user.id) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const { amount } = computeBoostPrice(Number(item.price) || 0, hours);

    const created = await base44.entities.BoostRequest.create({
      item_id: item.id,
      item_title: item.title,
      user_id: user.id,
      user_name: user.name,
      hours,
      cross_country: crossCountry,
      amount,
      status: "pending",
    });

    return Response.json({ ok: true, amount, request: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}