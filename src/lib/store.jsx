import React, { createContext, useContext, useState, useEffect } from "react";
import { useT } from "./i18n";

const StoreContext = createContext(null);

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
];

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem("souqi_user");
    return s ? JSON.parse(s) : null;
  });
  const [theme, setThemeState] = useState(() => localStorage.getItem("souqi_theme") || "system");
  const [lang, setLangState] = useState(() => localStorage.getItem("souqi_lang") || "en");
  const [favorites, setFavorites] = useState(() => {
    const s = localStorage.getItem("souqi_favs");
    return s ? JSON.parse(s) : [];
  });
  const [pendingOtp, setPendingOtp] = useState(null);
  const [pendingPhone, setPendingPhone] = useState(null);
  const [locationFilter, setLocationFilter] = useState(() => {
    const s = localStorage.getItem("souqi_loc");
    return s ? JSON.parse(s) : { mode: "city", city: null, radius: 25 };
  });

  // Theme application
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
  useEffect(() => {
    if (user) localStorage.setItem("souqi_user", JSON.stringify(user));
    else localStorage.removeItem("souqi_user");
  }, [user]);

  const setTheme = (t) => setThemeState(t);
  const setLang = (l) => setLangState(l);
  const toggleFavorite = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const sendOtp = (phone) => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setPendingOtp(code);
    setPendingPhone(phone);
    return code;
  };

  const verifyOtp = (code) => {
    if (!pendingOtp || String(code) !== String(pendingOtp)) return false;
    const u = {
      id: "u_" + pendingPhone,
      name: lang === "ar" ? "مستخدم جديد" : "New Member",
      phone: pendingPhone,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      rating: 5.0,
      ratingsCount: 0,
      joinedAt: new Date().toISOString(),
    };
    setUser(u);
    setPendingOtp(null);
    setPendingPhone(null);
    return true;
  };

  const loginProvider = (provider) => {
    const u = {
      id: "u_" + provider,
      name: provider === "google" ? "Google User" : "Apple User",
      phone: null,
      provider,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      rating: 4.8,
      ratingsCount: 12,
      joinedAt: new Date().toISOString(),
    };
    setUser(u);
  };

  const logout = () => setUser(null);

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        theme,
        setTheme,
        lang,
        setLang,
        favorites,
        toggleFavorite,
        locationFilter,
        setLocationFilter,
        sendOtp,
        verifyOtp,
        loginProvider,
        logout,
        pendingPhone,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);