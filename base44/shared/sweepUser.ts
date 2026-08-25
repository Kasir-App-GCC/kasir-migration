// Deletes (or anonymizes) all data owned by or referencing a user. Shared by
// the admin `deleteUser` function and the self-serve `deleteAccount` function
// so neither leaves orphaned records (offers, ratings, favorites, meetups, …)
// that would dangle and pollute the app after the account is gone.
export async function sweepUserData(base44: any, userId: string) {
  const svc = base44.asServiceRole.entities;
  const or = (a: string, b: string) => ({ $or: [{ [a]: userId }, { [b]: userId }] });

  await tryDel(svc.Item, { seller_id: userId });
  await tryDel(svc.ChatRoom, or("seller_id", "buyer_id"));
  // Messages now carry buyer_id/seller_id for participant-scoped reads; clear
  // both the participant-keyed records and any legacy sender-keyed ones.
  await tryDel(svc.Message, or("buyer_id", "seller_id"));
  await tryDel(svc.Message, { sender_id: userId });
  await tryDel(svc.Offer, or("buyer_id", "seller_id"));
  await tryDel(svc.Rating, or("rated_user_id", "rater_user_id"));
  await tryDel(svc.Favorite, { $or: [{ user_id: userId }, { seller_id: userId }] });
  await tryDel(svc.Notification, { user_id: userId });
  await tryDel(svc.Meetup, or("buyer_id", "seller_id"));
  await tryDel(svc.BoostRequest, { user_id: userId });
  await tryDel(svc.Report, { $or: [{ reported_user_id: userId }, { reporter_user_id: userId }] });
  await tryDel(svc.Dispute, { $or: [{ complainant_id: userId }, { respondent_id: userId }] });
  await tryDel(svc.SavedSearch, { user_id: userId });
  await tryDel(svc.UserFollow, { $or: [{ follower_id: userId }, { followed_id: userId }] });
  await tryDel(svc.UserBlock, { $or: [{ blocker_id: userId }, { blocked_id: userId }] });
  await tryDel(svc.PhoneOtp, { user_id: userId });
  await tryDel(svc.SupportTicket, { user_id: userId });
  await tryDel(svc.VerificationRequest, { user_id: userId });
  await tryDel(svc.WhatsAppContact, { sender_id: userId });
  await tryDel(svc.BuyRequest, { user_id: userId });
}

async function tryDel(entity: any, query: any) {
  try { await entity.deleteMany(query); } catch {}
}