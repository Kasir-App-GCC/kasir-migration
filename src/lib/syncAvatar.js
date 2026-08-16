import { base44 } from "@/api/base44Client";

// Keeps the user's profile picture consistent across their listings and chats.
// Call this after a successful updateMe() so existing items/chat rooms reflect the new avatar.
export async function syncAvatarToEntities(userId, avatar) {
  if (!userId) return;
  try {
    await Promise.all([
      base44.entities.Item.updateMany({ seller_id: userId }, { $set: { seller_avatar: avatar || null } }),
      base44.entities.ChatRoom.updateMany({ seller_id: userId }, { $set: { seller_avatar: avatar || null } }),
      base44.entities.ChatRoom.updateMany({ buyer_id: userId }, { $set: { buyer_avatar: avatar || null } }),
    ]);
  } catch {}
}