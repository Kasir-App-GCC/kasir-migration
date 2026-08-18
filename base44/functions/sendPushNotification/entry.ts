import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Sends a native mobile push notification to a single app user.
// Runs server-side via the service role so an end user cannot push to
// arbitrary people directly from the client. Push delivery only works on a
// published native iOS/Android build with push credentials configured; in the
// web preview (or without credentials) the send is a no-op and never blocks
// the calling flow.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id || "").trim();
    const title = String(body?.title || "").slice(0, 100);
    const content = String(body?.content || "").slice(0, 200);
    const actionUrl = body?.action_url ? String(body.action_url).slice(0, 300) : null;
    const actionLabel = body?.action_label ? String(body.action_label).slice(0, 40) : null;

    if (!userId || !title || !content) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Don't push to yourself.
    if (userId === user.id) return Response.json({ ok: true, skipped: true });

    // Authorization: the caller must share an active chatroom (or item
    // transaction) with the target user — i.e. they are buyer/seller in the
    // same room. This prevents pushing arbitrary/phishing notifications to
    // users the caller has no relationship with.
    const rooms = await base44.asServiceRole.entities.ChatRoom.filter({
      $or: [
        { seller_id: user.id, buyer_id: userId },
        { buyer_id: user.id, seller_id: userId },
      ],
    });
    if (!rooms || rooms.length === 0) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    // Restrict action_url to relative in-app routes only (no external/phishing links).
    let safeActionUrl = null;
    if (actionUrl && actionUrl.startsWith("/") && !actionUrl.startsWith("//")) {
      safeActionUrl = actionUrl;
    }

    const payload = { user_id: userId, title, content };
    if (safeActionUrl) payload.action_url = safeActionUrl;
    if (actionLabel) payload.action_label = actionLabel;

    try {
      await base44.asServiceRole.integrations.Core.SendPushNotification(payload);
    } catch (e) {
      // Delivery may fail when no credentialed native build exists yet —
      // never surface this to the user or block the action.
      return Response.json({ ok: false, error: String(e?.message || e) });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}