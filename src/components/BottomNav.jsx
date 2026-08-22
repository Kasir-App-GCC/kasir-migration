import React, { useEffect, useRef } from "react";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useT } from "@/lib/i18n";
import useUnreadChats from "@/hooks/useUnreadChats";
import { useStore, tabForPath } from "@/lib/store";

export default function BottomNav() {
  const t = useT();
  const unread = useUnreadChats();
  const nav = useNavigate();
  const location = useLocation();
  const { tabStack, setTabEntry } = useStore();

  const items = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/search", icon: Search, label: t("search") },
    { to: "/sell", icon: Plus, label: t("sell"), center: true },
    { to: "/chats", icon: MessageCircle, label: t("chats"), badge: unread },
    { to: "/profile", icon: User, label: t("profile") },
  ];

  // Live scroll position of the current page, kept in a ref (not state) so
  // scrolling never triggers re-renders.
  const scrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mirror tabStack into a ref so the route-change effect can read the latest
  // stored scroll for a tab without re-running on every tabStack update.
  const tabStackRef = useRef(tabStack);
  useEffect(() => { tabStackRef.current = tabStack; }, [tabStack]);

  // Track the tab/path we're coming from so we can save its last route + scroll
  // when leaving, and restore the scroll of the tab we're entering.
  const prevRef = useRef({ tab: tabForPath(location.pathname), pathname: location.pathname });

  useEffect(() => {
    const curTab = tabForPath(location.pathname);
    const prev = prevRef.current;
    // Leaving a tab → persist its last route + scroll position.
    if (prev.tab && prev.tab !== curTab) {
      setTabEntry(prev.tab, { route: prev.pathname, scrollY: scrollRef.current });
    }
    // Entering a tab → record its current route (preserve stored scrollY) and
    // best-effort restore the scroll position the user was at on that tab.
    if (curTab && curTab !== prev.tab) {
      setTabEntry(curTab, { route: location.pathname });
      const sy = tabStackRef.current[curTab]?.scrollY || 0;
      const apply = () => window.scrollTo({ top: sy, behavior: "auto" });
      requestAnimationFrame(apply);
      setTimeout(apply, 180);
    }
    prevRef.current = { tab: curTab, pathname: location.pathname };
  }, [location.pathname, setTabEntry]);

  // Tapping a tab restores its last known route; tapping the already-active
  // tab resets it to the root and scrolls to the top (iOS-style pop-to-root).
  const go = (to) => {
    const curTab = tabForPath(location.pathname);
    if (curTab === to) {
      setTabEntry(to, { route: to, scrollY: 0 });
      if (location.pathname !== to) nav(to);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } else {
      const entry = tabStackRef.current[to];
      nav(entry?.route || to);
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto grid grid-cols-5 h-16">
        {items.map((it) => {
          const active = tabForPath(location.pathname) === it.to;
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