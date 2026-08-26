import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "../../shared/boostPricing.ts";
import { activateBoost } from "../../shared/activateBoost.ts";

// In-app (redirectless) boost payment. The client tokenizes the card directly
// with Moyasar using the publishable key (card details never touch our server)
// and sends only the token here. We charge the token server-side with the
// secret key:
//   - non-3DS cards → payment is "paid" instantly → we activate the boost now.
//   - 3DS cards → payment is "initiated" with source.transaction_url → the
//     client opens it for bank verification, then polls this same function
//     with payment_id until the status flips to "paid".
// The callback_url webhook (confirmBoostPayment) is the server-side safety net
// so the boost still activates if the user closes the app right after 3DS.
// Call with { payment_id } (no item_id/token) to poll an existing payment.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    const authHeader = "Basic " + btoa(secretKey + ":");

    // Poll mode: re-fetch an existing Moyasar payment and activate if paid.
    const paymentId = (body.payment_id || "").toString().trim();
    if (paymentId) {
      const payRes = await fetch("https://api.moyasar.com/v1/payments/" + paymentId, {
        headers: { Authorization: authHeader },
      });
      if (!payRes.ok) return Response.json({ status: "pending" });
      const payData: any = await payRes.json();
      const meta = payData.metadata || {};
      if (payData.status === "paid") {
        const result = await activateBoost(base44, {
          requestId: meta.boost_request_id ? String(meta.boost_request_id) : "",
          itemId: meta.item_id ? String(meta.item_id) : "",
          hours: Number(meta.hours) || 0,
          userId: meta.user_id ? String(meta.user_id) : "",
          paymentId: String(payData.id || ""),
          invoiceId: "",
        });
        return Response.json({ status: "paid", activated: result.activated, already: result.already });
      }
      if (payData.status === "initiated") {
        return Response.json({ status: "initiated", transaction_url: payData.source?.transaction_url || "" });
      }
      return Response.json({ status: "failed", error: payData.source?.message || payData.status });
    }

    // Charge mode: validate and create a new payment from a card token.
    const itemId = (body.item_id || "").toString();
    const hours = Math.floor(Number(body.hours) || 0);
    const token = (body.token || "").toString();

    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });
    if (!token) return Response.json({ error: "token is required" }, { status: 400 });
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
    const amountHalalas = Math.round(amount * 100);

    const moyasarRes = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: `تعزيز إعلان - كاسر (${hours} ساعة)`,
        callback_url: `${origin}/functions/confirmBoostPayment`,
        source: { type: "token", token },
        metadata: {
          type: "boost",
          user_id: user.id,
          boost_request_id: created.id,
          item_id: item.id,
          hours: String(hours),
        },
      }),
    });

    const data: any = await moyasarRes.json();
    if (!moyasarRes.ok) {
      try { await base44.entities.BoostRequest.update(created.id, { status: "rejected" }); } catch (e) {}
      const errMsg = data?.message || data?.errors?.source?.[0] || data?.errors || `Moyasar error (${moyasarRes.status})`;
      return Response.json({ status: "failed", error: errMsg });
    }

    try { await base44.entities.BoostRequest.update(created.id, { receipt_url: "moyasar:" + data.id }); } catch (e) {}

    if (data.status === "paid") {
      const result = await activateBoost(base44, {
        requestId: created.id,
        itemId: item.id,
        hours,
        userId: user.id,
        paymentId: String(data.id || ""),
        invoiceId: "",
      });
      return Response.json({ status: "paid", activated: result.activated, already: result.already, amount });
    }
    if (data.status === "initiated") {
      return Response.json({ status: "initiated", transaction_url: data.source?.transaction_url || "", payment_id: data.id, amount });
    }
    return Response.json({ status: "failed", error: data.source?.message || data.status, amount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}