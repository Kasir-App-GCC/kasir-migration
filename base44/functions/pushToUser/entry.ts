import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { WORKFLOW_SECRET } from "../../shared/workflowSecret.ts";

// Sends a native push notification to a specific user via the service role.
// Called from the NotificationPush workflow on every Notification entity
// creation. A shared secret is verified so the public function URL can't be
// abused by external callers. The push itself is a no-op when no credentialed
// native build exists (web preview / unconfigured), so it never blocks.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (body?.secret !== WORKFLOW_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = String(body?.user_id || "").trim();
    const content = String(body?.content || "").slice(0, 200);
    const title = String(body?.title || "Kasir").slice(0, 100);
    const itemId = body?.item_id ? String(body.item_id) : null;
    const chatroomId = body?.chatroom_id ? String(body.chatroom_id) : null;

    if (!userId || !content) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    let actionUrl = null;
    if (itemId) actionUrl = `/item/${itemId}`;
    else if (chatroomId) actionUrl = `/chat/${chatroomId}`;

    const payload = { user_id: userId, title, content };
    if (actionUrl) payload.action_url = actionUrl;

    try {
      await base44.asServiceRole.integrations.Core.SendPushNotification(payload);
    } catch (e) {
      return Response.json({ ok: false, error: String(e?.message || e) });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}