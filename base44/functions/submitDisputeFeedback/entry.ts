import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records the complainant's satisfaction with an admin's dispute resolution.
// Dispute.update RLS is admin-only, so this runs server-side and enforces:
//  - The caller is the dispute's complainant.
//  - Feedback can only be submitted once.
// "satisfied" closes the dispute; "unsatisfied" reopens it (status -> open)
// and notifies admins so they can re-review, carrying the complainant's reply.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const disputeId = String(body.dispute_id || "");
    if (!disputeId) return Response.json({ error: "dispute_id required" }, { status: 400 });
    const feedback = body.feedback === "satisfied" ? "satisfied" : body.feedback === "unsatisfied" ? "unsatisfied" : "";
    if (!feedback) return Response.json({ error: "invalid feedback" }, { status: 400 });
    const reply = String(body.reply || "").trim().slice(0, 2000);

    let dispute;
    try { dispute = await base44.entities.Dispute.get(disputeId); } catch { dispute = null; }
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });
    if (String(dispute.complainant_id) !== String(user.id))
      return Response.json({ error: "Not the complainant" }, { status: 403 });
    if (dispute.complainant_feedback)
      return Response.json({ error: "already_submitted" }, { status: 409 });

    const update = { complainant_feedback: feedback };
    if (feedback === "unsatisfied") {
      update.complainant_reply = reply;
      update.status = "open"; // reopen for admin re-review
    } else {
      update.status = "closed";
    }

    await base44.asServiceRole.entities.Dispute.update(disputeId, update);

    // Alert admins when the complainant is unsatisfied, so they re-review.
    if (feedback === "unsatisfied") {
      try {
        const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, "-created_date", 50);
        if (admins && admins.length) {
          const txt = `Complainant unsatisfied with dispute resolution on "${dispute.item_title || ""}"${reply ? ": " + reply : ""}`;
          await base44.asServiceRole.entities.Notification.bulkCreate(
          admins.map((a) => ({
          user_id: a.id,
          type: "admin_message",
          text: txt,
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
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}