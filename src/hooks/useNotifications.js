import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { toDate } from "@/lib/format";
import { fetchMyChatData } from "@/lib/chatData";
import { emitNotifsRead } from "@/lib/notifSignal";

// Shared notification fetching + realtime updates, used by both the
// Notifications page and the bell dropdown.
export default function useNotifications() {
  const { user, lang, notifsClearedAt, setNotifsClearedAt } = useStore();
  const t = useT();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        // Fetch all sources in parallel — the previous sequential chain
        // (rooms → msgs/offers → ratings → notifications) made the bell
        // feel slow. None of the fetches depend on each other; roomMap is
        // only used for client-side filtering after everything resolves.
        const [chatData, rs, ns] = await Promise.all([
          fetchMyChatData(user, { messageLimit: 100, offerLimit: 100 }),
          base44.entities.Rating.filter({ rated_user_id: user.id }, "-created_date", 10).catch(() => []),
          base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 30).catch(() => []),
        ]);
        const { rooms: mine, messages: msgs, roomMap } = chatData;
        const roomSince = (roomId) => {
          const r = roomMap.get(roomId);
          if (!r) return 0;
          const seen = r.seller_id === user.id ? r.seller_last_seen : r.buyer_last_seen;
          return seen ? toDate(seen).getTime() : 0;
        };
        const notifs = (msgs || [])
          .filter((m) => roomMap.has(m.chatroom_id) && m.sender_id !== user.id)
          .map((m) => ({
            id: m.id, type: "message", text: m.text, name: m.sender_name,
            roomId: m.chatroom_id, date: m.created_date,
            unread: toDate(m.created_date).getTime() > roomSince(m.chatroom_id),
          }));

        const ratings = (rs || []).map((r) => ({
          id: r.id, type: "rating", text: r.review || "", name: r.rater_name,
          score: r.score, date: r.created_date, unread: false,
        }));

        const systemNotifs = (ns || []).map((n) => {
          if (n.type === "sold") {
            return { id: n.id, type: "sold", text: n.text, name: n.item_title, image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "boost_approved") {
            return { id: n.id, type: "boost_approved", text: n.text, name: n.item_title, itemId: n.item_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "rate") {
            return { id: n.id, type: "rate", text: n.text, name: n.item_title, image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "saved_search_match") {
            return { id: n.id, type: "saved_search_match", text: n.text, name: n.item_title, image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "new_follower") {
            return { id: n.id, type: "new_follower", text: n.text, name: n.actor_name, actorId: n.actor_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "price_drop") {
            return { id: n.id, type: "price_drop", text: n.text, name: n.item_title, image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "dispute_resolved") {
            return { id: n.id, type: "dispute_resolved", text: n.text, name: n.item_title, itemId: n.item_id, roomId: n.chatroom_id, disputeId: n.dispute_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "dispute_opened") {
            return { id: n.id, type: "dispute_opened", text: n.text, name: n.item_title, itemId: n.item_id, roomId: n.chatroom_id, disputeId: n.dispute_id, date: n.created_date, unread: !n.read };
          }
          if (n.type === "admin_message") {
            return { id: n.id, type: "admin_message", text: n.text, name: n.actor_name, itemId: n.item_id, roomId: n.chatroom_id, disputeId: n.dispute_id, date: n.created_date, unread: !n.read };
          }
          return { id: n.id, type: n.type, text: n.text, name: n.actor_name, roomId: n.chatroom_id, amount: n.offer_amount, date: n.created_date, unread: !n.read };
        });

        const clearedAt = notifsClearedAt ? toDate(notifsClearedAt).getTime() : 0;
        const all = [...notifs, ...ratings, ...systemNotifs]
          .sort((a, b) => toDate(b.date) - toDate(a.date))
          .filter((n) => toDate(n.date).getTime() > clearedAt);
        setItems(all);
        setLoading(false);
        // Acknowledge system notifications, then signal the bell to recompute
        // (updateMany doesn't fire per-record realtime events on its own).
        base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } })
          .then(() => emitNotifsRead())
          .catch(() => {});
      } catch {
        setItems([]);
        setLoading(false);
      }
    })();
  }, [user, notifsClearedAt, tick]);

  useEffect(() => {
    let timer = null;
    const bump = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => setTick((x) => x + 1), 150); };
    const unsub = base44.entities.Notification.subscribe((e) => { if (e?.type === "create") bump(); });
    const unsubM = base44.entities.Message.subscribe((e) => { if (e?.type === "create") bump(); });
    const unsubO = base44.entities.Offer.subscribe((e) => { if (e?.type === "create") bump(); });
    const onFocus = () => bump();
    window.addEventListener("focus", onFocus);
    return () => { if (timer) clearTimeout(timer); unsub?.(); unsubM?.(); unsubO?.(); window.removeEventListener("focus", onFocus); };
  }, []);

  const clearAll = () => { setNotifsClearedAt(new Date().toISOString()); setItems([]); };
  const markNotifRead = (n) => {
    if (!n.unread) return;
    try { base44.entities.Notification.update(n.id, { read: true }).catch(() => {}); } catch {}
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
  };

  return { items, loading, clearAll, markNotifRead };
}