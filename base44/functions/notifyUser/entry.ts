import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Single authorized entry point for client-triggered notifications. Closes
// the notification-injection hole: previously any user could create a
// Notification of any type/text to any user_id, which also fired a push to
// the victim via the Notification Push workflow. This function:
//   1. constrains `type` to a known client set (admin-only types need admin),
//   2. forces actor_id/actor_name to the authenticated user (no impersonation),
//   3. verifies the caller is a real party to the referenced chat/item, or —
//      for new_follower — that they actually follow the recipient.
// Backend functions that need a notification still create it directly via the
// service role (bypassing RLS), so they don't go through here.
const CLIENT_TYPES = new Set([
  'offer_received', 'offer_accepted', 'offer_rejected', 'offer_countered',
  'offer_modified', 'sold', 'rate', 'new_follower',
]);
const ADMIN_TYPES = new Set([
  'verification_submitted', 'verification_approved', 'verification_rejected',
  'boost_approved', 'support_resolved', 'offer_reminder', 'saved_search_match',
]);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const recipient = body?.user_id;
    const type = body?.type;
    const text = (body?.text || '').toString().slice(0, 500);
    const itemId = body?.item_id || null;
    const chatroomId = body?.chatroom_id || null;
    if (!recipient) return Response.json({ error: 'user_id is required' }, { status: 400 });
    if (!type) return Response.json({ error: 'type is required' }, { status: 400 });
    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    const isAdmin = user.role === 'admin';
    if (ADMIN_TYPES.has(type) && !isAdmin) return Response.json({ error: 'Forbidden type' }, { status: 403 });
    if (!CLIENT_TYPES.has(type) && !isAdmin) return Response.json({ error: 'Invalid type' }, { status: 400 });

    // Verify the caller is a party to the referenced context.
    let authorized = false;
    if (chatroomId) {
      const chat = await base44.asServiceRole.entities.ChatRoom.get(chatroomId).catch(() => null);
      if (chat && (chat.seller_id === user.id || chat.buyer_id === user.id)) authorized = true;
    } else if (itemId) {
      const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
      if (item && (item.seller_id === user.id || item.sold_to === user.id)) authorized = true;
    } else if (type === 'new_follower') {
      const follows = await base44.asServiceRole.entities.UserFollow.filter(
        { follower_id: user.id, followed_id: recipient }, '-created_date', 1
      ).catch(() => []);
      if (follows && follows.length) authorized = true;
    }
    if (!authorized) return Response.json({ error: 'Not authorized to send this notification' }, { status: 403 });

    await base44.asServiceRole.entities.Notification.create({
      user_id: recipient,
      type,
      text,
      item_id: itemId,
      item_title: body?.item_title || null,
      item_image: body?.item_image || null,
      chatroom_id: chatroomId,
      offer_amount: body?.offer_amount ?? null,
      actor_name: user.name || user.full_name || null,
      actor_id: user.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}