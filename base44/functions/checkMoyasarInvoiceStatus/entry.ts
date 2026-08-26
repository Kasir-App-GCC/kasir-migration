import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Returns the current status of a Moyasar invoice so the client can poll a
// popup payment and auto-close it on success. Any logged-in user may poll
// (invoice ids are unguessable UUIDs and the secret key stays server-side).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const invoiceId = String(body?.invoice_id || '').trim();
    if (!invoiceId) return Response.json({ error: 'invoice_id required' }, { status: 400 });

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    const r = await fetch('https://api.moyasar.com/v1/invoices/' + invoiceId, {
      headers: { Authorization: 'Basic ' + btoa(secretKey + ':') },
    });
    const data: any = await r.json();
    if (!r.ok) return Response.json({ error: data?.message || 'Lookup failed' }, { status: 400 });

    const payments = Array.isArray(data.payments) ? data.payments : [];
    const paid = payments.find((p: any) => p.status === 'paid');

    return Response.json({
      ok: true,
      status: data.status, // initiated | paid | failed | ...
      payment_id: paid?.id || '',
      amount: (Number(data.amount) || 0) / 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}