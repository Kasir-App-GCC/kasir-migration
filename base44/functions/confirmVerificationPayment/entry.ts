import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Grants the trusted badge after a verification payment. Two entry points:
//   1. Client invoke after the popup polling detects "paid": { paymentId }.
//   2. Moyasar invoice webhook (POST body = the invoice object): the
//      callback_url points here, so the badge is granted server-side even if
//      the user closes the popup before the client confirm lands. The webhook
//      is verified by re-fetching the invoice from Moyasar with the secret key
//      — a forged body without a real paid invoice grants nothing.
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
      const payRes = await fetch('https://api.moyasar.com/v1/payments/' + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!payRes.ok) return Response.json({ error: 'Payment lookup failed' }, { status: 400 });
      const payData = await payRes.json();
      if (payData.status !== 'paid') return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = payData.metadata || null;
      resolvedPaymentId = String(payData.id);
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const paymentId = (body.paymentId || '').trim();
      if (!paymentId) return Response.json({ error: 'Missing payment ID' }, { status: 400 });

      // The success_url landing passes the VerificationRequest id as `id`. If
      // the id doesn't resolve as a Moyasar payment/invoice, try looking it up
      // as a VR and extract the real invoice id from payment_receipt_url.
      let moyasarId = paymentId;
      const vr = await base44.asServiceRole.entities.VerificationRequest.get(paymentId).catch(() => null);
      if (vr && vr.payment_receipt_url && vr.payment_receipt_url.startsWith('moyasar:')) {
        moyasarId = vr.payment_receipt_url.replace('moyasar:', '');
      }

      let paid = false;
      // Try the invoice first — invoices carry the metadata we set at creation
      // (verification_request_id, user_id), which payments may not. Then fall
      // back to a direct payment lookup (the popup onSuccess passes a payment id).
      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + moyasarId, {
        headers: { Authorization: authHeader },
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const paidPayment = (invData.payments || []).find((p) => p.status === 'paid');
        if (paidPayment) {
          paid = true;
          resolvedPaymentId = paidPayment.id;
          metadata = invData.metadata || paidPayment.metadata || null;
        }
      }
      if (!paid) {
        const payRes = await fetch('https://api.moyasar.com/v1/payments/' + moyasarId, {
          headers: { Authorization: authHeader },
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.status === 'paid') {
            paid = true;
            metadata = payData.metadata || null;
            resolvedPaymentId = payData.id;
            // Payments created from an invoice may not carry the invoice
            // metadata (verification_request_id, user_id). If empty, fetch the
            // parent invoice to recover it.
            if (!metadata && payData.invoice_id) {
              const invRes2 = await fetch('https://api.moyasar.com/v1/invoices/' + payData.invoice_id, {
                headers: { Authorization: authHeader },
              });
              if (invRes2.ok) {
                const invData2 = await invRes2.json();
                metadata = invData2.metadata || null;
              }
            }
          }
        }
      }
      if (!paid) return Response.json({ ok: false, error: 'Payment not completed' });

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