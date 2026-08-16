import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

export default function useUnreadChats() {
  const { user, lastChatsSeen } = useStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rooms = await base44.entities.ChatRoom.list("-updated_date", 100);
        const mineIds = new Set(
          (rooms || [])
            .filter((r) => r.buyer_id === user.id || r.seller_id === user.id)
            .map((r) => r.id)
        );
        const msgs = await base44.entities.Message.list("-created_date", 200);
        const since = lastChatsSeen ? new Date(lastChatsSeen).getTime() : 0;
        const unread = (msgs || []).filter(
          (m) =>
            mineIds.has(m.chatroom_id) &&
            m.sender_id !== user.id &&
            new Date(m.created_date).getTime() > since
        );
        if (!cancelled) setCount(unread.length);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, lastChatsSeen]);

  return count;
}