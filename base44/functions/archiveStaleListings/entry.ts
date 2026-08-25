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
    return Response.json({ ok: true, cutoff });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}