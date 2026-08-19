import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { playBeep } from "@/lib/beep";
import useUnreadChats from "@/hooks/useUnreadChats";
import useAdminPending from "@/hooks/useAdminPending";

// Bell badge = unread chats/offers (from useUnreadChats) + unread system
// notifications (sold / offer status / verification, etc.). This is what the
// notification bell shows, so system-only notifications still flag the bell
// without leaking into the chat tab badge.
export default function useUnreadBell() {
  const { user } = useStore();
  const chats = useUnreadChats();
  const admin = useAdminPending();
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    if (!user) { setNotifUnread(0); return; }
    let cancelled = false;
    let timer = null;

    const compute = async () => {
      try {
        const notifs = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 50);
        if (!cancelled) setNotifUnread((notifs || []).filter((n) => !n.read).length);
      } catch {}
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!cancelled) compute(); }, 400);
    };
    compute();

    const unsub = base44.entities.Notification.subscribe((event) => {
      const n = event && event.data;
      if (!n || n.user_id !== user.id) return;
      if (event.type === "create") {
        const onNotifs = window.location.pathname.startsWith("/notifications");
        if (!onNotifs) {
          playBeep();
          setNotifUnread((c) => c + 1);
        }
        return; // Optimistic bump is sufficient.
      }
      // Updates (mark as read) and deletes need a recompute to adjust the count.
      schedule();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (unsub) unsub();
    };
  }, [user]);

  return chats + notifUnread + (user?.role === "admin" ? admin.count : 0);
}