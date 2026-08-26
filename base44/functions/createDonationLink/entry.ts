import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const amountSar = Number(body?.amount);
    if (!amountSar || amountSar < 1) {
      return Response.json({ error: 'Amount must be at least 1 SAR' }, { status: 400 });
    }

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    // Use the origin the request came from so Moyasar redirects back to the
    // domain the user is actually browsing (custom domain or base44 fallback).
    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');

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
        description: 'دعم لكاسر',
        callback_url: `${origin}/about`,
        metadata: { type: 'donation', user_id: user.id },
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}