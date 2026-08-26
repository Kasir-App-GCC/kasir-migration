import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Admin-only: pulls recent paid Moyasar payments and upserts Payment ledger
// records for donations and admin payment links. Verification payments are
// skipped here because they are already tracked in VerificationRequest (with
// the fixed fee + user), so we avoid duplicating them. Boosts are tracked in
// BoostRequest and merged into the admin ledger client-side.
//
// IMPORTANT: Moyasar stores our metadata on the INVOICE (we set it when
// creating the invoice), NOT on the payment that the hosted checkout later
// creates. So reading payment.metadata alone returns nothing and every
// redirect payment shows as "Guest". We therefore fetch recent paid invoices
// first to build an invoice_id → metadata map, then join it onto each paid
// payment by invoice_id. Only the user_id (never names/national IDs) is sent
// to Moyasar; the payer's display name is resolved from our User table.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // 1) Build an invoice_id → metadata map from recent paid invoices.
    //    Moyasar keeps our metadata here (donations, admin payment links).
    const invoiceMeta: Record<string, any> = {};
    let invoicesScanned = 0;
    for (let page = 1; page <= 4; page++) {
      const r = await fetch(`https://api.moyasar.com/v1/invoices?page=${page}`, {
        headers: { Authorization: authHeader },
      });
      if (!r.ok) break;
      const d: any = await r.json();
      const list: any[] = Array.isArray(d) ? d : (d.invoices || d.data || []);
      if (!list.length) break;
      invoicesScanned += list.length;
      for (const inv of list) {
        if (String(inv.status || '') !== 'paid') continue;
        invoiceMeta[String(inv.id)] = inv.metadata || {};
      }
      const totalPages = Number(d?.meta?.total_pages) || 1;
      if (page >= totalPages) break;
    }

    // 2) Scan a few pages of recent paid payments (Moyasar lists newest first).
    const MAX_PAGES = 4;
    let scanned = 0;
    const userIds = new Set<string>();
    const candidates: any[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(`https://api.moyasar.com/v1/payments?status=paid&page=${page}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) break;
      const data: any = await res.json();
      const list: any[] = Array.isArray(data) ? data : (data.payments || data.invoices || data.data || []);
      if (!list.length) break;
      scanned += list.length;
      for (const p of list) {
        // Metadata lives on the invoice — join by invoice_id. Fall back to the
        // payment's own metadata for directly-created payments (e.g. test charges).
        const meta = (p.invoice_id && invoiceMeta[String(p.invoice_id)]) || p.metadata || {};
        const type = String(meta.type || '');
        // Verification is tracked in VerificationRequest — don't duplicate.
        if (type === 'verification') continue;
        const userId = meta.user_id ? String(meta.user_id) : '';
        candidates.push({
          moyasar_payment_id: String(p.id || ''),
          moyasar_invoice_id: String(p.invoice_id || ''),
          amount: (Number(p.amount) || 0) / 100,
          type: type || 'payment_link',
          user_id: userId,
          reference_id: meta.verification_request_id ? String(meta.verification_request_id) : '',
          description: String(p.description || ''),
        });
        if (userId) userIds.add(userId);
      }
      const totalPages = Number(data?.meta?.total_pages) || 1;
      if (page >= totalPages) break;
    }

    // Resolve payer display names in one pass (no PII was sent to Moyasar).
    const nameMap: Record<string, string> = {};
    if (userIds.size) {
      try {
        const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
        for (const u of (users || [])) {
          nameMap[u.id] = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.full_name || u.email || '';
        }
      } catch (e) {}
    }

    // Upsert by moyasar_payment_id (idempotent — re-running sync never doubles).
    let created = 0;
    for (const c of candidates) {
      if (!c.moyasar_payment_id) continue;
      try {
        const existing = await base44.asServiceRole.entities.Payment.filter(
          { moyasar_payment_id: c.moyasar_payment_id },
          '-created_date',
          1
        );
        if (existing && existing.length) {
          // Backfill user attribution for records created before the invoice-join fix.
          if (c.user_id && !existing[0].user_id) {
            await base44.asServiceRole.entities.Payment.update(existing[0].id, {
              user_id: c.user_id,
              user_name: nameMap[c.user_id] || existing[0].user_name || '',
            });
          }
          continue;
        }
        await base44.asServiceRole.entities.Payment.create({
          user_id: c.user_id,
          user_name: c.user_id ? (nameMap[c.user_id] || '') : '',
          user_email: '',
          amount: c.amount,
          type: c.type,
          status: 'paid',
          moyasar_invoice_id: c.moyasar_invoice_id,
          moyasar_payment_id: c.moyasar_payment_id,
          reference_id: c.reference_id,
          description: c.description,
        });
        created++;
      } catch (e) {}
    }

    return Response.json({ ok: true, scanned, invoices_scanned: invoicesScanned, candidates: candidates.length, new: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}