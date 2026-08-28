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
    // Optional: attribute this link to a specific user so the synced payment
    // record shows the payer instead of "Guest". The admin picks the user.
    const userId = body?.user_id ? String(body.user_id) : '';

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    // Use the origin the request came from so Moyasar redirects back to the
    // domain the user is actually browsing (custom domain or base44 fallback).
    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');

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
        callback_url: `${origin}/functions/syncMoyasarPayments`,
        // Redirect the admin back to the admin panel after the payer completes
        // the link (mobile popup-blocked → full redirect flow).
        success_url: `${origin}/admin?payment_link=success`,
        back_url: `${origin}/admin`,
        metadata: { type: 'payment_link', user_id: userId },
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