import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import useUnreadBell from "@/hooks/useUnreadBell";
import NotificationsPanel from "@/components/NotificationsPanel";

export default function NotificationsDropdown() {
  const unread = useUnreadBell();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const ref = useRef(null);

  // Position the panel just below the bell, aligned to its end edge, but
  // clamped to the viewport so it never overflows the screen edge.
  const computePos = () => {
    if (!ref.current) return null;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const panelW = Math.min(Math.round(vw * 0.92), 380);
    const isRTL = getComputedStyle(ref.current).direction === "rtl";
    let left = isRTL ? r.left : r.right - panelW;
    left = Math.max(8, Math.min(left, vw - panelW - 8));
    return { left, top: r.bottom + 6, width: panelW };
  };

  const openPanel = () => {
    setPanelPos(computePos());
    setOpen(true);
  };

  // Keep it attached to the bell if the viewport changes while open.
  useEffect(() => {
    if (!open) return;
    const onResize = () => setPanelPos(computePos());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
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
      {open && <NotificationsPanel onClose={() => setOpen(false)} style={panelPos} />}
    </div>
  );
}