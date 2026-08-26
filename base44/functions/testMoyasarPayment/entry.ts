import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Generic Moyasar test-payment endpoint for the admin "Payment Test" tab.
// The admin enters real card details (or uses Apple Pay) in the UI; the card
// is tokenized client-side with the publishable key (card data never touches
// our server), and only the token is sent here. We charge it server-side with
// the secret key.
//
//   - charge: { action: "charge", source_type: "token"|"applepay", token, amount, origin }
//     → creates a real Moyasar payment. Returns the true status:
//       "paid" (non-3DS card / successful Apple Pay), "initiated" (3DS card —
//       the client opens source.transaction_url and polls), or "failed".
//   - status: { action: "status", payment_id } → re-fetch a payment (3DS poll).
//
// Using a token source (instead of a raw creditcard source) is what makes a
// non-3DS test card return "paid" immediately — a raw creditcard source always
// goes through 3DS ("initiated"), which is why the old test never showed PAID.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });
    const authHeader = 'Basic ' + btoa(secretKey + ':');
    const action = (body?.action || 'charge').toString();

    if (action === 'status') {
      const paymentId = (body?.payment_id || '').toString().trim();
      if (!paymentId) return Response.json({ error: 'payment_id required' }, { status: 400 });
      const r = await fetch('https://api.moyasar.com/v1/payments/' + paymentId, {
        headers: { Authorization: authHeader },
      });
      const data: any = await r.json();
      if (!r.ok) return Response.json({ error: data?.message || 'Lookup failed' }, { status: 400 });
      return Response.json({
        ok: true,
        status: data.status,
        payment_id: data.id,
        transaction_url: data.source?.transaction_url || '',
        source: data.source,
      });
    }

    // charge
    const amountSar = Number(body?.amount);
    if (!amountSar || amountSar <= 0) {
      return Response.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    const sourceType = body?.source_type === 'applepay' ? 'applepay' : 'token';
    const token = body?.token;
    if (!token) return Response.json({ error: 'token is required' }, { status: 400 });

    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');
    const amountHalalas = Math.round(amountSar * 100);

    const moyasarRes = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description: 'Moyasar admin test payment',
        callback_url: origin,
        source: { type: sourceType, token },
      }),
    });

    const data: any = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        ok: false,
        error: data?.message || data?.errors?.source?.[0] || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    return Response.json({
      ok: true,
      status: data.status,
      payment_id: data.id,
      transaction_url: data.source?.transaction_url || '',
      amount: amountSar,
      source: data.source,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}