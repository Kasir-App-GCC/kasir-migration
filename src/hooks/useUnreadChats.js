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
  const prev = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (!user) {
      setCount(0);
      prev.current = 0;
      first.current = true;
      return;
    }
    let cancelled = false;

    const compute = async () => {
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mine = (rooms || []).filter((r) => r.buyer_id === user.id || r.seller_id === user.id);
        const roomIds = new Set(mine.map((r) => r.id));
        const msgs = await base44.entities.Message.list("-created_date", 200);
        const since = lastChatsSeen ? new Date(lastChatsSeen).getTime() : 0;
        const next = (msgs || []).filter(
          (m) => roomIds.has(m.chatroom_id) && m.sender_id !== user.id && toDate(m.created_date).getTime() > since
        ).length;
        if (cancelled) return;
        if (next > prev.current && !first.current && !window.location.pathname.startsWith("/chat/")) {
          playBeep();
        }
        first.current = false;
        prev.current = next;
        setCount(next);
      } catch {}
    };

    compute();
    const iv = setInterval(compute, 8000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [user, lastChatsSeen]);

  return count;
}