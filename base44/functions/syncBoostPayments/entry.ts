import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { activateBoost } from "../../shared/activateBoost.ts";

// Admin-only reconciliation: scans recent PAID Moyasar payments for boost
// invoices and activates any BoostRequest that's still pending — independent
// of the webhook/redirect, so boosts paid in environments where the
// callback_url can't reach (e.g. the preview builder) still go live.
// Idempotent: re-running never extends an already-active boost (activateBoost
// short-circuits on an approved status). Trigger manually from the admin
// payments panel or on a schedule.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });
    const authHeader = "Basic " + btoa(secretKey + ":");

    const MAX_PAGES = 6;
    let scanned = 0;
    let boostFound = 0;
    let activated = 0;
    let already = 0;

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
        const meta = p.metadata || {};
        if (String(meta.type || "") !== "boost") continue;
        boostFound++;
        try {
          const result = await activateBoost(base44, {
            requestId: meta.boost_request_id ? String(meta.boost_request_id) : "",
            itemId: meta.item_id ? String(meta.item_id) : "",
            hours: Number(meta.hours) || 0,
            userId: meta.user_id ? String(meta.user_id) : "",
            paymentId: String(p.id || ""),
            invoiceId: String(p.invoice_id || ""),
          });
          if (result.activated) activated++;
          else if (result.already) already++;
        } catch (e) {}
      }
      const totalPages = Number(data?.meta?.total_pages) || 1;
      if (page >= totalPages) break;
    }

    return Response.json({ ok: true, scanned, boostFound, activated, already });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}