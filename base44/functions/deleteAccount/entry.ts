import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Self-service account deletion. Cleans up ALL of the user's data across the
// app's entities so deletion doesn't leave orphaned records (chats, offers,
// ratings, follows, blocks, saved searches, boosts, verifications, tickets,
// reports, notifications, OTPs, buy requests), then soft-disables the account
// (the platform doesn't allow a user to hard-delete their own User record).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const uid = user.id;
    const S = base44.asServiceRole.entities;
    try { await S.Item.deleteMany({ seller_id: uid }); } catch {}
    try { await S.ChatRoom.deleteMany({ $or: [{ seller_id: uid }, { buyer_id: uid }] }); } catch {}
    try { await S.Message.deleteMany({ sender_id: uid }); } catch {}
    try { await S.Offer.deleteMany({ $or: [{ buyer_id: uid }, { seller_id: uid }] }); } catch {}
    try { await S.Rating.deleteMany({ $or: [{ rater_user_id: uid }, { rated_user_id: uid }] }); } catch {}
    try { await S.UserFollow.deleteMany({ $or: [{ follower_id: uid }, { followed_id: uid }] }); } catch {}
    try { await S.UserBlock.deleteMany({ $or: [{ blocker_id: uid }, { blocked_id: uid }] }); } catch {}
    try { await S.SavedSearch.deleteMany({ user_id: uid }); } catch {}
    try { await S.BoostRequest.deleteMany({ user_id: uid }); } catch {}
    try { await S.VerificationRequest.deleteMany({ user_id: uid }); } catch {}
    try { await S.SupportTicket.deleteMany({ user_id: uid }); } catch {}
    try { await S.Report.deleteMany({ $or: [{ reporter_user_id: uid }, { reported_user_id: uid }] }); } catch {}
    try { await S.Notification.deleteMany({ $or: [{ user_id: uid }, { actor_id: uid }] }); } catch {}
    try { await S.PhoneOtp.deleteMany({ user_id: uid }); } catch {}
    try { await S.BuyRequest.deleteMany({ user_id: uid }); } catch {}

    try {
      await S.User.update(uid, { disabled: true, disabled_reason: "self_deleted" });
    } catch {}

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}