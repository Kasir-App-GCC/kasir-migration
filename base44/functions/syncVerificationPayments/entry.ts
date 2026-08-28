import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Scheduled backup that approves pending verification requests whose Moyasar
// invoice has been paid. The client-side confirmVerificationPayment call
// handles the happy path immediately; this catches any that slipped through
// (popup closed early, network glitch, metadata lag) within ~1 minute.
//
// No auth — runs as the service role from a scheduled workflow. The only input
// is the Moyasar secret key (server-side), and the only effect is approving
// genuinely paid verifications, so there's no abuse surface.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // Only requests that have an invoice id stamped on them (createVerificationPayment
    // sets payment_receipt_url to "moyasar:<invoice_id>" after creating the invoice).
    // Skip "moyasar:pending" and manual-review requests.
    const pending = await base44.asServiceRole.entities.VerificationRequest.filter(
      { status: 'pending' },
      '-created_date',
      50
    );

    let approved = 0;
    for (const vreq of pending) {
      const receipt = String(vreq.payment_receipt_url || '');
      if (!receipt.startsWith('moyasar:') || receipt === 'moyasar:pending') continue;
      const invoiceId = receipt.slice('moyasar:'.length);
      if (!invoiceId) continue;

      try {
        const invRes = await fetch('https://api.moyasar.com/v1/invoices/' + invoiceId, {
          headers: { Authorization: authHeader },
        });
        if (!invRes.ok) continue;
        const invData = await invRes.json();
        const paidPayment = (invData.payments || []).find((p: any) => p.status === 'paid');
        if (!paidPayment) continue;

        // Approve the request.
        await base44.asServiceRole.entities.VerificationRequest.update(vreq.id, {
          status: 'approved',
          reviewed_by: 'system_sync',
          payment_receipt_url: 'moyasar:' + String(paidPayment.id),
        });

        // Mark the user trusted.
        await base44.asServiceRole.entities.User.update(String(vreq.user_id), { is_trusted: true });

        // Sync the denormalized seller_trusted flag.
        try {
          await base44.asServiceRole.entities.Item.updateMany(
            { seller_id: String(vreq.user_id) },
            { $set: { seller_trusted: true } }
          );
        } catch (e) {}

        // Notify the user.
        try {
          await base44.asServiceRole.entities.Notification.create({
            user_id: String(vreq.user_id),
            type: 'verification_approved',
            text: 'تم توثيق حسابك بنجاح! 🎉',
          });
        } catch (e) {}

        approved++;
      } catch (e) {
        // Skip this one — next run will retry.
      }
    }

    return Response.json({ ok: true, checked: pending.length, approved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}