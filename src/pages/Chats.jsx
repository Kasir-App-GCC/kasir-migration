import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import SwipeToDelete from "@/components/SwipeToDelete";

export default function Chats() {
  const { user, lang, setLastChatsSeen } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRoom, setConfirmRoom] = useState(null);

  const deleteRoom = async (room) => {
    try { await base44.entities.ChatRoom.delete(room.id); } catch {}
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    setConfirmRoom(null);
  };

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
              <SwipeToDelete key={r.id} label={t("delete")} onDelete={() => setConfirmRoom(r)}>
                <button
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
              </SwipeToDelete>
            ))}
      </div>

      {confirmRoom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmRoom(null)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{t("deleteChat")}</h3>
              <button onClick={() => setConfirmRoom(null)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{t("deleteChatConfirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRoom(null)} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold">{t("cancel")}</button>
              <button onClick={() => deleteRoom(confirmRoom)} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold">{t("delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}