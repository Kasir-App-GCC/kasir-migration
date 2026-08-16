import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Star, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo, toDate } from "@/lib/format";

export default function Notifications() {
  const { user, lang, lastChatsSeen } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        const roomMap = new Map(mine.map((r) => [r.id, r]));
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 100),
          base44.entities.Offer.list("-created_date", 100),
        ]);
        const since = lastChatsSeen ? toDate(lastChatsSeen).getTime() : 0;
        const isIncoming = (o) =>
          o && ((o.direction === "buyer_offer" && o.seller_id === user.id) || (o.direction === "seller_counter" && o.buyer_id === user.id));
        const notifs = (msgs || [])
          .filter((m) => roomMap.has(m.chatroom_id) && m.sender_id !== user.id)
          .map((m) => ({
            id: m.id,
            type: "message",
            text: m.text,
            name: m.sender_name,
            roomId: m.chatroom_id,
            date: m.created_date,
            unread: toDate(m.created_date).getTime() > since,
          }));
        const offerNotifs = (offers || [])
          .filter((o) => roomMap.has(o.chatroom_id) && isIncoming(o))
          .map((o) => {
            const r = roomMap.get(o.chatroom_id);
            const who = o.direction === "buyer_offer" ? o.buyer_name : o.seller_name;
            return {
              id: o.id,
              type: "offer",
              text: `${t("offerMessage")} · ${o.amount} ${lang === "ar" ? "ر.س" : "SAR"}`,
              name: who,
              roomId: o.chatroom_id,
              date: o.created_date,
              unread: toDate(o.created_date).getTime() > since,
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

        const all = [...notifs, ...offerNotifs, ...ratings].sort((a, b) => toDate(b.date) - toDate(a.date));
        setItems(all);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, lastChatsSeen]);

  return (
    <div className="pt-3">
      <h1 className="text-2xl font-extrabold mb-3">{t("notifications")}</h1>
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
              onClick={() => (n.type === "message" || n.type === "offer") && nav(`/chat/${n.roomId}`)}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/50 transition text-start ${n.unread ? "ring-1 ring-primary/30" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "message" ? "bg-primary/10 text-primary" : n.type === "offer" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300"}`}>
                {n.type === "message" ? <MessageCircle size={18} /> : n.type === "offer" ? <Tag size={18} /> : <Star size={18} className="fill-amber-400 text-amber-400" />}
              </div>
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