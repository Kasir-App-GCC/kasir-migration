import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Files a report server-side. Report.create RLS is admin-only, so reports can
// only be created here, which enforces:
//  - The caller can't report themselves.
//  - Rate limit: max 5 reports per user per hour, and max 3 against the same
//    target per 24h (prevents report-spam harassment).

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const reportedId = String(body.reported_user_id || "");
    if (!reportedId) return Response.json({ error: "reported_user_id required" }, { status: 400 });
    if (String(reportedId) === String(user.id)) return Response.json({ error: "Can't report yourself" }, { status: 400 });
    const reason = String(body.reason || "").trim();
    if (!reason) return Response.json({ error: "Reason required" }, { status: 400 });
    const details = String(body.details || "").trim().slice(0, 2000);

    const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    let recent1h = [];
    try {
      recent1h = await base44.entities.Report.filter(
        { reporter_user_id: user.id, created_date: { $gte: since1h } },
        "-created_date",
        10
      );
    } catch {}
    if (recent1h && recent1h.length >= 5) return Response.json({ error: "rate_limit" }, { status: 429 });

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let recentTarget = [];
    try {
      recentTarget = await base44.entities.Report.filter(
        { reporter_user_id: user.id, reported_user_id: reportedId, created_date: { $gte: since24h } },
        "-created_date",
        5
      );
    } catch {}
    if (recentTarget && recentTarget.length >= 3) return Response.json({ error: "already_reported" }, { status: 429 });

    const created = await base44.asServiceRole.entities.Report.create({
      reported_user_id: reportedId,
      reported_user_name: String(body.reported_user_name || ""),
      reporter_user_id: String(user.id),
      reason,
      details,
      item_id: body.item_id ? String(body.item_id) : null,
    });
    return Response.json({ ok: true, report: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}