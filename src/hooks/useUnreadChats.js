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
  const { user } = useStore();
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
    let inFlight = false;

    const compute = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => {
          if (r.buyer_id !== user.id && r.seller_id !== user.id) return false;
          // Skip rooms the user has deleted (hidden on their side).
          return r.buyer_id === user.id ? !r.hidden_for_buyer : !r.hidden_for_seller;
        });
        roomIds.current = new Set(mine.map((r) => r.id));
        const [msgs, offers] = await Promise.all([
          base44.entities.Message.list("-created_date", 200),
          base44.entities.Offer.list("-created_date", 200),
        ]);
        let total = 0;
        mine.forEach((r) => {
          const myLastSeen = r.seller_id === user.id ? r.seller_last_seen : r.buyer_last_seen;
          const since = myLastSeen ? new Date(myLastSeen).getTime() : 0;
          total += (msgs || []).filter(
            (m) => m.chatroom_id === r.id && m.sender_id !== user.id && new Date(m.created_date).getTime() > since
          ).length;
          total += (offers || []).filter(
            (o) => o.chatroom_id === r.id && offerIsIncoming(o, user.id) && new Date(o.created_date).getTime() > since
          ).length;
        });
        try {
          const notifs = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 50);
          total += (notifs || []).filter((n) => !n.read).length;
        } catch {}
        if (!cancelled) setCount(total);
      } catch {} finally {
        inFlight = false;
      }
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
      if (event.type === "create" && roomIds.current.has(m.chatroom_id)) {
        maybeBeep();
        // Bump the badge instantly when a message lands in one of my rooms
        // and I'm not currently viewing that exact conversation.
        if (!window.location.pathname.startsWith("/chat/" + m.chatroom_id)) {
          setCount((c) => c + 1);
        }
      }
      schedule();
    });

    const unsubO = base44.entities.Offer.subscribe((event) => {
      const o = event && event.data;
      if (!o) return;
      if (event.type === "create" && offerIsIncoming(o, user.id) && roomIds.current.has(o.chatroom_id)) {
        maybeBeep();
        if (!window.location.pathname.startsWith("/chat/" + o.chatroom_id)) {
          setCount((c) => c + 1);
        }
      }
      schedule();
    });

    // Recompute when rooms change (new chat created, or last-seen updated by the other party).
    const unsubR = base44.entities.ChatRoom.subscribe((event) => {
      if (!event || !event.data) return;
      if (event.type === "create" || event.type === "update") schedule();
    });

    // Offer accept/reject/counter/modify and "sold" alerts arrive as Notification records.
    const unsubN = base44.entities.Notification.subscribe((event) => {
      const n = event && event.data;
      if (!n || n.user_id !== user.id) return;
      if (event.type === "create") {
        const onNotifs = window.location.pathname.startsWith("/notifications");
        if (!onNotifs) {
          maybeBeep();
          setCount((c) => c + 1);
        }
      }
      schedule();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (unsubM) unsubM();
      if (unsubO) unsubO();
      if (unsubR) unsubR();
      if (unsubN) unsubN();
    };
  }, [user]);

  return count;
}