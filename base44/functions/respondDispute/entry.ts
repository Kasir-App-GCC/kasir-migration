import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Lets the respondent (the party the dispute was opened against) post their
// side of the story. Dispute.update RLS is admin-only, so this runs server-side
// and enforces:
//  - The caller is the dispute's respondent.
//  - A response can only be submitted once.
// Notifies admins so they see both sides during review.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const disputeId = String(body.dispute_id || "");
    if (!disputeId) return Response.json({ error: "dispute_id required" }, { status: 400 });
    const reply = String(body.reply || "").trim().slice(0, 2000);
    if (!reply) return Response.json({ error: "Reply is required" }, { status: 400 });

    let dispute;
    try { dispute = await base44.entities.Dispute.get(disputeId); } catch { dispute = null; }
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });
    if (String(dispute.respondent_id) !== String(user.id))
      return Response.json({ error: "Only the respondent can reply" }, { status: 403 });
    if (dispute.respondent_reply)
      return Response.json({ error: "already_submitted" }, { status: 409 });

    await base44.asServiceRole.entities.Dispute.update(disputeId, {
      respondent_reply: reply,
      respondent_reply_date: new Date().toISOString(),
    });

    // Alert admins so they have both sides before deciding.
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, "-created_date", 50);
      if (admins && admins.length) {
        await base44.asServiceRole.entities.Notification.bulkCreate(
          admins.map((a) => ({
            user_id: a.id,
            type: "admin_message",
            text: `Respondent replied on dispute "${dispute.item_title || ""}": ${reply.slice(0, 200)}`,
            item_id: dispute.item_id || null,
            item_title: dispute.item_title || "",
            chatroom_id: dispute.chatroom_id || null,
            dispute_id: disputeId,
            actor_name: String(user.name || ""),
            read: false,
          }))
        );
      }
    } catch {}

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}