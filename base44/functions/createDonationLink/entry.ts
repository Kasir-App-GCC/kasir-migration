import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createMoyasarInvoice } from '../../shared/moyasarInvoice.ts';

// Creates a Moyasar invoice for an in-app donation and returns the hosted
// checkout URL. The client redirects the user there; after payment, Moyasar
// redirects back to /about. The donation is recorded as a Payment entity by
// the syncMoyasarPayments workflow from the Moyasar dashboard.
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

    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');
    const { url } = await createMoyasarInvoice({
      amountSar,
      description: 'دعم لكاسر - Kasir Donation',
      callbackUrl: `${origin}/about`,
      metadata: { type: 'donation', user_id: String(user.id) },
    });

    return Response.json({ ok: true, amount: amountSar, url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}