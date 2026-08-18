import React from "react";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useT } from "@/lib/i18n";
import useUnreadChats from "@/hooks/useUnreadChats";

export default function BottomNav() {
  const t = useT();
  const unread = useUnreadChats();
  const nav = useNavigate();
  const location = useLocation();
  const items = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/search", icon: Search, label: t("search") },
    { to: "/sell", icon: Plus, label: t("sell"), center: true },
    { to: "/chats", icon: MessageCircle, label: t("chats"), badge: unread },
    { to: "/profile", icon: User, label: t("profile") },
  ];

  // Tapping the already-active tab resets it to its root (iOS-style: pop to root + scroll to top).
  const go = (to) => {
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      nav(to);
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto grid grid-cols-5 h-16">
        {items.map((it) => {
          const active = location.pathname === it.to;
          return it.center ? (
            <div key={it.to} className="flex items-center justify-center">
              <button
                onClick={() => go(it.to)}
                className="-mt-6 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transition active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={26} />
              </button>
            </div>
          ) : (
            <button
              key={it.to}
              onClick={() => go(it.to)}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <span className="relative">
                <it.icon size={22} strokeWidth={active ? 2.5 : 2} />
                {!!it.badge && (
                  <span className="absolute -top-1.5 -end-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </span>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}