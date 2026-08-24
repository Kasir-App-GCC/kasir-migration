import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns activity + reliability signals for a user's public profile:
//   - last_active: timestamp of their last app session (for "active X ago")
//   - reply_hours: median time between an incoming message and their reply,
//     sampled from their 20 most recently active chats (null if not enough data)
//   - meetups_completed / no_shows: meetup reliability from completed vs no-show
//     outcomes. no_shows counts only THIS user's own no-shows (reported by the
//     counterparty).
// getPublicProfile (used by feed cards) stays cheap; this heavier computation
// runs only on the profile page.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id || "");
    if (!userId) return Response.json({ error: "user_id required" }, { status: 400 });

    const u = await base44.asServiceRole.entities.User.get(userId);
    if (!u) return Response.json({ error: "not found" }, { status: 404 });

    const lastActive = u.last_active || u.updated_date || null;

    // --- Reply time (median gap, bounded to 20 recent chats) ---
    let replyHours = null;
    try {
      const [asSeller, asBuyer] = await Promise.all([
        base44.asServiceRole.entities.ChatRoom.filter({ seller_id: userId }, "-updated_date", 15),
        base44.asServiceRole.entities.ChatRoom.filter({ buyer_id: userId }, "-updated_date", 15),
      ]);
      const rooms = [...(asSeller || []), ...(asBuyer || [])]
        .sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0))
        .slice(0, 20);
      const gaps = [];
      for (const r of rooms) {
        const msgs = await base44.asServiceRole.entities.Message.filter(
          { chatroom_id: r.id },
          "created_date",
          30
        );
        let prevOther = null;
        for (const m of (msgs || [])) {
          const isMe = String(m.sender_id) === String(userId);
          const ts = m.created_date ? new Date(m.created_date).getTime() : null;
          if (!isMe) {
            prevOther = ts;
          } else if (prevOther != null && ts != null) {
            const gapH = (ts - prevOther) / 3600000;
            // Ignore gaps over a week — likely unrelated replies.
            if (gapH >= 0 && gapH < 24 * 7) gaps.push(gapH);
            prevOther = null;
          }
        }
      }
      if (gaps.length >= 3) {
        gaps.sort((a, b) => a - b);
        replyHours = gaps[Math.floor(gaps.length / 2)];
      }
    } catch {}

    // --- Meetup reliability ---
    let meetupsCompleted = 0;
    let noShows = 0;
    try {
      const [asSeller, asBuyer] = await Promise.all([
        base44.asServiceRole.entities.Meetup.filter({ seller_id: userId }, "-created_date", 200),
        base44.asServiceRole.entities.Meetup.filter({ buyer_id: userId }, "-created_date", 200),
      ]);
      for (const m of [...(asSeller || []), ...(asBuyer || [])]) {
        if (m.status === "completed" || m.completed) meetupsCompleted++;
        // This user's own no-show = reported by the counterparty.
        if (m.buyer_id === userId && m.seller_outcome === "buyer_no_show") noShows++;
        if (m.seller_id === userId && m.buyer_outcome === "seller_no_show") noShows++;
      }
    } catch {}

    return Response.json({
      last_active: lastActive,
      reply_hours: replyHours,
      meetups_completed: meetupsCompleted,
      no_shows: noShows,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}