import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = (body.username || "").toString().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (raw.length < 3) return Response.json({ error: "invalid" }, { status: 400 });

    // Non-admins can't list users, so query as the service role.
    const matches = await base44.asServiceRole.entities.User.filter({ username: raw }, "-created_date", 5);
    const u = (matches || []).find((x) => x.username === raw) || (matches || [])[0];
    if (!u) return Response.json({ error: "not found" }, { status: 404 });

    return Response.json({
      id: u.id,
      username: u.username || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      full_name: u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" "),
      avatar: u.avatar || "",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}