import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { computeSponsorPrice, SPONSOR_MIN_WEEKS, SPONSOR_MAX_WEEKS } from "../../shared/sponsorPricing.ts";

// Creates a Moyasar invoice for a self-service sponsorship and returns the
// hosted checkout URL. The invoice metadata carries the item id, weeks, and
// user id so confirmSponsorPayment can activate the sponsorship on payment
// (webhook + client confirm — both idempotent). No DB record is needed; the
// invoice itself is the source of truth.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const itemId = (body.item_id || "").toString();
    const weeks = Math.floor(Number(body.weeks) || 0);

    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });
    if (weeks < SPONSOR_MIN_WEEKS || weeks > SPONSOR_MAX_WEEKS) {
      return Response.json({ error: "Invalid duration" }, { status: 400 });
    }

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id && item.created_by_id !== user.id) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const amount = computeSponsorPrice(weeks);

    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });

    const origin = (body?.origin || "https://kasir-ksa.base44.app").replace(/\/$/, "");
    const amountHalalas = Math.round(amount * 100);
    const authHeader = "Basic " + btoa(secretKey + ":");

    const moyasarRes = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: `رعاية إعلان - كاسر (${weeks} أسبوع)`,
        callback_url: `${origin}/functions/confirmSponsorPayment`,
        success_url: `${origin}/item/${item.id}?sponsor_payment=1`,
        back_url: `${origin}/profile`,
        metadata: {
          type: "sponsor",
          user_id: user.id,
          item_id: item.id,
          weeks: String(weeks),
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    return Response.json({ ok: true, amount, url: data.url, invoiceId: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}