import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only server-side search across the payment ledger (Payment +
// approved BoostRequest + approved VerificationRequest). Moves all the
// heavy fetching/filtering/name-resolution off the client so the admin
// panel stays snappy even with tens of thousands of transactions — the
// client only receives the matching page (e.g. 50 rows) + capped counts.
//
// Also normalizes the display:
//  - donation descriptions are forced to a friendly label so stale
//    "Donation" text from old synced invoices never surfaces;
//  - payer names are resolved server-side via the User table (service role
//    sees all users), so rows no longer fall back to "Unknown" when a name
//    can't be resolved client-side.
const VERIFICATION_FEE = 12;
const DONATION_LABEL = 'دعم لكاسر · Kasir Support';
const VERIFICATION_LABEL = 'رسوم توثيق الحساب · Account verification fee';

function escRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const q = String(body?.q || '').trim();
    const type = String(body?.type || 'all');
    const page = Math.max(1, Number(body?.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(body?.limit) || 50));

    const rx = q ? { $regex: escRegex(q), $options: 'i' } : null;
    const orFor = (fields: string[]) => (rx ? { $or: fields.map((f) => ({ [f]: rx })) } : {});

    const wantPayment = type === 'all' || type === 'donation' || type === 'payment_link';
    const wantBoost = type === 'all' || type === 'boost';
    const wantVer = type === 'all' || type === 'verification';

    const paymentQuery = {
      ...(type === 'donation' ? { type: 'donation' } : type === 'payment_link' ? { type: 'payment_link' } : {}),
      ...orFor(['user_name', 'description', 'moyasar_payment_id', 'moyasar_invoice_id']),
    };
    const boostQuery = {
      status: 'approved',
      is_free: { $ne: true },
      ...orFor(['user_name', 'item_title', 'receipt_url']),
    };
    const verQuery = {
      status: 'approved',
      ...orFor(['user_name', 'full_name']),
    };

    // Page 1 fetches a wider cap so per-type counts + totals reflect a
    // meaningful recent window (mirrors the old client behavior of fetching
    // ~500 of each). Deeper pages fetch just enough to fill the next page.
    const fetchCap = page === 1 ? 501 : Math.min(2000, page * limit + limit);

    const [payments, boosts, verifications] = await Promise.all([
      wantPayment ? base44.asServiceRole.entities.Payment.filter(paymentQuery, '-created_date', fetchCap).catch(() => []) : [],
      wantBoost ? base44.asServiceRole.entities.BoostRequest.filter(boostQuery, '-created_date', fetchCap).catch(() => []) : [],
      wantVer ? base44.asServiceRole.entities.VerificationRequest.filter(verQuery, '-created_date', fetchCap).catch(() => []) : [],
    ]);

    const all: any[] = [];
    for (const p of (payments || [])) {
      const rawDesc = String(p.description || '');
      // Old donation invoices were synced as type "payment_link" with a
      // description of "Donation" (before metadata.type was set). Strip the
      // word and reclassify them as donations so the chip + label are right.
      const isDonationDesc = /donation/i.test(rawDesc) || /تبرع/i.test(rawDesc);
      const rowType = (p.type === 'donation' || (p.type === 'payment_link' && isDonationDesc)) ? 'donation' : (p.type || 'payment_link');
      all.push({
        id: 'pay:' + p.id,
        type: rowType,
        amount: Number(p.amount) || 0,
        user_id: p.user_id || '',
        user_name: p.user_name || '',
        description: rowType === 'donation' ? DONATION_LABEL : rawDesc,
        created_date: p.created_date,
        moyasar_payment_id: p.moyasar_payment_id || '',
        moyasar_invoice_id: p.moyasar_invoice_id || '',
      });
    }
    for (const b of (boosts || [])) {
      const receipt = String(b.receipt_url || '');
      all.push({
        id: 'boost:' + b.id,
        type: 'boost',
        amount: Number(b.amount) || 0,
        user_id: b.user_id || '',
        user_name: b.user_name || '',
        description: b.item_title || '',
        created_date: b.created_date,
        moyasar_payment_id: receipt.startsWith('moyasar:') ? receipt.slice('moyasar:'.length) : '',
        moyasar_invoice_id: '',
      });
    }
    for (const v of (verifications || [])) {
      const receipt = String(v.payment_receipt_url || '');
      all.push({
        id: 'ver:' + v.id,
        type: 'verification',
        amount: VERIFICATION_FEE,
        user_id: v.user_id || '',
        user_name: v.user_name || v.full_name || '',
        description: VERIFICATION_LABEL,
        created_date: v.created_date,
        moyasar_payment_id: receipt.startsWith('moyasar:') ? receipt.slice('moyasar:'.length) : '',
        moyasar_invoice_id: '',
      });
    }

    // Resolve payer names server-side (service role sees all users) so rows
    // don't fall back to "Unknown" when client-side resolution failed.
    const idsToResolve = Array.from(new Set(all.filter((r) => r.user_id && !r.user_name).map((r) => r.user_id)));
    if (idsToResolve.length) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: { $in: idsToResolve } }, '-created_date', 500);
        const nameMap: Record<string, string> = {};
        for (const u of (users || [])) {
          nameMap[u.id] = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.full_name || '';
        }
        for (const r of all) {
          if (r.user_id && !r.user_name && nameMap[r.user_id]) r.user_name = nameMap[r.user_id];
        }
      } catch (e) {}
    }

    all.sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime());

    // Counts + totals from the fetched window (capped).
    const counts: Record<string, number> = { all: all.length, boost: 0, verification: 0, donation: 0, payment_link: 0 };
    const totals = { total: 0, byType: { boost: 0, verification: 0, donation: 0, payment_link: 0 } };
    for (const r of all) {
      counts[r.type] = (counts[r.type] || 0) + 1;
      totals.total += r.amount || 0;
      totals.byType[r.type] = (totals.byType[r.type] || 0) + (r.amount || 0);
    }
    const countsTruncated =
      (payments?.length >= fetchCap) || (boosts?.length >= fetchCap) || (verifications?.length >= fetchCap);

    const start = (page - 1) * limit;
    const pageRows = all.slice(start, start + limit);
    const hasMore = start + limit < all.length || countsTruncated;

    return Response.json({
      ok: true,
      rows: pageRows,
      counts,
      counts_truncated: countsTruncated,
      totals,
      has_more: hasMore,
      page,
      limit,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}