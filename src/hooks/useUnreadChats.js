import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

// Lazily create a single AudioContext and resume it on the first user gesture
// (browsers block audio until the page has been interacted with).
let audioCtx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}
if (typeof window !== "undefined") {
  const resume = () => {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}

function playBeep() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
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
    let timer = null;

    const compute = async () => {
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        roomIds.current = new Set(mine.map((r) => r.id));
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 200),
          base44.entities.Offer.list("-created_date", 200),
        ]);
        const since = lastChatsSeen ? new Date(lastChatsSeen).getTime() : 0;
        const unreadMsgs = (msgs || []).filter(
          (m) => roomIds.current.has(m.chatroom_id) && m.sender_id !== user.id && new Date(m.created_date).getTime() > since
        ).length;
        const unreadOffers = (offers || []).filter(
          (o) => roomIds.current.has(o.chatroom_id) && offerIsIncoming(o, user.id) && new Date(o.created_date).getTime() > since
        ).length;
        if (!cancelled) setCount(unreadMsgs + unreadOffers);
      } catch {}
    };
    compute();

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!cancelled) compute(); }, 400);
    };

    const maybeBeep = () => {
      if (window.location.pathname.startsWith("/chat/")) return;
      playBeep();
    };

    const unsubM = base44.entities.Message.subscribe((event) => {
      const m = event && event.data;
      if (!m || m.sender_id === user.id) return;
      if (event.type === "create" && roomIds.current.has(m.chatroom_id)) maybeBeep();
      schedule();
    });

    const unsubO = base44.entities.Offer.subscribe((event) => {
      const o = event && event.data;
      if (!o) return;
      if (event.type === "create" && offerIsIncoming(o, user.id) && roomIds.current.has(o.chatroom_id)) maybeBeep();
      schedule();
    });

    // Safety net: refresh periodically in case a realtime event is missed.
    const poll = setInterval(() => { if (!cancelled) compute(); }, 20000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (unsubM) unsubM();
      if (unsubO) unsubO();
      clearInterval(poll);
    };
  }, [user, lastChatsSeen]);

  return count;
}