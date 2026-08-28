import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Grants the trusted badge after a verification payment. Two entry points:
//   1. Client invoke after the popup polling detects "paid": { verificationRequestId }
//      — looks up the local VerificationRequest, reads the invoice id from
//      payment_receipt_url ("moyasar:<invoice_id>"), fetches the invoice directly
//      from Moyasar, and reads the metadata from the invoice (where Moyasar
//      stores it for hosted-checkout payments). This mirrors the boost flow and
//      avoids the fragile payment-first lookup (payment objects often have
//      empty metadata). Also accepts { invoiceId } for the redirect-return case.
//   2. Moyasar invoice webhook (POST body = the invoice object): the callback_url
//      points here, so the badge is granted server-side even if the user closes
//      the popup before the client confirm lands. Verified by re-fetching the
//      invoice from Moyasar with the secret key — a forged body grants nothing.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const isInvoiceWebhook = !!body && !!body.id && typeof body.status === 'string' && Array.isArray(body.payments);
    const isPaymentWebhook = !!body && !!body.id && typeof body.status === 'string' && !!body.source && !Array.isArray(body.payments);

    let metadata: any = null;
    let resolvedPaymentId = '';

    if (isInvoiceWebhook) {
      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!invRes.ok) return Response.json({ error: 'Invoice lookup failed' }, { status: 400 });
      const invData = await invRes.json();
      const paidPayment = (invData.payments || []).find((p) => p.status === 'paid');
      if (!paidPayment) return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = invData.metadata || paidPayment.metadata || null;
      resolvedPaymentId = paidPayment.id;
    } else if (isPaymentWebhook) {
      // Re-fetch the payment to verify (forged body grants nothing).
      const payRes = await fetch('https://api.moyasar.com/v1/payments/' + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!payRes.ok) return Response.json({ error: 'Payment lookup failed' }, { status: 400 });
      const payData = await payRes.json();
      if (payData.status !== 'paid') return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = payData.metadata || null;
      resolvedPaymentId = String(payData.id);
      // Metadata lives on the invoice — join back to recover verification_request_id.
      if (payData.invoice_id) {
        try {
          const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + String(payData.invoice_id), {
            headers: { Authorization: authHeader },
          });
          if (invRes.ok) {
            const invData = await invRes.json();
            if (invData.metadata) metadata = { ...(invData.metadata || {}), ...(metadata || {}) };
          }
        } catch {}
      }
    } else {
      // Client confirm. Preferred: verificationRequestId (local record → invoice).
      // Also accept invoiceId directly (redirect return / back compat).
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const verificationRequestId = (body.verificationRequestId || '').trim();
      const invoiceIdParam = (body.invoiceId || body.paymentId || '').trim();

      // Early idempotency: if we have a local request id, check it first —
      // an already-approved request means the badge was already granted, so
      // we short-circuit before hitting Moyasar (the receipt_url stores the
      // payment id after approval, not the invoice id).
      if (verificationRequestId) {
        try {
          const vr = await base44.asServiceRole.entities.VerificationRequest.get(verificationRequestId);
          if (vr && vr.status === 'approved') {
            return Response.json({ ok: true, verified: true, already: true });
          }
        } catch {}
      }

      let lookupInvoiceId = invoiceIdParam;

      // Resolve the invoice id from the local VerificationRequest record —
      // same pattern as the boost flow (local id → receipt_url → invoice).
      if (!lookupInvoiceId && verificationRequestId) {
        try {
          const vr = await base44.asServiceRole.entities.VerificationRequest.get(verificationRequestId);
          if (vr?.payment_receipt_url && String(vr.payment_receipt_url).startsWith('moyasar:')) {
            lookupInvoiceId = String(vr.payment_receipt_url).slice('moyasar:'.length);
          }
        } catch {}
      }

      if (!lookupInvoiceId) return Response.json({ error: 'Missing payment reference' }, { status: 400 });

      // Fetch the invoice directly — metadata lives here, not on the payment.
      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + lookupInvoiceId, {
        headers: { Authorization: authHeader },
      });
      if (!invRes.ok) {
        const invData = await invRes.json().catch(() => ({}));
        return Response.json({ error: invData?.message || 'Invoice lookup failed' }, { status: 400 });
      }
      const invData = await invRes.json();
      const paidPayment = (invData.payments || []).find((p) => p.status === 'paid');
      if (!paidPayment) return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = invData.metadata || paidPayment.metadata || null;
      resolvedPaymentId = paidPayment.id;

      // Ownership: the invoice metadata carries the user_id set at checkout.
      const metaUserId = metadata?.user_id ? String(metadata.user_id) : '';
      if (metaUserId && metaUserId !== String(user.id)) {
        return Response.json({ error: 'Payment does not belong to this account' }, { status: 403 });
      }
    }

    const requestId = metadata?.verification_request_id ? String(metadata.verification_request_id) : '';
    const userId = metadata?.user_id ? String(metadata.user_id) : '';

    let request = null;
    if (requestId) {
      try { request = await base44.asServiceRole.entities.VerificationRequest.get(requestId); } catch { request = null; }
    }

    // Idempotency: already approved → nothing to do.
    if (request && request.status === 'approved') {
      return Response.json({ ok: true, verified: true, already: true });
    }

    if (request) {
      await base44.asServiceRole.entities.VerificationRequest.update(request.id, {
        status: 'approved',
        reviewed_by: 'system',
        payment_receipt_url: 'moyasar:' + resolvedPaymentId,
      });
    } else if (userId) {
      // Fallback (legacy/edge case): create an approved record from metadata.
      await base44.asServiceRole.entities.VerificationRequest.create({
        user_id: userId,
        user_name: '',
        user_email: '',
        full_name: metadata?.full_name || '',
        phone: metadata?.phone || '',
        national_id: '',
        status: 'approved',
        reviewed_by: 'system',
        payment_receipt_url: 'moyasar:' + resolvedPaymentId,
      });
    } else {
      return Response.json({ error: 'Cannot resolve verification request' }, { status: 400 });
    }

    const targetUserId = request ? String(request.user_id) : userId;
    await base44.asServiceRole.entities.User.update(targetUserId, { is_trusted: true });

    // Sync the denormalized seller_trusted flag so the "verified only" filter
    // includes this seller's listings server-side.
    try {
      await base44.asServiceRole.entities.Item.updateMany(
        { seller_id: targetUserId },
        { $set: { seller_trusted: true } }
      );
    } catch (e) {}

    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: targetUserId,
        type: 'verification_approved',
        text: 'تم توثيق حسابك بنجاح! 🎉',
      });
    } catch (e) {}

    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}