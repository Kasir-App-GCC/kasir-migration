import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (caller.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId } = body || {};
    if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });
    if (userId === caller.id) return Response.json({ error: "Cannot delete yourself" }, { status: 400 });

    // Clean up the user's data
    try { await base44.asServiceRole.entities.Item.deleteMany({ seller_id: userId }); } catch {}
    try { await base44.asServiceRole.entities.ChatRoom.deleteMany({ $or: [{ seller_id: userId }, { buyer_id: userId }] }); } catch {}
    try { await base44.asServiceRole.entities.Message.deleteMany({ sender_id: userId }); } catch {}

    // Soft-delete the user account
    await base44.asServiceRole.entities.User.update(userId, {
      disabled: true,
      disabled_reason: "admin_deleted",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}