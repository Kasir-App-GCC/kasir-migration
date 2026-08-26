import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Prepares an in-app donation payment: validates the amount and returns it
// with the Moyasar publishable key. The client renders the embedded card form;
// the resulting payment is recorded as a Payment entity by the
// syncMoyasarPayments workflow from the Moyasar dashboard.
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

    const publishableKey = secrets.get('MOYASAR_PUBLISHABLE_KEY');
    if (!publishableKey) return Response.json({ error: 'MOYASAR_PUBLISHABLE_KEY not set' }, { status: 500 });

    return Response.json({ ok: true, amount: amountSar, publishableKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}