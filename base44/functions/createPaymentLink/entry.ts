import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

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
    const description = String(body?.description || '').slice(0, 200) || 'Payment';

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    // Moyasar amounts are in halalas (1 SAR = 100 halalas).
    const amountHalalas = Math.round(amountSar * 100);
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const moyasarRes = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description,
        callback_url: 'https://kasir-ksa.base44.app',
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
        raw: data,
      });
    }

    return Response.json({
      ok: true,
      invoiceId: data.id,
      url: data.url,
      status: data.status,
      amount: amountSar,
      description,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}