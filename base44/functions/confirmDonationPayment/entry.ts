import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

// Records an in-app support (donation) payment into the Payment ledger the
// moment the Moyasar checkout is paid — so the admin dashboard reflects
// revenue immediately, without waiting for a manual Payments-tab-open sync.
//
// Two entry points (mirrors confirmBoostPayment):
//   1. Client invoke after the popup detects success: { invoice_id }.
//   2. Moyasar invoice webhook (POST body = the invoice object): the
//      callback_url can point here so the record is created server-side even
//      if the user closes the tab. The webhook is verified by re-fetching the
//      invoice with the secret key — a forged body without a real paid
//      invoice records nothing.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    const authHeader = "Basic " + btoa(secretKey + ":");

    // Detect a Moyasar invoice webhook: body is the invoice object with a
    // `payments` array.
    const isInvoiceWebhook = !!body && !!body.id && typeof body.status === "string" && Array.isArray(body.payments);

    let invoiceId = "";
    let user: any = null;

    if (isInvoiceWebhook) {
      invoiceId = String(body.id);
    } else {
      user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      invoiceId = String(body?.invoice_id || "").trim();
      if (!invoiceId) return Response.json({ error: "invoice_id required" }, { status: 400 });
    }

    // Re-fetch the invoice to verify it's actually paid.
    const invRes = await fetch("https://api.moyasar.com/v1/invoices/" + invoiceId, {
      headers: { Authorization: authHeader },
    });
    if (!invRes.ok) return Response.json({ error: "Invoice lookup failed" }, { status: 400 });
    const invData: any = await invRes.json();
    const paidPayment = (invData.payments || []).find((p: any) => p.status === "paid");
    if (!paidPayment) return Response.json({ ok: false, error: "Payment not completed" });

    const metadata: any = invData.metadata || paidPayment.metadata || null;
    const moyasarPaymentId = String(paidPayment.id);

    // Ownership check for client invokes: the invoice metadata carries the
    // user_id set at checkout. Webhooks have no session, so trust metadata.
    if (!isInvoiceWebhook) {
      const metaUserId = metadata?.user_id ? String(metadata.user_id) : "";
      if (metaUserId && metaUserId !== String(user.id)) {
        return Response.json({ error: "Payment does not belong to this account" }, { status: 403 });
      }
    }

    // Idempotent: skip if already recorded (re-running never doubles).
    const existing = await base44.asServiceRole.entities.Payment.filter(
      { moyasar_payment_id: moyasarPaymentId },
      "-created_date",
      1
    );
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, payment_id: existing[0].id });
    }

    // Resolve the payer's display name (only the user_id was sent to Moyasar).
    const userId = metadata?.user_id ? String(metadata.user_id) : "";
    let userName = "";
    if (userId) {
      try {
        const u = await base44.asServiceRole.entities.User.get(userId);
        if (u) userName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.full_name || u.email || "";
      } catch {}
    }

    const created = await base44.asServiceRole.entities.Payment.create({
      user_id: userId,
      user_name: userName,
      user_email: "",
      amount: (Number(invData.amount) || 0) / 100,
      type: "donation",
      status: "paid",
      moyasar_invoice_id: invoiceId,
      moyasar_payment_id: moyasarPaymentId,
      reference_id: "",
      description: String(invData.description || ""),
    });

    return Response.json({ ok: true, already: false, payment_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}