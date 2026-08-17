import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Star, Tag, Trash2, CheckCircle, Check, X, ArrowLeftRight, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo, toDate } from "@/lib/format";

export default function Notifications() {
  const { user, lang, notifsClearedAt, setNotifsClearedAt } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => {
          if (r.buyer_id !== user.id && r.seller_id !== user.id) return false;
          // Exclude chats the user has deleted (hidden on their side).
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
            id: m.id,
            type: "message",
            text: m.text,
            name: m.sender_name,
            roomId: m.chatroom_id,
            date: m.created_date,
            unread: toDate(m.created_date).getTime() > roomSince(m.chatroom_id),
          }));
        const offerNotifs = (offers || [])
          .filter((o) => roomMap.has(o.chatroom_id) && isIncoming(o))
          .map((o) => {
            const who = o.direction === "buyer_offer" ? o.buyer_name : o.seller_name;
            return {
              id: o.id,
              type: "offer",
              text: `${t("offerMessage")} · ${o.amount} ${lang === "ar" ? "ر.س" : "SAR"}`,
              name: who,
              roomId: o.chatroom_id,
              date: o.created_date,
              unread: toDate(o.created_date).getTime() > roomSince(o.chatroom_id),
            };
          });

        let ratings = [];
        try {
          const rs = await base44.entities.Rating.filter({ rated_user_id: user.id }, "-created_date", 10);
          ratings = (rs || []).map((r) => ({
            id: r.id,
            type: "rating",
            text: r.review || "",
            name: r.rater_name,
            score: r.score,
            date: r.created_date,
            unread: false,
          }));
        } catch {}

        let systemNotifs = [];
        try {
          const ns = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 30);
          systemNotifs = (ns || []).map((n) => {
            if (n.type === "sold") {
              return {
                id: n.id, type: "sold", text: n.text, name: n.item_title,
                image: n.item_image, itemId: n.item_id, date: n.created_date, unread: !n.read,
              };
            }
            return {
              id: n.id, type: n.type, text: n.text, name: n.actor_name,
              roomId: n.chatroom_id, amount: n.offer_amount, date: n.created_date, unread: !n.read,
            };
          });
        } catch {}

        const clearedAt = notifsClearedAt ? toDate(notifsClearedAt).getTime() : 0;
        const all = [...notifs, ...offerNotifs, ...ratings, ...systemNotifs]
          .sort((a, b) => toDate(b.date) - toDate(a.date))
          .filter((n) => toDate(n.date).getTime() > clearedAt);
        setItems(all);
        // Acknowledge system notifications so the badge clears for the user.
        try {
          await base44.entities.Notification.updateMany(
            { user_id: user.id, read: false },
            { $set: { read: true } }
          );
        } catch {}
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, notifsClearedAt, tick]);

  useEffect(() => {
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event?.type === "create") setTick((t) => t + 1);
    });
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => { unsub?.(); window.removeEventListener("focus", onFocus); };
  }, []);

  const clearAll = () => {
    setNotifsClearedAt(new Date().toISOString());
    setItems([]);
  };

  const markNotifRead = (n) => {
    if (!n.unread) return;
    try { base44.entities.Notification.update(n.id, { read: true }).catch(() => {}); } catch {}
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
  };

  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">{t("notifications")}</h1>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Trash2 size={15} />
            {t("clearAllNotifs")}
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-center py-16">
          <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell size={36} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (n.type === "sold") { markNotifRead(n); if (n.itemId) nav(`/item/${n.itemId}`); }
                else if (n.type === "message" || n.type === "offer") nav(`/chat/${n.roomId}`);
                else if (n.roomId) { markNotifRead(n); nav(`/chat/${n.roomId}`); }
              }}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/50 transition text-start ${n.unread ? "ring-1 ring-primary/30" : ""}`}
            >
              {n.type === "sold" ? (
                n.image ? (
                  <Image src={n.image} alt={n.name} fittingType="fill" className="w-10 h-10 rounded-xl shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 shrink-0 flex items-center justify-center">
                    <CheckCircle size={18} />
                  </div>
                )
              ) : n.type === "offer_accepted" ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check size={18} />
                </div>
              ) : n.type === "offer_rejected" ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                  <X size={18} />
                </div>
              ) : n.type === "offer_countered" ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                  <ArrowLeftRight size={18} />
                </div>
              ) : n.type === "offer_modified" ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <Pencil size={18} />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "message" ? "bg-primary/10 text-primary" : n.type === "offer" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300"}`}>
                  {n.type === "message" ? <MessageCircle size={18} /> : n.type === "offer" ? <Tag size={18} /> : <Star size={18} className="fill-amber-400 text-amber-400" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{n.name || "—"}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(n.date, lang)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {n.text || (n.type === "rating" ? `${t("newRating")} · ${n.score}★` : n.type === "offer" ? t("offerMessage") : "")}
                </p>
              </div>
              {n.unread && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}