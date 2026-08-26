import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { activateBoost } from "../../shared/activateBoost.ts";

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

    // Detect a Moyasar webhook. Two shapes:
    //   - invoice webhook (redirect flow): body is the invoice object with a
    //     `payments` array.
    //   - payment webhook (in-app direct charge): body is the payment object
    //     itself (has `source`, no `payments` array). The metadata lives
    //     directly on it.
    const isInvoiceWebhook = !!body && !!body.id && typeof body.status === "string" && Array.isArray(body.payments);
    const isPaymentWebhook = !!body && !!body.id && typeof body.status === "string" && !!body.source && !Array.isArray(body.payments);

    let metadata: any = null;
    let resolvedPaymentId = "";
    let invoiceId = "";

    if (isInvoiceWebhook) {
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
    } else if (isPaymentWebhook) {
      // Re-fetch the payment with the secret key to verify (a forged body
      // without a real paid payment activates nothing).
      const payRes = await fetch("https://api.moyasar.com/v1/payments/" + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!payRes.ok) return Response.json({ error: "Payment lookup failed" }, { status: 400 });
      const payData = await payRes.json();
      if (payData.status !== "paid") return Response.json({ ok: false, error: "Payment not completed" });
      metadata = payData.metadata || null;
      resolvedPaymentId = String(payData.id);
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

    const result = await activateBoost(base44, {
      requestId: metadata?.boost_request_id ? String(metadata.boost_request_id) : "",
      itemId: metadata?.item_id ? String(metadata.item_id) : "",
      hours: Number(metadata?.hours) || 0,
      userId: metadata?.user_id ? String(metadata.user_id) : "",
      paymentId: resolvedPaymentId,
      invoiceId,
    });
    return Response.json({ ok: true, activated: result.activated, already: result.already });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}