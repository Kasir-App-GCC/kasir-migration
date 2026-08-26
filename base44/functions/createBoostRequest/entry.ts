import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "../../shared/boostPricing.ts";
import { createMoyasarInvoice } from "../../shared/moyasarInvoice.ts";

// Creates a pending BoostRequest with the promotion amount computed
// server-side, then creates a Moyasar invoice and returns the hosted checkout
// URL. The client redirects there; after payment, Moyasar redirects back to
// /item/<id>?boost_payment=1&id=<payment_id>, where confirmBoostPayment
// verifies the payment and activates the boost.
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

    const { amount } = computeBoostPrice(Number(item.price) || 0, hours);

    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.full_name || user.email || "";

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

    const origin = (body?.origin || "https://kasir-ksa.base44.app").replace(/\/$/, "");
    const { url } = await createMoyasarInvoice({
      amountSar: amount,
      description: `تعزيز إعلان - كاسر (${hours} ساعة)`,
      callbackUrl: `${origin}/item/${item.id}?boost_payment=1`,
      metadata: {
        type: "boost",
        user_id: String(user.id),
        boost_request_id: String(created.id),
        item_id: String(item.id),
        hours: String(hours),
      },
    });

    return Response.json({ ok: true, amount, requestId: created.id, itemId: item.id, hours, url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}