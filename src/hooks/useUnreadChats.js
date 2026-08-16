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
        const msgs = await base44.entities.Message.list("-created_date", 200);
        const unread = (msgs || []).filter(
          (m) => roomIds.current.has(m.chatroom_id) && m.sender_id !== user.id && toDate(m.created_date).getTime() > since
        ).length;
        if (!cancelled) setCount(unread);
      } catch {}
    };
    compute();

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      const m = event && event.data;
      if (!m || m.sender_id === user.id) return;
      if (!roomIds.current.has(m.chatroom_id)) return;
      if (window.location.pathname.startsWith("/chat/")) return;
      playBeep();
      setCount((c) => c + 1);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user, lastChatsSeen]);

  return count;
}