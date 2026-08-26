import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "../../shared/boostPricing.ts";

// Prepares an in-app boost payment: creates a pending BoostRequest with the
// promotion amount computed server-side from the item's price, and returns
// the amount + request id + Moyasar publishable key. The client embeds the
// Moyasar Payment Form with the request id as metadata; once the card payment
// completes in-app, confirmBoostPayment verifies it and activates the boost.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = (body.item_id || "").toString();
    const hours = Math.floor(Number(body.hours) || 0);

    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });
    if (hours < BOOST_MIN_HOURS || hours > BOOST_MAX_HOURS) {
      return Response.json({ error: "Invalid duration" }, { status: 400 });
    }

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id && item.created_by_id !== user.id) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const publishableKey = secrets.get("MOYASAR_PUBLISHABLE_KEY");
    if (!publishableKey) {
      return Response.json({ error: "MOYASAR_PUBLISHABLE_KEY not set" }, { status: 500 });
    }

    const { amount } = computeBoostPrice(Number(item.price) || 0, hours);

    // auth.me() returns first_name/last_name/username/full_name — no `name`
    // field — so build the display name the same way the client store does.
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.full_name || user.email || "";

    // Create the BoostRequest as pending. The Moyasar payment is created
    // client-side by the embedded form; this request id is attached as payment
    // metadata so confirmBoostPayment can resolve and activate it once paid.
    const created = await base44.entities.BoostRequest.create({
      item_id: item.id,
      item_title: item.title,
      user_id: user.id,
      user_name: userName,
      hours,
      cross_country: false,
      amount,
      status: "pending",
    });

    return Response.json({
      ok: true,
      amount,
      requestId: created.id,
      itemId: item.id,
      hours,
      publishableKey,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}