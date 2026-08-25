import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_FIELDS = ["is_trusted", "is_banned", "banned_reason", "role", "username", "phone", "country_code", "avatar", "whatsapp_number", "whatsapp_verified"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (caller.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, ...fields } = body || {};
    if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });

    const update = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) update[key] = fields[key];
    }
    if (Object.keys(update).length === 0) {
      return Response.json({ error: "No updatable fields provided" }, { status: 400 });
    }
    if ("role" in update && !["admin", "user"].includes(update.role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.User.update(userId, update);

    // Keep the denormalized seller_trusted flag on the seller's listings in
    // sync so the "verified only" search filter works server-side without
    // joining the User collection.
    if ("is_trusted" in update) {
      try {
        await base44.asServiceRole.entities.Item.updateMany(
          { seller_id: userId },
          { $set: { seller_trusted: !!update.is_trusted } }
        );
      } catch {}
    }
    return Response.json({ success: true, user: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}