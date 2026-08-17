import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId = (body.user_id || "").toString();
    if (!userId) return Response.json({ error: "user_id required" }, { status: 400 });

    const u = await base44.asServiceRole.entities.User.get(userId);
    if (!u) return Response.json({ error: "not found" }, { status: 404 });

    return Response.json({
      username: u.username || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      full_name: u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" "),
      avatar: u.avatar || "",
      whatsapp_enabled: !!u.whatsapp_enabled,
      whatsapp_number: u.whatsapp_enabled ? (u.whatsapp_number || "") : "",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}