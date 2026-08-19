import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import useUnreadChats from "@/hooks/useUnreadChats";
import NotificationsPanel from "@/components/NotificationsPanel";

export default function NotificationsDropdown() {
  const unread = useUnreadChats();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}