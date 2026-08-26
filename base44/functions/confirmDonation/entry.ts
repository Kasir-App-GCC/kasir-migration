import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Verifies a Moyasar donation payment is paid and records it in the Payment
// ledger immediately, so the donor sees instant in-app confirmation. The
// periodic syncMoyasarPayments workflow still reconciles later using
// moyasar_payment_id as the dedup key (create is idempotent on that field).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const paymentId = (body.paymentId || '').trim();
    if (!paymentId) return Response.json({ error: 'Missing payment ID' }, { status: 400 });

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const payRes = await fetch('https://api.moyasar.com/v1/payments/' + paymentId, {
      headers: { Authorization: authHeader },
    });
    const payData = await payRes.json().catch(() => ({}));
    if (!payRes.ok || payData.status !== 'paid') {
      return Response.json({ ok: false, error: 'Payment not completed' });
    }

    // Ownership: metadata user_id must match the calling user.
    const metaUserId = payData.metadata?.user_id ? String(payData.metadata.user_id) : '';
    if (metaUserId && metaUserId !== String(user.id)) {
      return Response.json({ error: 'Payment does not belong to this account' }, { status: 403 });
    }

    const amountSar = Number(payData.amount) / 100;
    try {
      await base44.asServiceRole.entities.Payment.create({
        user_id: user.id,
        user_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || user.full_name || '',
        user_email: user.email,
        amount: amountSar,
        type: 'donation',
        status: 'paid',
        moyasar_payment_id: paymentId,
        description: payData.description || 'دعم لكاسر',
      });
    } catch (e) {}

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}