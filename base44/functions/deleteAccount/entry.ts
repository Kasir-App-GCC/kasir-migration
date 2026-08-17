import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Delete the user's listings
    try {
      await base44.asServiceRole.entities.Item.deleteMany({ seller_id: user.id });
    } catch {}

    // Disable the account (effectively a soft delete)
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        disabled: true,
        disabled_reason: "self_deleted",
      });
    } catch {}

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}