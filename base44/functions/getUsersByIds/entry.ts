import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (caller.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { ids } = body || {};
    if (!Array.isArray(ids) || !ids.length) return Response.json({ users: {} });

    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const users = {};
    await Promise.all(uniqueIds.map(async (id) => {
      try {
        const u = await base44.asServiceRole.entities.User.get(id);
        if (u) {
          users[id] = {
            id: u.id,
            username: u.username || "",
            email: u.email || "",
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            avatar: u.avatar || "",
            is_trusted: !!u.is_trusted,
            is_banned: !!u.is_banned,
          };
        }
      } catch {}
    }));

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message || "Failed" }, { status: 500 });
  }
}