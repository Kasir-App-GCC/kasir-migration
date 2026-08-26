import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";

// Verifies a Moyasar payment for a boost and activates the promotion
// immediately (no admin review). Called from the item page after Moyasar
// redirects back with ?boost_payment=1&id=<payment|invoice id>.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const paymentId = (body.paymentId || "").trim();
    if (!paymentId) return Response.json({ error: "Missing payment ID" }, { status: 400 });

    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });

    const authHeader = "Basic " + btoa(secretKey + ":");

    // The redirect from Moyasar invoice checkout may append either a payment ID
    // or an invoice ID. Try the payments API first; fall back to the invoices
    // API and look for a paid payment in its payments array.
    let paid = false;
    let resolvedPaymentId = paymentId;
    let metadata: any = null;

    const payRes = await fetch("https://api.moyasar.com/v1/payments/" + paymentId, {
      headers: { Authorization: authHeader },
    });
    if (payRes.ok) {
      const payData = await payRes.json();
      if (payData.status === "paid") {
        paid = true;
        metadata = payData.metadata || null;
      }
    } else {
      const invRes = await fetch("https://api.moyasar.com/v1/invoices/" + paymentId, {
        headers: { Authorization: authHeader },
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const paidPayment = (invData.payments || []).find((p) => p.status === "paid");
        if (paidPayment) {
          paid = true;
          resolvedPaymentId = paidPayment.id;
          metadata = invData.metadata || paidPayment.metadata || null;
        }
      } else {
        const invData = await invRes.json().catch(() => ({}));
        return Response.json({ error: invData?.message || "Payment lookup failed" }, { status: 400 });
      }
    }

    if (!paid) {
      return Response.json({ ok: false, error: "Payment not completed" });
    }

    // Ownership: the invoice metadata carries the user_id set at checkout.
    const metaUserId = metadata?.user_id ? String(metadata.user_id) : "";
    if (metaUserId && metaUserId !== String(user.id)) {
      return Response.json({ error: "Payment does not belong to this account" }, { status: 403 });
    }

    const requestId = metadata?.boost_request_id ? String(metadata.boost_request_id) : "";
    const itemId = metadata?.item_id ? String(metadata.item_id) : "";
    const hours = Math.max(0, Math.floor(Number(metadata?.hours) || 0));

    let request = null;
    if (requestId) {
      try { request = await base44.asServiceRole.entities.BoostRequest.get(requestId); } catch { request = null; }
    }

    // Idempotency: if already approved, the boost is already live.
    if (request && request.status === "approved") {
      return Response.json({ ok: true, activated: true, already: true });
    }

    if (request) {
      if (String(request.user_id) !== String(user.id)) {
        return Response.json({ error: "Boost request ownership mismatch" }, { status: 403 });
      }
      await base44.asServiceRole.entities.BoostRequest.update(request.id, {
        status: "approved",
        reviewed_by: "system",
        receipt_url: "moyasar:" + resolvedPaymentId,
      });
    } else if (itemId) {
      // Fallback (legacy/edge case): create an approved record from metadata.
      const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.full_name || user.email || "";
      const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
      request = await base44.asServiceRole.entities.BoostRequest.create({
        item_id: itemId,
        item_title: item?.title || "",
        user_id: user.id,
        user_name: userName,
        hours,
        cross_country: false,
        amount: 0,
        status: "approved",
        reviewed_by: "system",
        receipt_url: "moyasar:" + resolvedPaymentId,
      });
    }

    // Activate the boost on the item. Only extend the featured window if the
    // new boost pushes it further out than an existing active boost — never
    // shorten a paid promotion.
    const boostHours = request?.hours || hours;
    if (itemId && boostHours > 0) {
      const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
      const until = new Date(Date.now() + boostHours * 3600 * 1000).toISOString();
      const existingUntil = item?.featured_until ? new Date(item.featured_until).getTime() : 0;
      const featuredUntil = new Date(until).getTime() > existingUntil ? until : item.featured_until;
      await base44.asServiceRole.entities.Item.update(itemId, {
        featured: true,
        featured_until: featuredUntil,
      });
    }

    try {
      await base44.entities.Notification.create({
        user_id: user.id,
        type: "boost_approved",
        item_id: itemId,
        item_title: request?.item_title || "",
        text: "تم تفعيل تعزيز إعلانك ⭐",
      });
    } catch (e) {}

    return Response.json({ ok: true, activated: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}