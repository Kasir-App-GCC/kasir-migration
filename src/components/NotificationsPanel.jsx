import React from "react";
import { Bell, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import useNotifications from "@/hooks/useNotifications";
import NotificationItem from "@/components/NotificationItem";

export default function NotificationsPanel({ onClose }) {
  const { lang } = useStore();
  const t = useT();
  const { items, loading, clearAll, markNotifRead } = useNotifications();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute end-0 mt-1 z-50 w-[min(92vw,380px)] max-h-[70vh] rounded-2xl bg-background border border-border shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
          <span className="font-bold text-sm">{t("notifications")}</span>
          {items.length > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
              <Trash2 size={13} /> {t("clearAllNotifs")}
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center">
              <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">{t("noNotifications")}</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1.5">
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} onMarkRead={markNotifRead} onClick={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}