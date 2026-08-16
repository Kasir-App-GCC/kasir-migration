import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { toDate } from "@/lib/format";

function playBeep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.start();
    o.stop(ctx.currentTime + 0.47);
    setTimeout(() => ctx.close(), 700);
  } catch {}
}

// Is this offer directed at the given user (i.e. incoming, not self-created)?
function offerIsIncoming(o, userId) {
  if (!o || !userId) return false;
  if (o.direction === "buyer_offer") return o.seller_id === userId;
  if (o.direction === "seller_counter") return o.buyer_id === userId;
  return false;
}

export default function useUnreadChats() {
  const { user, lastChatsSeen } = useStore();
  const [count, setCount] = useState(0);
  const roomIds = useRef(new Set());

  useEffect(() => {
    if (!user) {
      setCount(0);
      roomIds.current = new Set();
      return;
    }
    let cancelled = false;
    const since = lastChatsSeen ? new Date(lastChatsSeen).getTime() : 0;

    const compute = async () => {
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        roomIds.current = new Set(mine.map((r) => r.id));
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 200),
          base44.entities.Offer.list("-created_date", 200),
        ]);
        const unreadMsgs = (msgs || []).filter(
          (m) => roomIds.current.has(m.chatroom_id) && m.sender_id !== user.id && toDate(m.created_date).getTime() > since
        ).length;
        const unreadOffers = (offers || []).filter(
          (o) => roomIds.current.has(o.chatroom_id) && offerIsIncoming(o, user.id) && toDate(o.created_date).getTime() > since
        ).length;
        if (!cancelled) setCount(unreadMsgs + unreadOffers);
      } catch {}
    };
    compute();

    const onIncoming = () => {
      if (window.location.pathname.startsWith("/chat/")) return;
      playBeep();
      setCount((c) => c + 1);
    };

    const unsubM = base44.entities.Message.subscribe((event) => {
      const m = event && event.data;
      if (!m || m.sender_id === user.id) return;
      if (!roomIds.current.has(m.chatroom_id)) return;
      onIncoming();
    });

    const unsubO = base44.entities.Offer.subscribe((event) => {
      const o = event && event.data;
      if (!offerIsIncoming(o, user.id)) return;
      if (!roomIds.current.has(o.chatroom_id)) return;
      onIncoming();
    });

    return () => {
      cancelled = true;
      if (unsubM) unsubM();
      if (unsubO) unsubO();
    };
  }, [user, lastChatsSeen]);

  return count;
}