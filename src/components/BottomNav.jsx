import React from "react";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useT } from "@/lib/i18n";

export default function BottomNav() {
  const t = useT();
  const items = [
    { to: "/", icon: Home, label: t("home"), end: true },
    { to: "/search", icon: Search, label: t("search") },
    { to: "/sell", icon: Plus, label: t("sell"), center: true },
    { to: "/chats", icon: MessageCircle, label: t("chats") },
    { to: "/profile", icon: User, label: t("profile") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto grid grid-cols-5 h-16">
        {items.map((it) =>
          it.center ? (
            <div key={it.to} className="flex items-center justify-center">
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  `-mt-6 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transition active:scale-95 ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`
                }
              >
                <Plus size={26} />
              </NavLink>
            </div>
          ) : (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <it.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{it.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}