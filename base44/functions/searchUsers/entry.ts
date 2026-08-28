import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rawQuery = String(body?.query || "").trim().replace(/^@/, "");
    const query = rawQuery.toLowerCase();
    if (query.length < 1) return Response.json({ users: [] });

    // Scan the newest 500 users for partial matches, AND look up the exact
    // username so an older user (beyond the 500 newest) is still found when
    // the buyer types their exact handle.
    const [all, exact] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      rawQuery
        ? base44.asServiceRole.entities.User.filter({ username: rawQuery }, "-created_date", 10)
        : Promise.resolve([]),
    ]);

    const seen = new Set();
    const matches = [...(exact || []), ...(all || [])]
      .filter((u) => u.id !== user.id)
      .filter((u) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        const uname = (u.username || "").toLowerCase();
        const full = (u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        return uname.includes(query) || full.includes(query);
      })
      .slice(0, 8)
      .map((u) => ({
        id: u.id,
        username: u.username || "",
        full_name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.full_name || "",
        avatar: u.avatar || "",
      }));

    return Response.json({ users: matches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}