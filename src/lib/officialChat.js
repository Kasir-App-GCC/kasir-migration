import { base44 } from "@/api/base44Client";

/**
 * Find or create an official chat between the admin and a target user.
 * @param {object} adminUser - the current admin user object
 * @param {object} targetUser - the user to message
 * @param {string} label - "Management" or "Support"
 * @returns {Promise<string>} chatroom id
 */
export async function findOrCreateOfficialChat(adminUser, targetUser, label) {
  const allRooms = await base44.entities.ChatRoom.list("-updated_date", 200);
  const existing = (allRooms || []).find(
    (r) =>
      r.is_official &&
      r.official_label === label &&
      r.official_admin_id === adminUser.id &&
      ((r.seller_id === adminUser.id && r.buyer_id === targetUser.id) ||
        (r.buyer_id === adminUser.id && r.seller_id === targetUser.id))
  );
  if (existing) return existing.id;

  const targetName = [targetUser.first_name, targetUser.last_name].filter(Boolean).join(" ").trim() || targetUser.username || targetUser.email || "User";

  const room = await base44.entities.ChatRoom.create({
    item_id: "official",
    item_title: "",
    seller_id: adminUser.id,
    seller_name: label,
    seller_avatar: null,
    buyer_id: targetUser.id,
    buyer_name: targetName,
    buyer_avatar: targetUser.avatar || null,
    is_official: true,
    official_label: label,
    official_admin_id: adminUser.id,
    last_message: "",
  });
  return room.id;
}