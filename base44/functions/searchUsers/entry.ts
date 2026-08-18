import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || "").trim().toLowerCase().replace(/^@/, "");
    if (query.length < 1) return Response.json({ users: [] });

    const all = await base44.asServiceRole.entities.User.list("-created_date", 5000);
    const matches = (all || [])
      .filter((u) => u.id !== user.id)
      .filter((u) => {
        const uname = (u.username || "").toLowerCase();
        const full = (u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return uname.includes(query) || full.includes(query) || email.includes(query);
      })
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        username: u.username || "",
        full_name: u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" "),
        avatar: u.avatar || "",
      }));

    return Response.json({ users: matches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}