import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Server-side state machine for the post-acceptance meetup flow.
// All state transitions are validated here and written with the service role
// (RLS update is admin-only), so clients cannot tamper with counts/windows.
// Rules enforced:
//  - Only an accepted/completed offer's parties can act.
//  - Time changes: max 2 per party, and only up to 2h before the agreed time.
//  - Check-in: only within [meetup_time - 5min, meetup_time + 15min], and the
//    reported coords must be within ~400m of the meetup place (when applicable).
//  - Completion only when both parties report a positive outcome.

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const CHECK_IN_EARLY_MS = 5 * 60 * 1000;
const CHECK_IN_LATE_MS = 15 * 60 * 1000;
const CHECK_IN_RADIUS_M = 400;

function distanceM(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const meetups = base44.entities.Meetup;
    const svc = base44.asServiceRole.entities.Meetup;

    const notify = (targetId, text, ctx) =>
      targetId &&
      base44.asServiceRole.entities.Notification
        .create({
          user_id: targetId,
          type: "offer_modified",
          text,
          item_id: ctx.item_id,
          item_title: ctx.item_title,
          chatroom_id: ctx.chatroom_id,
        })
        .catch(() => {});

    // ---- INITIATE ----
    if (action === "initiate") {
      const offerId = body.offer_id;
      if (!offerId) return Response.json({ error: "offer_id required" }, { status: 400 });
      let offer;
      try {
        offer = await base44.entities.Offer.get(offerId);
      } catch {
        return Response.json({ error: "Offer not found" }, { status: 404 });
      }
      if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });
      if (offer.status !== "accepted" && offer.status !== "completed")
        return Response.json({ error: "Offer not accepted" }, { status: 400 });
      if (offer.buyer_id !== user.id && offer.seller_id !== user.id)
        return Response.json({ error: "Not a party" }, { status: 403 });

      const existing = await meetups.filter({ offer_id: offerId }, "-created_date", 1);
      if (existing && existing.length && existing[0].status !== "cancelled")
        return Response.json({ meetup: existing[0] });

      const meetupType = ["meet_at_place", "buyer_pickup", "seller_delivery", "agree_separately"].includes(body.meetup_type)
        ? body.meetup_type
        : "meet_at_place";
      let item = null;
      try {
        item = await base44.entities.Item.get(offer.item_id);
      } catch {}
      const status = meetupType === "agree_separately" ? "place_confirmed" : "place_proposed";
      const placeName =
        meetupType === "buyer_pickup"
          ? item?.location_name || item?.city || ""
          : String(body.place_name || "").trim().slice(0, 120);
      const placeLat = meetupType === "buyer_pickup" ? item?.lat || null : Number(body.place_lat) || null;
      const placeLng = meetupType === "buyer_pickup" ? item?.lng || null : Number(body.place_lng) || null;

      const created = await svc.create({
        offer_id: offerId,
        chatroom_id: offer.chatroom_id,
        item_id: offer.item_id,
        item_title: offer.item_title,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        item_country: item?.country || "SA",
        item_lat: item?.lat || null,
        item_lng: item?.lng || null,
        status,
        meetup_type: meetupType,
        place_name: placeName,
        place_lat: placeLat,
        place_lng: placeLng,
        place_proposed_by: user.id,
        place_confirmed_by: meetupType === "agree_separately" ? user.id : null,
        meetup_time: null,
        time_proposed_by: null,
        buyer_time_changes: 0,
        seller_time_changes: 0,
      });

      const otherId = offer.buyer_id === user.id ? offer.seller_id : offer.buyer_id;
      notify(otherId, "اقتراح مكان اللقاء · Meetup place proposed", offer);
      return Response.json({ meetup: created });
    }

    // ---- Actions requiring an existing meetup ----
    const meetupId = body.meetup_id;
    if (!meetupId) return Response.json({ error: "meetup_id required" }, { status: 400 });
    let m;
    try {
      m = await meetups.get(meetupId);
    } catch {
      return Response.json({ error: "Meetup not found" }, { status: 404 });
    }
    if (!m) return Response.json({ error: "Meetup not found" }, { status: 404 });
    if (m.buyer_id !== user.id && m.seller_id !== user.id)
      return Response.json({ error: "Not a party" }, { status: 403 });
    const isBuyer = m.buyer_id === user.id;
    const otherId = isBuyer ? m.seller_id : m.buyer_id;
    const now = Date.now();
    const ctx = { item_id: m.item_id, item_title: m.item_title, chatroom_id: m.chatroom_id };

    if (action === "repropose_place") {
      if (m.status !== "place_proposed" && m.status !== "place_confirmed")
        return Response.json({ error: "Cannot change place now" }, { status: 400 });
      if (m.meetup_time) return Response.json({ error: "Time already set" }, { status: 400 });
      const placeName = String(body.place_name || "").trim().slice(0, 120);
      const placeLat = Number(body.place_lat) || null;
      const placeLng = Number(body.place_lng) || null;
      await svc.update(meetupId, {
        place_name: placeName,
        place_lat: placeLat,
        place_lng: placeLng,
        place_proposed_by: user.id,
        place_confirmed_by: null,
        status: "place_proposed",
      });
      notify(otherId, "اقتراح مكان جديد · New meetup place proposed", ctx);
      return Response.json({ ok: true });
    }

    if (action === "confirm_place") {
      if (m.status !== "place_proposed") return Response.json({ error: "Place not pending" }, { status: 400 });
      if (m.place_proposed_by === user.id)
        return Response.json({ error: "Can't confirm your own proposal" }, { status: 400 });
      await svc.update(meetupId, { status: "place_confirmed", place_confirmed_by: user.id });
      notify(otherId, "تم تأكيد المكان · Place confirmed", ctx);
      return Response.json({ ok: true });
    }

    if (action === "set_time") {
      const dt = new Date(body.meetup_time);
      if (isNaN(dt.getTime())) return Response.json({ error: "Invalid time" }, { status: 400 });
      if (dt.getTime() < now) return Response.json({ error: "Time in the past" }, { status: 400 });
      if (m.status === "place_confirmed") {
        await svc.update(meetupId, {
          meetup_time: dt.toISOString(),
          time_proposed_by: user.id,
          status: "time_proposed",
        });
        notify(otherId, "اقتراح موعد اللقاء · Meetup time proposed", ctx);
        return Response.json({ ok: true });
      }
      if (m.status === "time_proposed") {
        if (m.time_proposed_by !== user.id)
          return Response.json({ error: "Wait for the other party to confirm" }, { status: 400 });
        await svc.update(meetupId, { meetup_time: dt.toISOString() });
        notify(otherId, "تعديل موعد اللقاء · Meetup time updated", ctx);
        return Response.json({ ok: true });
      }
      if (m.status === "confirmed") {
        const myCount = isBuyer ? m.buyer_time_changes : m.seller_time_changes;
        if (myCount >= 2) return Response.json({ error: "No time changes left" }, { status: 400 });
        const existing = new Date(m.meetup_time).getTime();
        if (now > existing - TWO_HOURS_MS)
          return Response.json({ error: "Too late to change (within 2h)" }, { status: 400 });
        const upd = {
          meetup_time: dt.toISOString(),
          time_proposed_by: user.id,
          status: "time_proposed",
        };
        if (isBuyer) upd.buyer_time_changes = myCount + 1;
        else upd.seller_time_changes = myCount + 1;
        await svc.update(meetupId, upd);
        notify(otherId, "طلب تغيير الموعد · Time change requested", ctx);
        return Response.json({ ok: true });
      }
      return Response.json({ error: "Cannot set time now" }, { status: 400 });
    }

    if (action === "confirm_time") {
      if (m.status !== "time_proposed") return Response.json({ error: "Time not pending" }, { status: 400 });
      if (m.time_proposed_by === user.id)
        return Response.json({ error: "Can't confirm your own time" }, { status: 400 });
      await svc.update(meetupId, { status: "confirmed" });
      notify(otherId, "تم تأكيد الموعد · Time confirmed", ctx);
      return Response.json({ ok: true });
    }

    if (action === "check_in") {
      if (m.status !== "confirmed") return Response.json({ error: "Meetup not confirmed" }, { status: 400 });
      const mt = new Date(m.meetup_time).getTime();
      if (now < mt - CHECK_IN_EARLY_MS) return Response.json({ error: "Too early to check in" }, { status: 400 });
      if (now > mt + CHECK_IN_LATE_MS) return Response.json({ error: "Check-in window passed" }, { status: 400 });
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (m.meetup_type !== "agree_separately" && (isNaN(lat) || isNaN(lng)))
        return Response.json({ error: "Location required" }, { status: 400 });
      if (m.meetup_type !== "agree_separately" && m.place_lat != null && m.place_lng != null) {
        const d = distanceM(lat, lng, m.place_lat, m.place_lng);
        if (d > CHECK_IN_RADIUS_M) return Response.json({ error: "Too far from meetup place" }, { status: 400 });
      }
      const upd = isBuyer
        ? { buyer_checked_in: new Date().toISOString(), buyer_checked_in_lat: lat, buyer_checked_in_lng: lng }
        : { seller_checked_in: new Date().toISOString(), seller_checked_in_lat: lat, seller_checked_in_lng: lng };
      await svc.update(meetupId, upd);
      notify(otherId, "وصل الطرف الآخر · The other party checked in", ctx);
      return Response.json({ ok: true });
    }

    if (action === "set_outcome") {
      const outcome = body.outcome;
      const buyerOutcomes = ["received", "not_as_described", "seller_no_show"];
      const sellerOutcomes = ["paid", "not_paid", "buyer_no_show"];
      if (isBuyer && !buyerOutcomes.includes(outcome))
        return Response.json({ error: "Invalid outcome" }, { status: 400 });
      if (!isBuyer && !sellerOutcomes.includes(outcome))
        return Response.json({ error: "Invalid outcome" }, { status: 400 });
      // For mapped meetups, the acting party must have checked in before
      // recording an outcome — claims require verified physical presence.
      if (m.meetup_type !== "agree_separately") {
        const checkedIn = isBuyer ? !!m.buyer_checked_in : !!m.seller_checked_in;
        if (!checkedIn) return Response.json({ error: "Check in first to record the outcome" }, { status: 400 });
      }
      const upd = isBuyer ? { buyer_outcome: outcome } : { seller_outcome: outcome };
      await svc.update(meetupId, upd);
      const fresh = await meetups.get(meetupId);
      const b = fresh.buyer_outcome;
      const s = fresh.seller_outcome;
      if (b && s) {
        const bothGood = b === "received" && s === "paid";
        const anyNoShow = b === "seller_no_show" || s === "buyer_no_show";
        if (bothGood) {
          await svc.update(meetupId, { status: "completed", completed: true });
          try {
            await base44.asServiceRole.entities.Offer.update(fresh.offer_id, {
              status: "completed",
              received_confirmed: true,
            });
          } catch {}
          // Fetch offer to resolve party names for notifications.
          let offerData = null;
          try { offerData = await base44.entities.Offer.get(fresh.offer_id); } catch {}
          const buyerName = offerData?.buyer_name || "";
          const sellerName = offerData?.seller_name || "";
          // Notify the seller that the meetup completed — they can now mark
          // the item as sold themselves (no auto-sold).
          try {
            await base44.asServiceRole.entities.Notification.create({
              user_id: fresh.seller_id,
              type: "sold",
              text: `اكتمل لقاء "${fresh.item_title || ""}" بنجاح — يمكنك الآن تعليم الإعلان كمباع`,
              item_id: fresh.item_id || null,
              item_title: fresh.item_title || "",
              reference_id: "mark_sold",
              actor_name: buyerName,
            });
          } catch {}
          // Fire rate notifications now that the transaction is complete.
          try {
            await base44.asServiceRole.entities.Notification.create({
              user_id: fresh.buyer_id, type: "rate",
              item_id: fresh.item_id, item_title: fresh.item_title,
              text: "قيّم البائع · Rate the seller",
              actor_name: sellerName,
              chatroom_id: fresh.chatroom_id,
              reference_id: fresh.offer_id,
            });
            await base44.asServiceRole.entities.Notification.create({
              user_id: fresh.seller_id, type: "rate",
              item_id: fresh.item_id, item_title: fresh.item_title,
              text: "قيّم المشتري · Rate the buyer",
              actor_name: buyerName,
              chatroom_id: fresh.chatroom_id,
              reference_id: fresh.offer_id,
            });
          } catch {}
        } else if (anyNoShow) {
          await svc.update(meetupId, { status: "no_show" });
        } else {
          // Contested (not_as_described / not_paid): flag for dispute review
          // instead of auto-completing the sale and burying the complaint.
          const contested = b === "not_as_described" || s === "not_paid";
          if (contested) {
            await svc.update(meetupId, { status: "contested" });
          } else {
            await svc.update(meetupId, { status: "completed", completed: true });
          }
        }
        notify(otherId, "تم تسجيل نتيجة اللقاء · Meetup outcome recorded", ctx);
      } else {
        notify(otherId, "بانتظار تأكيدك للنتيجة · Waiting for your outcome", ctx);
      }
      return Response.json({ ok: true, meetup: await meetups.get(meetupId) });
    }

    if (action === "cancel") {
      if (m.status === "completed" || m.status === "no_show")
        return Response.json({ error: "Already finalized" }, { status: 400 });
      await svc.update(meetupId, { status: "cancelled" });
      notify(otherId, "تم إلغاء اللقاء · Meetup cancelled", ctx);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}