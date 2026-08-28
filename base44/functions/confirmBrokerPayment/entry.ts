import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Grants the real estate broker badge after the one-time activation fee is
// paid. Two entry points (same pattern as verification/boost):
//   1. Client invoke after popup polling detects "paid": { invoiceId } — fetches
//      the invoice directly from Moyasar and reads metadata from it (where
//      hosted-checkout stores the metadata), avoiding the fragile payment-first
//      lookup (payment objects often have empty metadata).
//   2. Moyasar invoice webhook (callback_url points here): the badge is granted
//      server-side even if the user closes the popup before the client confirm
//      lands. Verified by re-fetching the invoice from Moyasar with the secret
//      key — a forged body grants nothing.
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

    if (isInvoiceWebhook) {
      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!invRes.ok) return Response.json({ error: 'Invoice lookup failed' }, { status: 400 });
      const invData = await invRes.json();
      const paidPayment = (invData.payments || []).find((p) => p.status === 'paid');
      if (!paidPayment) return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = invData.metadata || paidPayment.metadata || null;
    } else if (isPaymentWebhook) {
      const payRes = await fetch('https://api.moyasar.com/v1/payments/' + String(body.id), {
        headers: { Authorization: authHeader },
      });
      if (!payRes.ok) return Response.json({ error: 'Payment lookup failed' }, { status: 400 });
      const payData = await payRes.json();
      if (payData.status !== 'paid') return Response.json({ ok: false, error: 'Payment not completed' });
      metadata = payData.metadata || null;
      // Metadata lives on the invoice — join back to recover it.
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
      // Client confirm: fetch the invoice directly by invoiceId.
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const invoiceId = (body.invoiceId || body.paymentId || '').trim();
      if (!invoiceId) return Response.json({ error: 'Missing invoice reference' }, { status: 400 });

      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + invoiceId, {
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

      // Ownership: the invoice metadata carries the user_id set at checkout.
      const metaUserId = metadata?.user_id ? String(metadata.user_id) : '';
      if (metaUserId && metaUserId !== String(user.id)) {
        return Response.json({ error: 'Payment does not belong to this account' }, { status: 403 });
      }
    }

    if (!metadata || metadata.type !== 'broker_fee' || !metadata.user_id) {
      return Response.json({ error: 'Invalid payment metadata' }, { status: 400 });
    }

    const targetUserId = String(metadata.user_id);

    // Load the user to check idempotency.
    let targetUser: any = null;
    try {
      targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
    } catch {}

    // Idempotency: already fully approved → nothing to do.
    if (targetUser && targetUser.re_license_status === 'approved') {
      return Response.json({ ok: true, activated: true, already: true });
    }

    // Activate the broker badge.
    await base44.asServiceRole.entities.User.update(targetUserId, {
      re_license_status: 'approved',
      re_license_review_reason: '',
    });

    // Approve any real estate listings this broker had pending review now
    // that they're licensed (mirrors the old admin-approve side effect).
    try {
      await base44.asServiceRole.entities.Item.updateMany(
        { seller_id: targetUserId, category: 'realestate', review_status: 'pending' },
        { $set: { review_status: 'approved', review_reason: '' } }
      );
    } catch (e) {}

    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: targetUserId,
        type: 're_license_activated',
        text: 'تم تفعيل شارة الوسيط العقاري! يمكنك الآن نشر إعلانات عقارية 🎉',
      });
    } catch (e) {}

    return Response.json({ ok: true, activated: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}