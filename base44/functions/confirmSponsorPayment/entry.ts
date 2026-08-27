import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { activateSponsor } from "../../shared/activateSponsor.ts";

// Verifies a Moyasar payment for a sponsorship and activates it (pins the
// item to the top of the Home feed via admin_sponsored). Two entry points:
//   1. Client invoke after the popup payment: { invoiceId } — looks up the
//      invoice, finds the paid payment, reads metadata, activates.
//   2. Moyasar invoice webhook (POST body = the invoice object): the
//      callback_url points here so the sponsorship activates server-side
//      even if the user closes the popup before the client confirm runs.
//      Verified by re-fetching the invoice with the secret key — a forged
//      body without a real paid invoice activates nothing.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    const authHeader = "Basic " + btoa(secretKey + ":");

    const isInvoiceWebhook = !!body && !!body.id && typeof body.status === "string" && Array.isArray(body.payments);

    let metadata: any = null;
    let resolvedPaymentId = "";

    if (isInvoiceWebhook) {
      const invoiceId = String(body.id);
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

      const invoiceIdParam = (body.invoiceId || "").trim();
      if (!invoiceIdParam) return Response.json({ error: "Missing invoice reference" }, { status: 400 });

      let paid = false;
      const invRes = await fetch("https://api.moyasar.com/v1/invoices/" + invoiceIdParam, {
        headers: { Authorization: authHeader },
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const paidPayment = (invData.payments || []).find((p) => p.status === "paid");
        if (paidPayment) {
          paid = true;
          metadata = invData.metadata || paidPayment.metadata || null;
          resolvedPaymentId = paidPayment.id;
        }
      } else {
        const invData = await invRes.json().catch(() => ({}));
        return Response.json({ error: invData?.message || "Invoice lookup failed" }, { status: 400 });
      }

      if (!paid) return Response.json({ ok: false, error: "Payment not completed" });

      const metaUserId = metadata?.user_id ? String(metadata.user_id) : "";
      if (metaUserId && metaUserId !== String(user.id)) {
        return Response.json({ error: "Payment does not belong to this account" }, { status: 403 });
      }
    }

    const result = await activateSponsor(base44, {
      itemId: metadata?.item_id ? String(metadata.item_id) : "",
      weeks: Number(metadata?.weeks) || 0,
      userId: metadata?.user_id ? String(metadata.user_id) : "",
      paymentId: resolvedPaymentId,
    });
    return Response.json({ ok: true, activated: result.activated, already: result.already });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}