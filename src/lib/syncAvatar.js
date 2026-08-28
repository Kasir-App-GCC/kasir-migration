import { base44 } from "@/api/base44Client";

// Keeps the user's profile picture and display name consistent across their
// listings and chats. Call this after a successful updateMe() so existing
// items/chat rooms reflect the new avatar and/or name.
export async function syncProfileToEntities(userId, { avatar, name } = {}) {
  if (!userId) return;
  const updates = {};
  if (avatar !== undefined) updates.seller_avatar = avatar || null;
  if (name !== undefined) updates.seller_name = name || "";
  const buyerUpdates = {};
  if (avatar !== undefined) buyerUpdates.buyer_avatar = avatar || null;
  if (name !== undefined) buyerUpdates.buyer_name = name || "";
  try {
    await Promise.all([
      Object.keys(updates).length
        ? base44.entities.Item.updateMany({ seller_id: userId }, { $set: updates })
        : Promise.resolve(),
      Object.keys(updates).length
        ? base44.entities.ChatRoom.updateMany({ seller_id: userId }, { $set: updates })
        : Promise.resolve(),
      Object.keys(buyerUpdates).length
        ? base44.entities.ChatRoom.updateMany({ buyer_id: userId }, { $set: buyerUpdates })
        : Promise.resolve(),
    ]);
  } catch {}
}

// Backward-compat alias for callers that only sync the avatar.
export async function syncAvatarToEntities(userId, avatar) {
  return syncProfileToEntities(userId, { avatar });
}