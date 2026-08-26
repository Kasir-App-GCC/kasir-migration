import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Creates a Moyasar hosted invoice for the one-time real estate broker
// activation fee. Called by the seller AFTER an admin has reviewed and
// approved their license (re_license_status === "approved_pending_payment").
// The actual badge grant happens in confirmBrokerPayment (webhook + client
// confirm) so the badge is granted server-side even if the popup is closed
// before the client confirm lands — same pattern as verification.

const BROKER_FEE = 49; // SAR

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only users whose license was admin-approved but not yet paid can start.
    if (user.re_license_status !== 'approved_pending_payment') {
      return Response.json({ error: 'Not eligible for broker activation payment' }, { status: 400 });
    }
    // Already fully approved → nothing to pay.
    if (user.re_license_status === 'approved') {
      return Response.json({ error: 'Broker badge already active' }, { status: 409 });
    }

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const amountHalalas = BROKER_FEE * 100;
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');

    const moyasarRes = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description: 'رسوم تفعيل شارة الوسيط العقاري - كاسر',
        callback_url: `${origin}/functions/confirmBrokerPayment`,
        back_url: `${origin}/profile`,
        metadata: {
          type: 'broker_fee',
          user_id: user.id,
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    return Response.json({
      ok: true,
      invoiceId: data.id,
      url: data.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}