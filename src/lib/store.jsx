import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { base44Analytics } from "@/lib/analytics";

const StoreContext = createContext(null);

// The five bottom-navigation tabs. Each tab remembers its last route and scroll
// position so tapping a tab restores where the user left off, and tapping the
// active tab pops back to its root (iOS-style).
export const TAB_ROOTS = ["/", "/search", "/sell", "/chats", "/profile"];

// Maps any route to the main tab it belongs to. Routes reachable from several
// tabs (e.g. /item/:id, /admin) return null so they don't hijack a tab's stack.
export function tabForPath(pathname) {
  if (!pathname) return null;
  if (pathname === "/") return "/";
  if (pathname.startsWith("/search") || pathname.startsWith("/map")) return "/search";
  if (pathname.startsWith("/sell") || pathname.startsWith("/edit/")) return "/sell";
  if (pathname.startsWith("/chats") || pathname.startsWith("/chat/")) return "/chats";
  if (pathname.startsWith("/profile") || pathname.startsWith("/user/") || pathname.startsWith("/notifications") || pathname.startsWith("/assistant") || pathname.startsWith("/buy-requests")) return "/profile";
  return null;
}

export function StoreProvider({ children }) {
  const auth = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem("souqi_theme") || "system");
  const [lang, setLangState] = useState(() => localStorage.getItem("souqi_lang") || "en");
  const [favorites, setFavorites] = useState(() => {
    const s = localStorage.getItem("souqi_favs");
    return s ? JSON.parse(s) : [];
  });
  const [locationFilter, setLocationFilter] = useState(() => {
    const s = localStorage.getItem("souqi_loc");
    return s ? JSON.parse(s) : { mode: "city", city: null, radius: 25 };
  });
  const [prefs, setPrefsState] = useState(() => {
    const s = localStorage.getItem("souqi_prefs");
    return s ? JSON.parse(s) : { showSold: false, defaultRadius: 25 };
  });
  const [lastChatsSeen, setLastChatsSeenState] = useState(() => localStorage.getItem("souqi_chats_seen") || null);
  const [notifsClearedAt, setNotifsClearedAtState] = useState(() => localStorage.getItem("souqi_notifs_cleared") || null);
  const [country, setCountryState] = useState(() => localStorage.getItem("souqi_country") || "");
  const [tabStack, setTabStack] = useState(() => {
    let parsed = null;
    const s = localStorage.getItem("souqi_tabstack");
    if (s) { try { parsed = JSON.parse(s); } catch {} }
    const base = Object.fromEntries(TAB_ROOTS.map((r) => [r, { route: r, scrollY: 0 }]));
    return parsed ? { ...base, ...parsed } : base;
  });
  // Browse filters (category bar). Kept in the global store rather than
  // AppLayout state because AppLayout remounts on each route change (it lives
  // inside the animated motion.div keyed by pathname), which would reset a
  // local useState and lose the selection when navigating Home → Map.
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // The signed-in user comes from the platform's built-in auth (Google / etc.)
  const user = useMemo(() => auth.user
    ? {
        id: auth.user.id,
        name:
          [auth.user.first_name, auth.user.last_name].filter(Boolean).join(" ") ||
          auth.user.username ||
          auth.user.full_name ||
          auth.user.email ||
          "Member",
        username: auth.user.username || null,
        firstName: auth.user.first_name || null,
        lastName: auth.user.last_name || null,
        email: auth.user.email,
        avatar: auth.user.avatar || null,
        joinedAt: auth.user.created_date,
        rating: 5.0,
        ratingsCount: 0,
        whatsapp_enabled: !!auth.user.whatsapp_enabled,
        whatsapp_verified: !!auth.user.whatsapp_verified,
        whatsapp_number: auth.user.whatsapp_number || null,
        phone: auth.user.phone || null,
        phone_verified: !!auth.user.phone_verified,
        country_code: auth.user.country_code || null,
        country: auth.user.country || "SA",
        role: auth.user.role || "user",
        is_trusted: !!auth.user.is_trusted,
        interests: auth.user.interests || [],
        re_license_status: auth.user.re_license_status || null,
        re_license_type: auth.user.re_license_type || null,
        re_license_number: auth.user.re_license_number || null,
        re_license_holder: auth.user.re_license_holder || null,
        re_license_expiry: auth.user.re_license_expiry || null,
        re_license_link: auth.user.re_license_link || null,
        re_license_doc: auth.user.re_license_doc || null,
      }
    : null, [auth.user]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (t) => {
      const isDark =
        t === "dark" ||
        (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
    };
    apply(theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("souqi_lang", lang);
  }, [lang]);

  useEffect(() => localStorage.setItem("souqi_theme", theme), [theme]);
  useEffect(() => localStorage.setItem("souqi_favs", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("souqi_loc", JSON.stringify(locationFilter)), [locationFilter]);
  useEffect(() => localStorage.setItem("souqi_prefs", JSON.stringify(prefs)), [prefs]);
  useEffect(() => { if (lastChatsSeen) localStorage.setItem("souqi_chats_seen", lastChatsSeen); }, [lastChatsSeen]);
  useEffect(() => {
    if (notifsClearedAt) localStorage.setItem("souqi_notifs_cleared", notifsClearedAt);
    else localStorage.removeItem("souqi_notifs_cleared");
  }, [notifsClearedAt]);

  useEffect(() => {
    if (!country && auth.user?.country) setCountryState(auth.user.country);
  }, [auth.user, country]);
  useEffect(() => {
    if (country) localStorage.setItem("souqi_country", country);
  }, [country]);
  useEffect(() => localStorage.setItem("souqi_tabstack", JSON.stringify(tabStack)), [tabStack]);

  const setTheme = useCallback((t) => setThemeState(t), []);
  const setLang = useCallback((l) => setLangState(l), []);
  // Read favorites from a ref so toggleFavorite's identity is stable (depends
  // only on user.id) — a heart tap no longer recreates the store value and
  // re-render every component reading the store.
  const favoritesRef = useRef(favorites);
  useEffect(() => { favoritesRef.current = favorites; }, [favorites]);
  const toggleFavorite = useCallback((id) => {
    const isFav = favoritesRef.current.includes(id);
    setFavorites((f) => (isFav ? f.filter((x) => x !== id) : [...f, id]));
    // Best-effort per-listing save count for the seller analytics dashboard.
    base44.entities.Item.updateMany({ id }, { $inc: { favorites_count: isFav ? -1 : 1 } }).catch(() => {});
    // Keep a server-side Favorite record so price-drop alerts can reach savers.
    if (user?.id) {
      if (isFav) base44.entities.Favorite.deleteMany({ user_id: user.id, item_id: id }).catch(() => {});
      else { base44.entities.Favorite.create({ user_id: user.id, item_id: id }).catch(() => {}); base44Analytics.favoriteAdded(id); }
    }
  }, [user?.id]);
  const setPrefs = useCallback((patch) => setPrefsState((p) => ({ ...p, ...patch })), []);
  const clearFavorites = useCallback(() => setFavorites([]), []);
  const setLastChatsSeen = useCallback((val) => setLastChatsSeenState(val), []);
  const setNotifsClearedAt = useCallback((val) => setNotifsClearedAtState(val), []);
  const setCountry = useCallback((c) => {
    setCountryState(c);
    setLocationFilter({ mode: "city", city: null, radius: 25 });
  }, []);
  const setTabEntry = useCallback((tab, entry) => {
    setTabStack((s) => (s[tab] ? { ...s, [tab]: { ...s[tab], ...entry } } : s));
  }, []);
  const logout = useCallback(() => auth.logout(true), [auth]);

  const value = useMemo(() => ({
    user,
    theme,
    setTheme,
    lang,
    setLang,
    favorites,
    toggleFavorite,
    locationFilter,
    setLocationFilter,
    prefs,
    setPrefs,
    clearFavorites,
    lastChatsSeen,
    setLastChatsSeen,
    notifsClearedAt,
    setNotifsClearedAt,
    country: country || "SA",
    setCountry,
    tabStack,
    setTabEntry,
    categories,
    setCategories,
    subcategories,
    setSubcategories,
    logout,
  }), [user, theme, setTheme, lang, setLang, favorites, toggleFavorite, locationFilter, prefs, setPrefs, clearFavorites, lastChatsSeen, setLastChatsSeen, notifsClearedAt, setNotifsClearedAt, country, setCountry, tabStack, setTabEntry, categories, subcategories, logout]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);

// Vite HMR re-executes this module on edit, creating a NEW StoreContext
// instance. Already-mounted components still hold the OLD context reference,
// so useContext returns null for them (the "Cannot destructure 'user'/'lang'
// of useStore() as null" errors). Force a full reload on store changes so the
// provider and consumers stay in sync. Dev-only; no-op in production.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload());
}