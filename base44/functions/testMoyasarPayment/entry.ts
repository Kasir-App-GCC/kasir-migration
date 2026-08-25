import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Test cards documented by Moyasar for test mode.
const TEST_CARDS = {
  success: { number: '4111111111111111', message: 'Approved' },
  declined: { number: '4000000000000002', message: 'Declined (insufficient funds)' },
  invalid: { number: '4000000000000036', message: 'Declined (invalid card)' },
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const amountSar = Number(body?.amount);
    if (!amountSar || amountSar <= 0) {
      return Response.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    const scenario = (body?.scenario && TEST_CARDS[body.scenario]) ? body.scenario : 'success';
    const card = TEST_CARDS[scenario];

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    // Moyasar amounts are in halalas (1 SAR = 100 halalas).
    const amountHalalas = Math.round(amountSar * 100);
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const moyasarRes = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description: `Moyasar test payment — ${scenario}`,
        callback_url: 'https://kasir-ksa.base44.app',
        source: {
          type: 'creditcard',
          name: 'Test Admin',
          number: card.number,
          cvc: '111',
          month: '03',
          year: '30',
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        ok: false,
        scenario,
        amount: amountSar,
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
        raw: data,
      });
    }

    return Response.json({
      ok: true,
      scenario,
      amount: amountSar,
      paymentId: data.id,
      status: data.status,
      source: data.source,
      expected: card.message,
      raw: data,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}