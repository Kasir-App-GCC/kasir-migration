import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

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
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        roomIds.current = new Set(mine.map((r) => r.id));
        const msgs = await base44.entities.Message.list("-created_date", 200);
        const since = lastChatsSeen ? new Date(lastChatsSeen).getTime() : 0;
        const unread = (msgs || []).filter(
          (m) =>
            roomIds.current.has(m.chatroom_id) &&
            m.sender_id !== user.id &&
            new Date(m.created_date).getTime() > since
        );
        if (!cancelled) setCount(unread.length);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type !== "create") return;
      const m = event.data;
      if (!m || !user) return;
      if (m.sender_id === user.id) return;
      if (!roomIds.current.has(m.chatroom_id)) return;
      // don't beep if the user is already inside that conversation
      if (window.location.pathname === `/chat/${m.chatroom_id}`) return;
      setCount((c) => c + 1);
      playBeep();
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user, lastChatsSeen]);

  return count;
}