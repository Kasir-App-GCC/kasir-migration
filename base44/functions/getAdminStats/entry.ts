import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (caller.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    // Load targeted subsets in parallel — only what's needed for counts.
    // At scale, counts cap at 5000 (platform per-request limit); truncated flags indicate this.
    const [users, items, openReports, openTickets, ratings, soldItems] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 5000),
      base44.asServiceRole.entities.Item.list("-created_date", 5000),
      base44.asServiceRole.entities.Report.filter({ resolved: false }, "-created_date", 5000),
      base44.asServiceRole.entities.SupportTicket.filter({ status: "open" }, "-created_date", 5000),
      base44.asServiceRole.entities.Rating.list("-created_date", 5000),
      base44.asServiceRole.entities.Item.filter({ status: "sold" }, "-created_date", 5000),
    ]);

    const revenue = (soldItems || []).reduce((s, i) => s + (i.price || 0), 0);
    const trusted = (users || []).filter((u) => u.is_trusted).length;
    const banned = (users || []).filter((u) => u.is_banned).length;
    const avgRating = ratings?.length
      ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
      : "—";

    return Response.json({
      users: users?.length || 0,
      usersTruncated: (users?.length || 0) >= 5000,
      items: items?.length || 0,
      itemsTruncated: (items?.length || 0) >= 5000,
      sold: soldItems?.length || 0,
      soldTruncated: (soldItems?.length || 0) >= 5000,
      revenue,
      trusted,
      banned,
      reports: openReports?.length || 0,
      tickets: openTickets?.length || 0,
      avgRating,
      ratings: ratings?.length || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message || "Failed" }, { status: 500 });
  }
}