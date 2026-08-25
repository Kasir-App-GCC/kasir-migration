import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sweepUserData } from '../../shared/sweepUser.ts';

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

    // Clean up ALL of the user's data so nothing dangles after the account is gone.
    await sweepUserData(base44, userId);

    // Hard-delete the user account so it disappears from the admin user list
    try {
      await base44.asServiceRole.entities.User.delete(userId);
    } catch (e) {
      // Fallback: soft-delete if hard delete is blocked by the platform
      await base44.asServiceRole.entities.User.update(userId, {
        disabled: true,
        disabled_reason: "admin_deleted",
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}