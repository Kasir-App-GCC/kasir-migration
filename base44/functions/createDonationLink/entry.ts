import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

// Creates a Moyasar invoice for an in-app support payment and returns the
// hosted checkout URL. The client redirects the user there; after payment,
// Moyasar redirects back to /about. The payment is recorded as a Payment
// entity by the syncMoyasarPayments workflow from the Moyasar dashboard.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amountSar = Number(body?.amount);
    if (!amountSar || amountSar < 1) {
      return Response.json({ error: "Amount must be at least 1 SAR" }, { status: 400 });
    }

    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });

    const origin = (body?.origin || "https://kasir-ksa.base44.app").replace(/\/$/, "");
    const amountHalalas = Math.round(amountSar * 100);
    const authHeader = "Basic " + btoa(secretKey + ":");

    const moyasarRes = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: "دعم لكاسر - Kasir Support",
        callback_url: `${origin}/functions/syncMoyasarPayments`,
        success_url: `${origin}/about?support=success`,
        back_url: `${origin}/about`,
        metadata: { type: "donation", user_id: String(user.id) },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      }, { status: 502 });
    }

    return Response.json({ ok: true, amount: amountSar, url: data.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}