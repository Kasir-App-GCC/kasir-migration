import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { sweepUserData } from "../../shared/sweepUser.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Delete ALL of the user's data so nothing dangles after the account is gone.
    await sweepUserData(base44, String(user.id));

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