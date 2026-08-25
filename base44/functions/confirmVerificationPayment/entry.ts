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
      // Not a payment ID — try looking it up as an invoice.
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

    // Create the approved verification request from the data stored in the
    // Moyasar invoice metadata. No pending request was created up-front, so
    // nothing appears in the admin review queue until payment is confirmed.
    const fullName = metadata?.full_name || user.name || '';
    const phone = metadata?.phone || '';
    const nationalId = metadata?.national_id || '';

    await base44.asServiceRole.entities.VerificationRequest.create({
      user_id: user.id,
      user_name: user.name || fullName,
      user_email: user.email,
      full_name: fullName,
      phone: phone,
      national_id: nationalId,
      status: 'approved',
      reviewed_by: 'system',
      payment_receipt_url: 'moyasar:' + resolvedPaymentId,
    });

    // Grant the trusted badge immediately — no admin review needed.
    await base44.asServiceRole.entities.User.update(user.id, { is_trusted: true });

    // Notify the user that they're now verified.
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