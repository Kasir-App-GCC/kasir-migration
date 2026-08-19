import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { toDate } from "@/lib/format";

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
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => {
          if (r.buyer_id !== user.id && r.seller_id !== user.id) return false;
          return r.buyer_id === user.id ? !r.hidden_for_buyer : !r.hidden_for_seller;
        });
        const roomMap = new Map(mine.map((r) => [r.id, r]));
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 100),
          base44.entities.Offer.list("-created_date", 100),
        ]);
        const isIncoming = (o) =>
          o && ((o.direction === "buyer_offer" && o.seller_id === user.id) || (o.direction === "seller_counter" && o.buyer_id === user.id));
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
        const offerNotifs = (offers || [])
          .filter((o) => roomMap.has(o.chatroom_id) && isIncoming(o))
          .map((o) => {
            const who = o.direction === "buyer_offer" ? o.buyer_name : o.seller_name;
            return {
              id: o.id, type: "offer",
              text: `${t("offerMessage")} · ${o.amount} ${lang === "ar" ? "ر.س" : "SAR"}`,
              name: who, roomId: o.chatroom_id, date: o.created_date,
              unread: toDate(o.created_date).getTime() > roomSince(o.chatroom_id),
            };
          });

        let ratings = [];
        try {
          const rs = await base44.entities.Rating.filter({ rated_user_id: user.id }, "-created_date", 10);
          ratings = (rs || []).map((r) => ({
            id: r.id, type: "rating", text: r.review || "", name: r.rater_name,
            score: r.score, date: r.created_date, unread: false,
          }));
        } catch {}

        let systemNotifs = [];
        try {
          const ns = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 30);
          systemNotifs = (ns || []).map((n) => {
            if (n.type === "sold") {
              return { id: n.id, type: "sold", text: n.text, name: n.item_title, image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read };
            }
            if (n.type === "boost_approved") {
              return { id: n.id, type: "boost_approved", text: n.text, name: n.item_title, itemId: n.item_id, date: n.created_date, unread: !n.read };
            }
            return { id: n.id, type: n.type, text: n.text, name: n.actor_name, roomId: n.chatroom_id, amount: n.offer_amount, date: n.created_date, unread: !n.read };
          });
        } catch {}

        const clearedAt = notifsClearedAt ? toDate(notifsClearedAt).getTime() : 0;
        const all = [...notifs, ...offerNotifs, ...ratings, ...systemNotifs]
          .sort((a, b) => toDate(b.date) - toDate(a.date))
          .filter((n) => toDate(n.date).getTime() > clearedAt);
        setItems(all);
        // Acknowledge system notifications so the badge clears for the user.
        try {
          await base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } });
        } catch {}
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, notifsClearedAt, tick]);

  useEffect(() => {
    let timer = null;
    const bump = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => setTick((x) => x + 1), 500); };
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