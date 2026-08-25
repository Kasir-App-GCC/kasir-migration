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

    // Fetch the payment from Moyasar to confirm it was actually paid.
    const moyasarRes = await fetch('https://api.moyasar.com/v1/payments/' + paymentId, {
      headers: { 'Authorization': authHeader },
    });
    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({ error: data?.message || 'Payment lookup failed' }, { status: 400 });
    }

    if (data.status !== 'paid') {
      return Response.json({ ok: false, status: data.status, error: 'Payment not completed' });
    }

    // Find the pending verification request for this user and auto-approve it.
    const requests = await base44.entities.VerificationRequest.filter(
      { user_id: user.id, status: 'pending' },
      '-created_date',
      5
    );
    if (!requests || requests.length === 0) {
      return Response.json({ error: 'No pending verification request found' }, { status: 404 });
    }

    const verification = requests[0];

    await base44.entities.VerificationRequest.update(verification.id, {
      status: 'approved',
      reviewed_by: 'system',
      payment_receipt_url: 'moyasar:' + paymentId,
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