import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Trash2, BadgeCheck } from "lucide-react";
import TrustedBadge from "@/components/TrustedBadge";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";

export default function Chats() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRoom, setConfirmRoom] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [unread, setUnread] = useState({});
  const [trusted, setTrusted] = useState({});
  const [avatars, setAvatars] = useState({});
  const [lastMsgTime, setLastMsgTime] = useState({});
  const roomsRef = useRef([]);
  const lastFocusRef = useRef(0);

  const offerIsIncoming = (o, userId) => {
    if (!o || !userId) return false;
    if (o.direction === "buyer_offer") return o.seller_id === userId;
    if (o.direction === "seller_counter") return o.buyer_id === userId;
    return false;
  };

  const loadingRef = useRef(false);
  const loadRooms = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    // Guard against overlapping fetches racing and overwriting with stale/empty results.
    if (loadingRef.current) return;
    loadingRef.current = true;
    // Only show skeletons on the very first load; later refetches update silently.
    if (!roomsRef.current.length) setLoading(true);
    try {
      const all = await base44.entities.ChatRoom.list("-updated_date", 100);
      const mine = (all || []).filter((r) => {
        if (!(r.buyer_id === user.id || r.seller_id === user.id)) return false;
        if (r.buyer_id === user.id && r.hidden_for_buyer) return false;
        if (r.seller_id === user.id && r.hidden_for_seller) return false;
        return true;
      });
      roomsRef.current = mine;
      setRooms(mine);
      try {
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 200),
          base44.entities.Offer.list("-created_date", 200),
        ]);
        // Unread is per-room, based on each room's own last-seen timestamp
        // (same model as the bottom-nav badge and WhatsApp/Telegram).
        const map = {};
        mine.forEach((r) => {
          const seen = r.seller_id === user.id ? r.seller_last_seen : r.buyer_last_seen;
          const since = seen ? new Date(seen).getTime() : 0;
          let c = 0;
          (msgs || []).forEach((m) => {
            if (m.chatroom_id === r.id && m.sender_id !== user.id && new Date(m.created_date).getTime() > since) c++;
          });
          (offers || []).forEach((o) => {
            if (o.chatroom_id === r.id && offerIsIncoming(o, user.id) && new Date(o.created_date).getTime() > since) c++;
          });
          if (c > 0) map[r.id] = c;
        });
        setUnread(map);
        // Last activity per room = newest message or offer timestamp, so the list
        // shows real conversation time instead of the room's updated_date (which
        // bumps on read-receipt pings and would show "now" just from opening a chat).
        const timeMap = {};
        [...(msgs || []), ...(offers || [])].forEach((x) => {
          if (!x.chatroom_id) return;
          const ts = new Date(x.created_date).getTime();
          if (!timeMap[x.chatroom_id] || ts > new Date(timeMap[x.chatroom_id]).getTime()) timeMap[x.chatroom_id] = x.created_date;
        });
        setLastMsgTime(timeMap);
        // Fetch trusted status for each distinct other party.
        const otherIds = [];
        mine.forEach((r) => {
          const oid = r.seller_id === user.id ? r.buyer_id : r.seller_id;
          if (oid && !otherIds.includes(oid)) otherIds.push(oid);
        });
        const tMap = {};
        const aMap = {};
        await Promise.all(otherIds.map(async (oid) => {
          try {
            const p = await base44.functions.invoke("getPublicProfile", { user_id: oid });
            if (p?.data?.is_trusted) tMap[oid] = true;
            if (p?.data?.avatar) aMap[oid] = p.data.avatar;
          } catch {}
        }));
        setTrusted(tMap);
        setAvatars(aMap);
      } catch {}
      // Never clear existing rooms on a transient fetch error — keep what we have.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRooms]);

  useEffect(() => {
    if (!user) return;
    const onRoom = (event) => {
      // Only react to structural changes. Update events (last-seen pings, last_message
      // bumps) would otherwise trigger a refetch storm and can overlap/clear the list.
      if (event?.type === "create") { loadRooms(); return; }
      if (event?.type === "delete") {
        const id = event?.data?.id;
        if (id) setRooms((prev) => prev.filter((r) => r.id !== id));
        return;
      }
    };
    const onMsg = async (event) => {
      if (event?.type !== "create") return;
      const m = event?.data;
      if (!m || m.sender_id === user.id) return;
      const r = roomsRef.current.find((rr) => rr.id === m.chatroom_id);
      if (!r) {
        // Message landed in a room not currently visible (deleted/hidden on my side).
        // The sender un-hides it server-side; refetch immediately so the chat reappears.
        loadRooms();
        return;
      }
      const isBuyer = String(r.buyer_id) === String(user.id);
      if ((isBuyer && r.hidden_for_buyer) || (!isBuyer && r.hidden_for_seller)) {
        try {
          await base44.entities.ChatRoom.update(r.id, isBuyer ? { hidden_for_buyer: false } : { hidden_for_seller: false });
        } catch {}
        loadRooms();
        return;
      }
      // Optimistic update only — avoid a full refetch on every incoming message.
      setRooms((prev) => {
        const idx = prev.findIndex((rr) => rr.id === m.chatroom_id);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = { ...copy[idx], last_message: m.text, updated_date: m.created_date };
        return copy;
      });
      setLastMsgTime((prev) => {
        const existing = prev[m.chatroom_id] ? new Date(prev[m.chatroom_id]).getTime() : 0;
        return new Date(m.created_date).getTime() > existing ? { ...prev, [m.chatroom_id]: m.created_date } : prev;
      });
      setUnread((prev) => ({ ...prev, [m.chatroom_id]: (prev[m.chatroom_id] || 0) + 1 }));
    };
    const onOffer = (event) => {
      if (event?.type !== "create") return;
      const o = event?.data;
      if (!o || !offerIsIncoming(o, user.id)) return;
      if (!roomsRef.current.some((rr) => rr.id === o.chatroom_id)) { loadRooms(); return; }
      setUnread((prev) => ({ ...prev, [o.chatroom_id]: (prev[o.chatroom_id] || 0) + 1 }));
    };
    const unsubR = base44.entities.ChatRoom.subscribe(onRoom);
    const unsubM = base44.entities.Message.subscribe(onMsg);
    const unsubO = base44.entities.Offer.subscribe(onOffer);
    // Safety net: refresh whenever the window regains focus, so reappearing
    // chats and new messages surface even if a realtime event is missed.
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusRef.current > 5000) {
        lastFocusRef.current = now;
        loadRooms();
      }
    };
    const onVis = () => { if (!document.hidden) onFocus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      unsubR?.(); unsubM?.(); unsubO?.();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, loadRooms]);

  const deleteRoom = async (room) => {
    const isBuyer = room.buyer_id === user.id;
    try {
      await base44.entities.ChatRoom.update(room.id, isBuyer ? { hidden_for_buyer: true } : { hidden_for_seller: true });
    } catch {}
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    setConfirmRoom(null);
  };

  const deleteAll = async () => {
    await Promise.all(
      rooms.map((r) => {
        const isBuyer = r.buyer_id === user.id;
        return base44.entities.ChatRoom.update(r.id, isBuyer ? { hidden_for_buyer: true } : { hidden_for_seller: true }).catch(() => {});
      })
    );
    setRooms([]);
    setUnread({});
    setConfirmAll(false);
  };

  const otherName = (r) => (r.seller_id === user.id ? r.buyer_name : r.seller_name);
  const otherAvatar = (r) => avatars[otherId(r)] || (r.seller_id === user.id ? r.buyer_avatar : r.seller_avatar);
  const otherId = (r) => (r.seller_id === user.id ? r.buyer_id : r.seller_id);
  const isOfficialForMe = (r) => r.is_official && r.seller_id !== user.id;

  const sortedRooms = [...rooms].sort((a, b) => {
    const ta = lastMsgTime[a.id] ? new Date(lastMsgTime[a.id]).getTime() : new Date(a.created_date).getTime();
    const tb = lastMsgTime[b.id] ? new Date(lastMsgTime[b.id]).getTime() : new Date(b.created_date).getTime();
    return (Number(!!unread[b.id]) - Number(!!unread[a.id])) || (tb - ta);
  });

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
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">{t("chats")}</h1>
        {rooms.length > 0 && (
          <button onClick={() => setConfirmAll(true)} className="flex items-center gap-1.5 text-sm font-semibold text-rose-600">
            <Trash2 size={16} /> {t("deleteAllChats")}
          </button>
        )}
      </div>
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
          : sortedRooms.map((r) => (
              <div key={r.id} className="flex items-center">
                <button
                  onClick={() => nav(`/chat/${r.id}`)}
                  className="flex-1 flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted transition text-start min-w-0"
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
                    {unread[r.id] ? (
                      <span className="absolute top-0 start-0 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-card" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`truncate flex items-center gap-1 ${unread[r.id] ? "font-bold" : "font-semibold"}`}>
                      {otherName(r)}
                      {trusted[otherId(r)] && <TrustedBadge size={14} />}
                      {isOfficialForMe(r) && !trusted[otherId(r)] && <BadgeCheck size={14} className="text-primary shrink-0" />}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(lastMsgTime[r.id] || r.created_date, lang)}</span>
                  </div>
                  <p className={`text-sm truncate ${unread[r.id] ? "text-foreground font-medium" : "text-muted-foreground"}`}>{r.last_message || (r.is_official ? (lang === "ar" ? "محادثة رسمية" : "Official chat") : r.item_title)}</p>
                  </div>
                  {r.item_price != null && !r.is_official && (
                    <span className="text-xs font-bold text-primary whitespace-nowrap"><Price value={r.item_price} lang={lang} /></span>
                  )}
                  {unread[r.id] ? (
                    <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {unread[r.id]}
                    </span>
                  ) : null}
                  </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmRoom(r); }}
                  aria-label={t("delete")}
                  className="shrink-0 p-2.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
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

      {confirmAll && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAll(false)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{t("deleteAllChats")}</h3>
              <button onClick={() => setConfirmAll(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{t("deleteAllChatsConfirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAll(false)} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold">{t("cancel")}</button>
              <button onClick={deleteAll} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold">{t("delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}