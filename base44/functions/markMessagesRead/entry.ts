import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Marks chat messages as delivered/read for the recipient. Validates the caller
// is a participant of the chatroom and only updates messages sent TO them (not
// their own). Sets delivered_at and/or read_at via the service role (Message
// update RLS only allows the sender), never overwriting an earlier timestamp.
// read_at implies delivered — if delivered_at is missing it's set together.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const chatroomId = String(body.chatroom_id || "");
    const messageIds = Array.isArray(body.message_ids) ? body.message_ids.map(String).filter(Boolean) : [];
    const field = body.field === "read_at" ? "read_at" : "delivered_at";
    if (!chatroomId || !messageIds.length) return Response.json({ ok: true, updated: 0 });

    // Verify the caller is a participant of the chatroom.
    const room = await base44.entities.ChatRoom.get(chatroomId).catch(() => null);
    if (!room) return Response.json({ error: "Not found" }, { status: 404 });
    const isParticipant =
      String(room.buyer_id) === String(user.id) ||
      String(room.seller_id) === String(user.id) ||
      user.role === "admin";
    if (!isParticipant) return Response.json({ error: "Not allowed" }, { status: 403 });

    const messages = await base44.asServiceRole.entities.Message.filter(
      { id: { $in: messageIds }, chatroom_id: chatroomId },
      "-created_date",
      messageIds.length
    );
    const now = new Date().toISOString();
    const updates: { id: string; delivered_at?: string; read_at?: string }[] = [];
    for (const m of (messages || [])) {
      if (String(m.sender_id) === String(user.id) || String(m.sender_id) === "system") continue;
      if (field === "read_at") {
        if (m.read_at) continue;
        updates.push({ id: m.id, delivered_at: m.delivered_at || now, read_at: now });
      } else {
        if (m.delivered_at) continue;
        updates.push({ id: m.id, delivered_at: now });
      }
    }
    if (updates.length) await base44.asServiceRole.entities.Message.bulkUpdate(updates);
    return Response.json({ ok: true, updated: updates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}