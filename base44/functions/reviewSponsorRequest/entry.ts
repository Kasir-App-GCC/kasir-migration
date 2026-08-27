import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { computeSponsorPrice } from "../../shared/sponsorPricing.ts";

// Admin-only review of a SponsorRequest.
//   action "approve": creates a Moyasar invoice, stores invoice_id + invoice_url
//     on the request, sets status "approved", and notifies the user to pay.
//   action "reject":  sets status "rejected", notifies the user with the reason.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller || caller.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = (body.request_id || "").toString();
    const action = (body.action || "").toString();
    const rejectReason = (body.reject_reason || "").toString().slice(0, 500);

    if (!requestId) return Response.json({ error: "request_id is required" }, { status: 400 });
    if (action !== "approve" && action !== "reject") {
      return Response.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const request = await base44.asServiceRole.entities.SponsorRequest.get(requestId);
    if (!request) return Response.json({ error: "Request not found" }, { status: 404 });
    if (request.status !== "pending") {
      return Response.json({ error: "Request already reviewed" }, { status: 400 });
    }

    const item = await base44.asServiceRole.entities.Item.get(request.item_id).catch(() => null);
    const itemTitle = item?.title || request.item_title || "";
    const itemImage = (item && Array.isArray(item.images) && item.images[0]) || "";

    if (action === "reject") {
      await base44.asServiceRole.entities.SponsorRequest.update(requestId, {
        status: "rejected",
        reviewed_by: caller.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: rejectReason,
      });
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: request.user_id,
          type: "sponsor_rejected",
          item_id: request.item_id,
          item_title: itemTitle,
          item_image: itemImage,
          text: rejectReason
            ? `تم رفض طلب رعاية إعلانك "${itemTitle}". السبب: ${rejectReason}`
            : `تم رفض طلب رعاية إعلانك "${itemTitle}".`,
          reference_id: requestId,
        });
      } catch (e) {}
      return Response.json({ ok: true, action: "rejected" });
    }

    // approve — create the Moyasar invoice the user will pay.
    const secretKey = secrets.get("MOYASAR_SECRET_KEY");
    if (!secretKey) return Response.json({ error: "MOYASAR_SECRET_KEY not set" }, { status: 500 });

    const origin = "https://kasir-ksa.base44.app";
    const amountHalalas = Math.round(Number(request.amount) * 100);
    const authHeader = "Basic " + btoa(secretKey + ":");

    const moyasarRes = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: `رعاية إعلان - كاسر (${request.weeks} أسبوع)`,
        callback_url: `${origin}/functions/confirmSponsorPayment`,
        success_url: `${origin}/profile?pay_sponsor=${requestId}`,
        back_url: `${origin}/profile`,
        metadata: {
          type: "sponsor",
          user_id: request.user_id,
          item_id: request.item_id,
          weeks: String(request.weeks),
          request_id: requestId,
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      }, { status: 502 });
    }

    await base44.asServiceRole.entities.SponsorRequest.update(requestId, {
      status: "approved",
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
      invoice_id: data.id,
      invoice_url: data.url,
    });

    // Notify the user their request was approved and they can now pay.
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: request.user_id,
        type: "sponsor_approved_pending_payment",
        item_id: request.item_id,
        item_title: itemTitle,
        item_image: itemImage,
        text: `تمت الموافقة على رعاية إعلانك "${itemTitle}"! ادفع ${request.amount} ريال لتفعيل الرعاية فوراً.`,
        reference_id: requestId,
      });
    } catch (e) {}

    return Response.json({ ok: true, action: "approved", invoice_url: data.url, invoice_id: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}