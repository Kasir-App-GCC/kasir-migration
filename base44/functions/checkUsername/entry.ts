import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = (body.username || "").toString().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (raw.length < 3) {
      return Response.json({ available: false, reason: "invalid" });
    }

    // Query the User collection as the service role (non-admins can't list users).
    const matches = await base44.asServiceRole.entities.User.filter({ username: raw }, "-created_date", 50);
    const takenByOther = (matches || []).some((u) => u.id !== user.id);
    return Response.json({ available: !takenByOther });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}