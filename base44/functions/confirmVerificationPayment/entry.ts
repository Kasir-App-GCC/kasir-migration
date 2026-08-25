import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const paymentId = (body.paymentId || "").trim();
    if (!paymentId) return Response.json({ error: 'Missing payment ID' }, { status: 400 });

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // The redirect from Moyasar invoice checkout may append either a payment ID
    // or an invoice ID. Try the payments API first; if that fails, fall back to
    // the invoices API and look for a paid payment in its payments array.
    let paid = false;
    let resolvedPaymentId = paymentId;
    let metadata: any = null;

    const payRes = await fetch('https://api.moyasar.com/v1/payments/' + paymentId, {
      headers: { 'Authorization': authHeader },
    });
    if (payRes.ok) {
      const payData = await payRes.json();
      if (payData.status === 'paid') {
        paid = true;
        metadata = payData.metadata || null;
      }
    } else {
      const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + paymentId, {
        headers: { 'Authorization': authHeader },
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const paidPayment = (invData.payments || []).find((p) => p.status === 'paid');
        if (paidPayment) {
          paid = true;
          resolvedPaymentId = paidPayment.id;
          metadata = invData.metadata || paidPayment.metadata || null;
        }
      } else {
        const invData = await invRes.json().catch(() => ({}));
        return Response.json({ error: invData?.message || 'Payment lookup failed' }, { status: 400 });
      }
    }

    if (!paid) {
      return Response.json({ ok: false, error: 'Payment not completed' });
    }

    // Ownership + idempotency: the invoice metadata carries the user_id and
    // verification_request_id set at checkout. We verify the payment belongs to
    // the calling user (so a leaked payment ID can't verify someone else's
    // account) and resolve the pending VerificationRequest created at checkout
    // — granting the trusted badge exactly once.
    const metaUserId = metadata?.user_id ? String(metadata.user_id) : "";
    if (metaUserId && metaUserId !== String(user.id)) {
      return Response.json({ error: 'Payment does not belong to this account' }, { status: 403 });
    }
    const requestId = metadata?.verification_request_id ? String(metadata.verification_request_id) : "";

    let request = null;
    if (requestId) {
      try { request = await base44.asServiceRole.entities.VerificationRequest.get(requestId); } catch { request = null; }
    }

    // Idempotency: if the request is already approved, the user is already
    // verified — don't re-grant or create duplicates.
    if (request && request.status === "approved") {
      return Response.json({ ok: true, verified: true, already: true });
    }

    if (request) {
      if (String(request.user_id) !== String(user.id)) {
        return Response.json({ error: 'Verification request ownership mismatch' }, { status: 403 });
      }
      await base44.asServiceRole.entities.VerificationRequest.update(request.id, {
        status: 'approved',
        reviewed_by: 'system',
        payment_receipt_url: 'moyasar:' + resolvedPaymentId,
      });
    } else {
      // Fallback (legacy/edge case): create an approved record from metadata.
      // national_id is no longer stored in Moyasar metadata, so it's blank here.
      await base44.asServiceRole.entities.VerificationRequest.create({
        user_id: user.id,
        user_name: user.name || '',
        user_email: user.email,
        full_name: metadata?.full_name || user.name || '',
        phone: metadata?.phone || '',
        national_id: '',
        status: 'approved',
        reviewed_by: 'system',
        payment_receipt_url: 'moyasar:' + resolvedPaymentId,
      });
    }

    // Grant the trusted badge immediately — no admin review needed.
    await base44.asServiceRole.entities.User.update(user.id, { is_trusted: true });

    // Sync the denormalized seller_trusted flag on all the seller's listings
    // so the "verified only" search filter includes them server-side.
    try {
      await base44.asServiceRole.entities.Item.updateMany(
        { seller_id: user.id },
        { $set: { seller_trusted: true } }
      );
    } catch (e) {}

    try {
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'verification_approved',
        text: 'تم توثيق حسابك بنجاح! 🎉',
      });
    } catch (e) {}

    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}