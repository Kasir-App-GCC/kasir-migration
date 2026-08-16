import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

const StoreContext = createContext(null);

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
    return s ? JSON.parse(s) : { showSold: true, defaultRadius: 25 };
  });
  const [lastChatsSeen, setLastChatsSeenState] = useState(() => localStorage.getItem("souqi_chats_seen") || null);

  // The signed-in user comes from the platform's built-in auth (Google / etc.)
  const user = auth.user
    ? {
        id: auth.user.id,
        name: auth.user.full_name || auth.user.email || "Member",
        email: auth.user.email,
        avatar: auth.user.avatar || null,
        joinedAt: auth.user.created_date,
        rating: 5.0,
        ratingsCount: 0,
      }
    : null;

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

  const setTheme = (t) => setThemeState(t);
  const setLang = (l) => setLangState(l);
  const toggleFavorite = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const setPrefs = (patch) => setPrefsState((p) => ({ ...p, ...patch }));
  const clearFavorites = () => setFavorites([]);
  const setLastChatsSeen = (val) => setLastChatsSeenState(val);
  const logout = () => auth.logout(true);

  return (
    <StoreContext.Provider
      value={{
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
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);