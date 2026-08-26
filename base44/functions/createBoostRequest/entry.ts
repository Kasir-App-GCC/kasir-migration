import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "../../shared/boostPricing.ts";

// Creates a pending BoostRequest with the promotion amount computed
// server-side from the item's stored price, then creates a Moyasar invoice for
// that amount and returns the hosted checkout URL. After the user pays,
// Moyasar redirects back to the item page, where confirmBoostPayment verifies
// the payment and activates the boost immediately — no admin review needed.
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

    // auth.me() returns first_name/last_name/username/full_name — no `name`
    // field — so build the display name the same way the client store does.
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.full_name || user.email || "";

    // Create the BoostRequest as pending, stamped with a placeholder receipt
    // until the Moyasar invoice id is known.
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

    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) {
      return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    }

    const origin = (body?.origin || "https://kasir-ksa.base44.app").replace(/\/$/, "");
    const amountHalalas = Math.round(amount * 100);
    const authHeader = "Basic " + btoa(secretKey + ":");

    const moyasarRes = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: `تعزيز إعلان - كاسر (${hours} ساعة)`,
        callback_url: `${origin}/item/${item.id}?boost_payment=1`,
        success_url: `${origin}/item/${item.id}?boost_payment=1`,
        back_url: `${origin}/item/${item.id}`,
        metadata: {
          type: "boost",
          user_id: user.id,
          boost_request_id: created.id,
          item_id: item.id,
          hours: String(hours),
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      // Roll back the pending request so a failed invoice doesn't linger.
      try { await base44.entities.BoostRequest.update(created.id, { status: "rejected" }); } catch (e) {}
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    // Stamp the invoice id on the pending request for traceability + lookup.
    try { await base44.entities.BoostRequest.update(created.id, { receipt_url: "moyasar:" + data.id }); } catch (e) {}

    return Response.json({ ok: true, amount, request: created, url: data.url, invoiceId: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}