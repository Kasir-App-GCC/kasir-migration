import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { isInternalInvocation } from "../../shared/internalAuth.ts";

// Auto-archives listings that haven't been refreshed (updated) in STALE_DAYS.
// Archived items are excluded from public feeds but remain visible to the
// seller in "My Listings" so they can refresh them back. Called by a scheduled
// workflow — only the platform's internal runner can invoke it.
const STALE_DAYS = 30;

export default async function (req) {
  try {
    if (!(await isInternalInvocation(req))) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.Item.updateMany(
      { status: "available", archived: { $ne: true }, updated_date: { $lt: cutoff } },
      { $set: { archived: true } }
    );

    // REGA compliance: auto-archive Saudi real estate listings whose ad license
    // has expired. REGA requires the ad be removed immediately on expiry.
    const today = new Date().toISOString().slice(0, 10);
    await base44.asServiceRole.entities.Item.updateMany(
      {
        status: "available",
        archived: { $ne: true },
        category: "realestate",
        country: "SA",
        re_ad_license_expiry: { $lt: today },
      },
      { $set: { archived: true } }
    );

    // Auto-expire approved Fal broker licenses whose expiry date has passed.
    // The broker must resubmit their license to regain real estate posting
    // privileges (REGA requires an active Fal license to advertise).
    const expiredBrokers = await base44.asServiceRole.entities.User.filter(
      { re_license_status: "approved", re_license_expiry: { $lt: today } },
      "-created_date",
      500
    );
    if (expiredBrokers && expiredBrokers.length) {
      const expiredIds = expiredBrokers.map((u: any) => u.id);
      await base44.asServiceRole.entities.User.bulkUpdate(
        expiredIds.map((id: string) => ({ id, re_license_status: "expired", re_license_review_reason: "" }))
      );
      // Archive all active Saudi real estate listings from these brokers —
      // an unlicensed broker cannot legally advertise.
      await base44.asServiceRole.entities.Item.updateMany(
        {
          status: "available",
          archived: { $ne: true },
          category: "realestate",
          country: "SA",
          seller_id: { $in: expiredIds },
        },
        { $set: { archived: true } }
      );
    }

    return Response.json({ ok: true, cutoff });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}