import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";

// Verifies a Moyasar payment for a boost and activates the promotion
// immediately (no admin review). Two entry points:
//   1. Client invoke after the Moyasar redirect: { paymentId } | { invoiceId } |
//      { boostRequestId } (boostRequestId is our own reference embedded in the
//      success_url, so confirmation works even if Moyasar appends nothing).
//   2. Moyasar invoice webhook (POST body = the invoice object): the callback_url
//      points here, so the boost activates server-side even if the user closes
//      the tab before the redirect lands. The webhook is verified by re-fetching
//      the invoice from Moyasar with the secret key — a forged body without a
//      real paid invoice activates nothing.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    const authHeader = "Basic " + btoa(secretKey + ":");

    // Detect a Moyasar webhook: the body is the full invoice object with a
    // status and a payments array.
    const isWebhook = !!body && !!body.id && typeof body.status === "string" && Array.isArray(body.payments);

    let metadata: any = null;
    let resolvedPaymentId = "";
    let invoiceId = "";

    if (isWebhook) {
      invoiceId = String(body.id);
      const invRes = await fetch("https://api.moyasar.com/v1/invoices/" + invoiceId, {
        headers: { Authorization: authHeader },
      });
      if (!invRes.ok) return Response.json({ error: "Invoice lookup failed" }, { status: 400 });
      const invData = await invRes.json();
      const paidPayment = (invData.payments || []).find((p) => p.status === "paid");
      if (!paidPayment) return Response.json({ ok: false, error: "Payment not completed" });
      metadata = invData.metadata || paidPayment.metadata || null;
      resolvedPaymentId = paidPayment.id;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const paymentId = (body.paymentId || "").trim();
      const invoiceIdParam = (body.invoiceId || "").trim();
      const boostRequestId = (body.boostRequestId || "").trim();

      let lookupId = paymentId || invoiceIdParam;

      // No Moyasar id? Resolve the invoice id from the BoostRequest's receipt_url
      // using our own embedded reference (the `br` query param).
      if (!lookupId && boostRequestId) {
        try {
          const br = await base44.asServiceRole.entities.BoostRequest.get(boostRequestId);
          if (br?.receipt_url && String(br.receipt_url).startsWith("moyasar:")) {
            lookupId = String(br.receipt_url).slice("moyasar:".length);
          }
        } catch {}
      }

      if (!lookupId) return Response.json({ error: "Missing payment reference" }, { status: 400 });

      let paid = false;
      const payRes = await fetch("https://api.moyasar.com/v1/payments/" + lookupId, {
        headers: { Authorization: authHeader },
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.status === "paid") {
          paid = true;
          metadata = payData.metadata || null;
          resolvedPaymentId = payData.id;
          if (payData.invoice_id) invoiceId = String(payData.invoice_id);
        }
      } else {
        const invRes = await fetch("https://api.moyasar.com/v1/invoices/" + lookupId, {
          headers: { Authorization: authHeader },
        });
        if (invRes.ok) {
          const invData = await invRes.json();
          invoiceId = String(invData.id);
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

      if (!paid) return Response.json({ ok: false, error: "Payment not completed" });

      // Ownership: the invoice metadata carries the user_id set at checkout.
      const metaUserId = metadata?.user_id ? String(metadata.user_id) : "";
      if (metaUserId && metaUserId !== String(user.id)) {
        return Response.json({ error: "Payment does not belong to this account" }, { status: 403 });
      }
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
      await base44.asServiceRole.entities.BoostRequest.update(request.id, {
        status: "approved",
        reviewed_by: "system",
        receipt_url: "moyasar:" + (resolvedPaymentId || invoiceId),
      });
    } else if (itemId) {
      const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
      request = await base44.asServiceRole.entities.BoostRequest.create({
        item_id: itemId,
        item_title: item?.title || "",
        user_id: metadata?.user_id ? String(metadata.user_id) : "",
        user_name: "",
        hours,
        cross_country: false,
        amount: 0,
        status: "approved",
        reviewed_by: "system",
        receipt_url: "moyasar:" + (resolvedPaymentId || invoiceId),
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

    const notifyUserId = metadata?.user_id ? String(metadata.user_id) : request?.user_id || "";
    if (notifyUserId) {
      try {
        // Boosts are fully automated now (no admin review), so skip the
        // confirmation notification for admin accounts — only the end user
        // gets a "your boost is live" notice.
        const notifyUser = await base44.asServiceRole.entities.User.get(notifyUserId).catch(() => null);
        if (notifyUser?.role !== "admin") {
          await base44.asServiceRole.entities.Notification.create({
            user_id: notifyUserId,
            type: "boost_approved",
            item_id: itemId,
            item_title: request?.item_title || "",
            text: "تم تفعيل تعزيز إعلانك ⭐",
          });
        }
      } catch (e) {}
    }

    return Response.json({ ok: true, activated: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}