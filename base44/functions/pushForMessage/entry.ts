import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { WORKFLOW_SECRET } from "../../shared/workflowSecret.ts";

// Sends a push notification to the OTHER participant in a chat when a new
// Message is created. Called from the MessagePush workflow. Looks up the
// ChatRoom to find the recipient, uses the sender's name as the push title.
// Skips system messages (sender_id === "system" or kind === "system").
// A shared secret is verified so the public function URL can't be abused.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (body?.secret !== WORKFLOW_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const chatroomId = String(body?.chatroom_id || "").trim();
    const senderId = String(body?.sender_id || "").trim();
    const senderName = String(body?.sender_name || "").trim();
    const text = String(body?.text || "").slice(0, 200);
    const kind = String(body?.kind || "text").trim();

    if (!chatroomId || !senderId || !text) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Skip system messages — they don't need a push.
    if (senderId === "system" || kind === "system") {
      return Response.json({ ok: true, skipped: true });
    }

    // Look up the chatroom to find the recipient (the other participant).
    const room = await base44.asServiceRole.entities.ChatRoom.get(chatroomId);
    if (!room) return Response.json({ ok: true, skipped: true });

    const recipientId =
      String(room.seller_id) === String(senderId) ? room.buyer_id : room.seller_id;
    if (!recipientId) return Response.json({ ok: true, skipped: true });

    // Don't push to yourself.
    if (String(recipientId) === String(senderId)) {
      return Response.json({ ok: true, skipped: true });
    }

    const title = senderName || "Kasir";
    const payload = {
      user_id: recipientId,
      title,
      content: text,
      action_url: `/chat/${chatroomId}`,
    };

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