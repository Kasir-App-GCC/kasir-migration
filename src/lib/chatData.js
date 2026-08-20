import { base44 } from "@/api/base44Client";

// Server-side fetch of the current user's chat rooms, messages, and offers.
//
// The old pattern (list the newest 100 rooms / 200 messages / 200 offers
// globally, then filter by the current user client-side) breaks at scale: a
// user's own rooms and messages fall outside the global recency window and
// simply never appear — the same class of bug that showed "0 listings".
//
// This scopes every query to the user's own data:
//   1. Rooms where they are the buyer OR the seller (two filtered queries,
//      merged + de-duped, since a room has two separate owner fields).
//   2. Messages and offers whose chatroom_id is in that set of room ids ($in).
//
// Shared by Chats.jsx, useNotifications.js, and useUnreadChats.js so all three
// stay consistent and none of them re-introduce the global-list pattern.
export async function fetchMyChatData(user, { messageLimit = 500, offerLimit = 500, roomLimit = 200 } = {}) {
  if (!user) return { rooms: [], messages: [], offers: [], roomMap: new Map(), myRoomIds: [] };

  const [buyerRooms, sellerRooms] = await Promise.all([
    base44.entities.ChatRoom.filter({ buyer_id: user.id }, "-updated_date", roomLimit).catch(() => []),
    base44.entities.ChatRoom.filter({ seller_id: user.id }, "-updated_date", roomLimit).catch(() => []),
  ]);

  const seen = new Set();
  const rooms = [...(buyerRooms || []), ...(sellerRooms || [])].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    if (r.buyer_id === user.id && r.hidden_for_buyer) return false;
    if (r.seller_id === user.id && r.hidden_for_seller) return false;
    return true;
  });

  const myRoomIds = rooms.map((r) => r.id);
  const [messages, offers] = await Promise.all([
    myRoomIds.length
      ? base44.entities.Message.filter({ chatroom_id: { $in: myRoomIds } }, "-created_date", messageLimit).catch(() => [])
      : Promise.resolve([]),
    myRoomIds.length
      ? base44.entities.Offer.filter({ chatroom_id: { $in: myRoomIds } }, "-created_date", offerLimit).catch(() => [])
      : Promise.resolve([]),
  ]);

  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  return { rooms, messages, offers, roomMap, myRoomIds };
}