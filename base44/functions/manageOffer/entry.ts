import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Server-side state machine for offers. All status transitions (and the
// initial offer creation) are validated here and written with the service
// role, so clients cannot tamper with status/amount/party fields directly
// (Offer RLS create/update is admin-only). Rules enforced:
//  - create: the caller must be the initiator (buyer for buyer_offer, seller
//    for seller_counter); amount > 0; for a buyer offer the item must be
//    available and the seller id must match the listing owner. Status is forced
//    to "pending".
//  - accept/reject/not_match/counter: only the recipient (non-initiator) of a
//    PENDING offer can act. Accept supersedes any previously accepted offer in
//    the same chat (set to countered).
//  - modify: only the initiator of a PENDING offer can change its amount.
//  - request_modification: either party on an ACCEPTED/COMPLETED offer can
//    create a fresh pending offer at a new amount.
//  - confirm_receipt: only the buyer of an ACCEPTED offer; marks the item sold.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const offers = base44.asServiceRole.entities.Offer;

    const getOffer = async (id) => {
      try { return await base44.entities.Offer.get(id); } catch { return null; }
    };

    // Cap offer amounts to a sane maximum to prevent absurd values cluttering
    // the offer feed (1 billion SAR is well beyond any plausible GCC listing).
    const MAX_OFFER_AMOUNT = 1_000_000_000;

    // Create a notification to the other party via the service role. Bilingual
    // text so both Arabic and English users see a readable message. All
    // offer-related notifications are created here (server-side) so the
    // Notification entity's admin-only create RLS doesn't block them.
    const notify = (targetId, type, text, offer) => {
      if (!targetId) return;
      base44.asServiceRole.entities.Notification.create({
        user_id: targetId,
        type,
        text,
        item_id: offer?.item_id || null,
        item_title: offer?.item_title || "",
        item_image: null,
        chatroom_id: offer?.chatroom_id || null,
        offer_amount: offer?.amount || null,
      }).catch(() => {});
    };

    // ---- CREATE (initial buyer offer, or seller counter on a Buy Request) ----
    if (action === "create") {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
      if (amount > MAX_OFFER_AMOUNT) return Response.json({ error: "Amount too large" }, { status: 400 });
      const direction = body.direction === "seller_counter" ? "seller_counter" : "buyer_offer";
      const buyerId = String(body.buyer_id || "");
      const sellerId = String(body.seller_id || "");
      if (!buyerId || !sellerId) return Response.json({ error: "Missing parties" }, { status: 400 });
      const initiator = direction === "buyer_offer" ? buyerId : sellerId;
      if (String(user.id) !== String(initiator)) return Response.json({ error: "Not allowed" }, { status: 403 });
      if (direction === "buyer_offer") {
        let item;
        try { item = await base44.entities.Item.get(String(body.item_id)); } catch { item = null; }
        if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
        if (item.status === "sold") return Response.json({ error: "Item sold" }, { status: 400 });
        if (String(item.seller_id) !== String(sellerId)) return Response.json({ error: "Seller mismatch" }, { status: 400 });
        // Prevent duplicate active offers: a buyer can only have one pending OR
        // accepted offer per item per chatroom at a time. Rejected/countered
        // offers don't block a new one. This stops the "send multiple offers"
        // bug where a buyer could spam new offers while one was still active.
        const dupeChatroomId = String(body.chatroom_id || "");
        if (dupeChatroomId) {
          const existing = await base44.entities.Offer.filter({
            chatroom_id: dupeChatroomId,
            item_id: String(body.item_id),
            buyer_id: buyerId,
            status: { $in: ["pending", "accepted"] },
          }, "-created_date", 10);
          if (existing && existing.length > 0) {
            return Response.json({ error: "You already have an active offer for this item" }, { status: 409 });
          }
        }
      }
      // Prevent injecting an offer into someone else's chatroom: when a
      // chatroom is provided, the offer's buyer/seller must match the room's.
      if (body.chatroom_id) {
        let room;
        try { room = await base44.entities.ChatRoom.get(String(body.chatroom_id)); } catch { room = null; }
        if (room && (String(room.buyer_id) !== String(buyerId) || String(room.seller_id) !== String(sellerId))) {
          return Response.json({ error: "Chat participants mismatch" }, { status: 400 });
        }
      }
      const created = await offers.create({
        chatroom_id: String(body.chatroom_id || ""),
        item_id: String(body.item_id || ""),
        item_title: String(body.item_title || ""),
        buyer_id: buyerId,
        buyer_name: String(body.buyer_name || ""),
        seller_id: sellerId,
        seller_name: String(body.seller_name || ""),
        amount,
        status: "pending",
        direction,
        image: body.image || null,
      });
      if (body.message && String(body.message).trim()) {
        const text = String(body.message).trim().slice(0, 1000);
        try {
          await base44.asServiceRole.entities.Message.create({
            chatroom_id: String(body.chatroom_id || ""),
            buyer_id: buyerId,
            seller_id: sellerId,
            sender_id: String(user.id),
            sender_name: String(user.name || ""),
            text,
          });
        } catch {}
      }
      // Notify the recipient of the new offer.
      if (direction === "buyer_offer") {
        notify(sellerId, "offer_received", `عرض جديد على "${created.item_title || ""}" · New offer on "${created.item_title || ""}"`, created);
      } else {
        notify(buyerId, "offer_countered", `عارضة من البائع · Seller counter offer`, created);
      }
      return Response.json({ ok: true, offer: created });
    }

    // ---- Transitions on an existing offer ----
    const offerId = String(body.offer_id || "");
    if (!offerId) return Response.json({ error: "offer_id required" }, { status: 400 });
    const offer = await getOffer(offerId);
    if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });
    if (String(offer.buyer_id) !== String(user.id) && String(offer.seller_id) !== String(user.id))
      return Response.json({ error: "Not a party" }, { status: 403 });
    const initiator = offer.direction === "buyer_offer" ? offer.buyer_id : offer.seller_id;
    const isInitiator = String(initiator) === String(user.id);
    const isRecipient = !isInitiator;

    if (action === "accept") {
      if (!isRecipient) return Response.json({ error: "Only the recipient can accept" }, { status: 403 });
      if (offer.status !== "pending") return Response.json({ error: "Offer not pending" }, { status: 400 });
      const prevAccepted = await base44.entities.Offer.filter({ chatroom_id: offer.chatroom_id, status: "accepted" }, "-created_date", 50);
      const isMod = (prevAccepted || []).some((o) => o.id !== offer.id);
      if (isMod) {
        for (const o of (prevAccepted || [])) {
          if (o.id !== offer.id) { try { await offers.update(o.id, { status: "countered" }); } catch {} }
        }
      }
      const updated = await offers.update(offerId, { status: "accepted" });
      // Notify the initiator that their offer was accepted.
      const acceptTarget = String(initiator) === String(offer.buyer_id) ? offer.buyer_id : offer.seller_id;
      notify(acceptTarget, "offer_accepted", `تم قبول عرضك · Your offer was accepted`, updated);
      return Response.json({ ok: true, offer: updated, is_mod_acceptance: !!isMod });
    }

    if (action === "reject") {
      if (!isRecipient) return Response.json({ error: "Only the recipient can reject" }, { status: 403 });
      if (offer.status !== "pending") return Response.json({ error: "Offer not pending" }, { status: 400 });
      const updated = await offers.update(offerId, { status: "rejected" });
      notify(initiator, "offer_rejected", `تم رفض عرضك · Your offer was rejected`, updated);
      return Response.json({ ok: true, offer: updated });
    }

    if (action === "not_match") {
      if (!isRecipient) return Response.json({ error: "Only the recipient can reject" }, { status: 403 });
      if (offer.status !== "pending") return Response.json({ error: "Offer not pending" }, { status: 400 });
      const updated = await offers.update(offerId, { status: "not_match" });
      notify(initiator, "offer_rejected", `ليس ما أبحث عنه · Not what I'm looking for`, updated);
      return Response.json({ ok: true, offer: updated });
    }

    if (action === "counter") {
      if (!isRecipient) return Response.json({ error: "Only the recipient can counter" }, { status: 403 });
      if (offer.status !== "pending") return Response.json({ error: "Offer not pending" }, { status: 400 });
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
      if (amount > MAX_OFFER_AMOUNT) return Response.json({ error: "Amount too large" }, { status: 400 });
      await offers.update(offerId, { status: "countered" });
      const newDirection = offer.direction === "buyer_offer" ? "seller_counter" : "buyer_offer";
      const created = await offers.create({
        chatroom_id: offer.chatroom_id,
        item_id: offer.item_id,
        item_title: offer.item_title,
        buyer_id: offer.buyer_id,
        buyer_name: offer.buyer_name,
        seller_id: offer.seller_id,
        seller_name: offer.seller_name,
        amount,
        status: "pending",
        direction: newDirection,
        previous_offer_id: offerId,
      });
      notify(initiator, "offer_countered", `تمت معارضة عرضك · Your offer was countered`, created);
      return Response.json({ ok: true, created });
    }

    if (action === "modify") {
      if (!isInitiator) return Response.json({ error: "Only the initiator can modify" }, { status: 403 });
      if (offer.status !== "pending") return Response.json({ error: "Offer not pending" }, { status: 400 });
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
      if (amount > MAX_OFFER_AMOUNT) return Response.json({ error: "Amount too large" }, { status: 400 });
      const updated = await offers.update(offerId, { amount });
      const modTarget = String(initiator) === String(offer.buyer_id) ? offer.seller_id : offer.buyer_id;
      notify(modTarget, "offer_modified", `تم تعديل العرض · Offer updated`, updated);
      return Response.json({ ok: true, offer: updated });
    }

    if (action === "request_modification") {
      if (offer.status !== "accepted" && offer.status !== "completed")
        return Response.json({ error: "Offer not accepted" }, { status: 400 });
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
      if (amount > MAX_OFFER_AMOUNT) return Response.json({ error: "Amount too large" }, { status: 400 });
      const isSeller = String(offer.seller_id) === String(user.id);
      const newDirection = isSeller ? "seller_counter" : "buyer_offer";
      const created = await offers.create({
        chatroom_id: offer.chatroom_id,
        item_id: offer.item_id,
        item_title: offer.item_title,
        buyer_id: offer.buyer_id,
        buyer_name: offer.buyer_name,
        seller_id: offer.seller_id,
        seller_name: offer.seller_name,
        amount,
        status: "pending",
        direction: newDirection,
        previous_offer_id: offerId,
      });
      const modTarget = String(user.id) === String(offer.buyer_id) ? offer.seller_id : offer.buyer_id;
      notify(modTarget, "offer_modified", `طلب تعديل العرض المقبول · Modification requested on accepted offer`, created);
      return Response.json({ ok: true, created });
    }

    if (action === "confirm_receipt") {
      if (String(offer.buyer_id) !== String(user.id))
        return Response.json({ error: "Only the buyer can confirm receipt" }, { status: 403 });
      if (offer.status !== "accepted")
        return Response.json({ error: "Offer not accepted" }, { status: 400 });
      const updated = await offers.update(offerId, { status: "completed", received_confirmed: true });
      // Notify the seller that the buyer confirmed receipt — they can now
      // mark the item as sold themselves (no auto-sold).
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: offer.seller_id,
          type: "sold",
          text: `أكّد المشتري استلام "${offer.item_title || ""}" — يمكنك الآن تعليمها كمباعة`,
          item_id: offer.item_id || null,
          item_title: offer.item_title || "",
          reference_id: "mark_sold",
          actor_name: offer.buyer_name || "",
        });
      } catch {}
      // Fire rate notifications now that the transaction is complete.
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: offer.buyer_id, type: "rate",
          item_id: offer.item_id, item_title: offer.item_title,
          text: "قيّم البائع · Rate the seller",
          actor_name: offer.seller_name || "",
          chatroom_id: offer.chatroom_id,
          reference_id: offerId,
        });
        await base44.asServiceRole.entities.Notification.create({
          user_id: offer.seller_id, type: "rate",
          item_id: offer.item_id, item_title: offer.item_title,
          text: "قيّم المشتري · Rate the buyer",
          actor_name: offer.buyer_name || "",
          chatroom_id: offer.chatroom_id,
          reference_id: offerId,
        });
      } catch {}
      return Response.json({ ok: true, offer: updated });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}