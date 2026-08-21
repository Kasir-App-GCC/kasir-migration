import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Batched version of getPublicProfile: takes an array of user_ids and returns
// a map of { [userId]: { is_trusted, rating_avg, rating_count, ... } } in a
// single call. This replaces the N+1 pattern where every feed card fired its
// own getPublicProfile request (auth + User.get + a 200-row Rating scan each),
// which saturated the phone's connection pool and hung the home feed.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.user_ids) ? body.user_ids.map((x) => String(x)).filter(Boolean) : [];
    if (!ids.length) return Response.json({ results: {} });
    // Bound the request — a feed page has at most ~100 unique sellers.
    const unique = Array.from(new Set(ids)).slice(0, 120);

    // Service role: User is admin-only for client listing, so the feed can't
    // read other sellers directly. One query fetches them all.
    const users = await base44.asServiceRole.entities.User.filter(
      { id: { $in: unique } },
      "-created_date",
      120
    );
    const userMap = new Map((users || []).map((u) => [u.id, u]));

    // Aggregate every seller's ratings in one query instead of one per seller.
    const ratings = await base44.asServiceRole.entities.Rating.filter(
      { rated_user_id: { $in: unique } },
      "-created_date",
      1000
    );
    const ratingByUser = new Map();
    for (const r of ratings || []) {
      const cur = ratingByUser.get(r.rated_user_id) || { sum: 0, count: 0 };
      cur.sum += Number(r.score) || 0;
      cur.count += 1;
      ratingByUser.set(r.rated_user_id, cur);
    }

    const results = {};
    for (const id of unique) {
      const u = userMap.get(id);
      const r = ratingByUser.get(id);
      results[id] = {
        username: u?.username || "",
        first_name: u?.first_name || "",
        last_name: u?.last_name || "",
        full_name: u?.full_name || [u?.first_name, u?.last_name].filter(Boolean).join(" "),
        avatar: u?.avatar || "",
        whatsapp_enabled: !!u?.whatsapp_enabled,
        whatsapp_number: u?.whatsapp_enabled ? (u?.whatsapp_number || "") : "",
        is_trusted: !!u?.is_trusted,
        rating_avg: r ? Math.round((r.sum / r.count) * 10) / 10 : 0,
        rating_count: r ? r.count : 0,
        created_date: u?.created_date || null,
      };
    }
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}