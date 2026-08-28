import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only: zeros the payment ledger by deleting all Payment records and
// setting a baseline date in AppSetting. After this:
//  - syncMoyasarPayments skips Moyasar payments created before the baseline,
//    so old test payments never come back;
//  - searchPayments filters ALL revenue sources (Payment, BoostRequest,
//    VerificationRequest, SponsorRequest) to records created after the
//    baseline, so the dashboard + payments tab start counting from zero.
// Boost/verification/sponsorship records themselves are NOT deleted — they
// track the actual service (boost activation, verified badge, etc.) and
// must remain for the app to function. Only their revenue contribution is
// excluded via the baseline filter.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const baseline = new Date().toISOString();

    // Delete all Payment records (app support, payment links, broker fees).
    await base44.asServiceRole.entities.Payment.deleteMany({});

    // Upsert the baseline date in AppSetting.
    try {
      const existing = await base44.asServiceRole.entities.AppSetting.filter({ key: 'payment_baseline_date' }, '-created_date', 1);
      if (existing && existing.length) {
        await base44.asServiceRole.entities.AppSetting.update(existing[0].id, { value: baseline });
      } else {
        await base44.asServiceRole.entities.AppSetting.create({ key: 'payment_baseline_date', value: baseline });
      }
    } catch (e) {}

    return Response.json({ ok: true, baseline });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}