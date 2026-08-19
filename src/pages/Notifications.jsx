import React from "react";
import { Bell, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import useNotifications from "@/hooks/useNotifications";
import NotificationItem from "@/components/NotificationItem";

export default function Notifications() {
  const { lang } = useStore();
  const t = useT();
  const { items, loading, clearAll, markNotifRead } = useNotifications();

  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">{t("notifications")}</h1>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Trash2 size={15} />
            {t("clearAllNotifs")}
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-center py-16">
          <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell size={36} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} onMarkRead={markNotifRead} />
          ))}
        </div>
      )}
    </div>
  );
}