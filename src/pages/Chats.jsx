import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";

export default function Chats() {
  const { user, lang, setLastChatsSeen } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const all = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (all || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        setRooms(mine);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => { setLastChatsSeen(new Date().toISOString()); }, []);

  const otherName = (r) => (r.seller_id === user.id ? r.buyer_name : r.seller_name);
  const otherAvatar = (r) => (r.seller_id === user.id ? r.buyer_avatar : r.seller_avatar);

  if (!loading && rooms.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <MessageCircle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="font-semibold">{t("noChats")}</p>
        <p className="text-sm mt-1">{t("noChatsDesc")}</p>
      </div>
    );
  }

  return (
    <div className="pt-3">
      <h1 className="text-2xl font-extrabold mb-3">{t("chats")}</h1>
      <div className="space-y-1.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))
          : rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => nav(`/chat/${r.id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted transition text-start"
              >
                <div className="relative w-14 h-14 shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {otherAvatar(r) ? <img src={otherAvatar(r)} className="w-full h-full object-cover" /> : (otherName(r)?.[0] || "?")}
                  </div>
                  {r.item_image && (
                    <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-md overflow-hidden border-2 border-background">
                      <img src={r.item_image} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{otherName(r)}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(r.updated_date, lang)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{r.last_message || r.item_title}</p>
                </div>
                {r.item_price != null && (
                  <span className="text-xs font-bold text-primary whitespace-nowrap"><Price value={r.item_price} lang={lang} /></span>
                )}
              </button>
            ))}
      </div>
    </div>
  );
}