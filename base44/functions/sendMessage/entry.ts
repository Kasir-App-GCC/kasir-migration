import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Posts a chat message server-side. Message.create RLS is admin-only, so the
// only way to send a message is through this function, which verifies the
// caller is actually a participant (buyer or seller) of the target chat room —
// preventing injection into other people's conversations. Also updates the
// room's last_message and un-hides it for both parties.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const chatroomId = String(body.chatroom_id || "");
    const text = String(body.text || "").trim();
    if (!chatroomId) return Response.json({ error: "chatroom_id required" }, { status: 400 });
    if (!text) return Response.json({ error: "Empty message" }, { status: 400 });
    if (text.length > 1000) return Response.json({ error: "Message too long" }, { status: 400 });

    let room;
    try { room = await base44.entities.ChatRoom.get(chatroomId); } catch { room = null; }
    if (!room) return Response.json({ error: "Chat not found" }, { status: 404 });
    if (String(room.seller_id) !== String(user.id) && String(room.buyer_id) !== String(user.id))
      return Response.json({ error: "Not a participant" }, { status: 403 });

    const senderName =
      room.is_official && String(room.seller_id) === String(user.id)
        ? (room.official_label || "")
        : String(user.name || "");

    const msg = await base44.asServiceRole.entities.Message.create({
      chatroom_id: chatroomId,
      sender_id: String(user.id),
      sender_name: senderName,
      text,
    });
    try {
      await base44.asServiceRole.entities.ChatRoom.update(chatroomId, {
        last_message: text,
        hidden_for_buyer: false,
        hidden_for_seller: false,
      });
    } catch {}
    return Response.json({ ok: true, message: msg });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}