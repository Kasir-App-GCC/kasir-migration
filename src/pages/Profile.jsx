import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Star, Heart, Tag, Sun, Moon, Monitor, LogOut, ChevronRight, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";
import RatingStars from "@/components/RatingStars";
import { formatPrice, timeAgo } from "@/lib/format";

export default function Profile() {
  const { user, lang, setLang, theme, setTheme, logout, favorites, prefs, setPrefs, clearFavorites } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [tab, setTab] = useState("listings");
  const [items, setItems] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const all = await base44.entities.Item.list("-created_date", 100);
        setItems((all || []).filter((it) => it.seller_id === user.id));
        const rs = await base44.entities.Rating.filter({ rated_user_id: user.id }, "-created_date", 50);
        setRatings(rs || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const myListings = items;
  const saved = items.filter((it) => favorites.includes(it.id)); // subset from loaded; fine for demo

  const deleteListing = async (id) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      await base44.entities.Item.delete(id);
      setItems(items.filter((x) => x.id !== id));
    } catch {}
  };
  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : user?.rating?.toFixed(1) || "5.0";

  if (!user) return null;

  return (
    <div className="pt-3 space-y-5">
      {/* Profile header */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30 shrink-0">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Tag size={28} className="w-full h-full flex items-center justify-center p-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{user.name}</h1>
            <div className="flex items-center gap-1.5 text-sm mt-0.5">
              <Star size={14} className="fill-amber-300 text-amber-300" />
              <span className="font-bold">{avg}</span>
              <span className="opacity-70">· {ratings.length || user.ratingsCount || 0} {t("ratings")}</span>
            </div>
            <p className="text-xs opacity-70 mt-0.5">{t("memberSince")} {new Date(user.joinedAt || Date.now()).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{myListings.length}</p>
            <p className="text-[11px] opacity-80">{t("myListings")}</p>
          </div>
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{favorites.length}</p>
            <p className="text-[11px] opacity-80">{t("savedItems")}</p>
          </div>
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{avg}</p>
            <p className="text-[11px] opacity-80">{t("rating")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-2xl">
        {[
          { id: "listings", label: t("myListings") },
          { id: "saved", label: t("savedItems") },
          { id: "reviews", label: t("reviews") },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === tb.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "listings" && (
        myListings.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {myListings.map((it) => (
              <div key={it.id} className="relative">
                <ItemCard item={it} onClick={() => nav(`/item/${it.id}`)} />
                <button
                  onClick={() => deleteListing(it.id)}
                  className="absolute top-2 end-2 z-30 w-8 h-8 rounded-full bg-rose-600 text-white shadow flex items-center justify-center hover:scale-110 transition"
                  title={t("deleteListing")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-semibold">{t("emptyFeed")}</p>
            <button onClick={() => nav("/sell")} className="mt-3 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">{t("postFirst")}</button>
          </div>
        )
      )}

      {tab === "saved" && (
        saved.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {saved.map((it) => <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Heart size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold">{t("noSaved")}</p>
          </div>
        )
      )}

      {tab === "reviews" && (
        <div className="space-y-2.5">
          {ratings.length ? ratings.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.rater_name || "—"}</span>
                <RatingStars value={r.score} size={14} />
              </div>
              {r.review && <p className="text-sm text-muted-foreground mt-1.5">{r.review}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(r.created_date, lang)}</p>
            </div>
          )) : (
            <div className="text-center py-16 text-muted-foreground">
              <Star size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">{t("noReviews")}</p>
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/60">
        <div className="p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Sun size={16} /> {t("settings")}: {t("systemTheme")}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light", icon: Sun, label: t("lightMode") },
              { id: "dark", icon: Moon, label: t("darkMode") },
              { id: "system", icon: Monitor, label: t("systemTheme") },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setTheme(o.id)}
                className={`py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 ${theme === o.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <o.icon size={16} /> {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold mb-3">{t("language")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLang("en")} className={`py-2.5 rounded-xl text-sm font-semibold ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t("english")}</button>
            <button onClick={() => setLang("ar")} className={`py-2.5 rounded-xl text-sm font-semibold ${lang === "ar" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t("arabic")}</button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Settings size={16} /> {t("preferences")}</p>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">{t("showSold")}</span>
            <button
              onClick={() => setPrefs({ showSold: !prefs.showSold })}
              className={`w-11 h-6 rounded-full p-0.5 transition ${prefs.showSold ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${prefs.showSold ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
            </button>
          </label>
          <div className="py-2">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span>{t("defaultRadius")}</span>
              <span className="text-muted-foreground">{prefs.defaultRadius} {t("km")}</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={prefs.defaultRadius}
              onChange={(e) => setPrefs({ defaultRadius: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
        <button onClick={() => { if (window.confirm(t("clearFavsConfirm"))) clearFavorites(); }} className="w-full p-4 flex items-center justify-between hover:bg-muted/50">
          <span className="flex items-center gap-2 text-sm font-semibold"><Trash2 size={18} /> {t("clearFavorites")}</span>
          <ChevronRight size={18} className="text-muted-foreground rtl:rotate-180" />
        </button>
        <button onClick={() => logout()} className="w-full p-4 flex items-center justify-between hover:bg-muted/50">
          <span className="flex items-center gap-2 text-rose-600 font-semibold text-sm"><LogOut size={18} /> {t("logout")}</span>
          <ChevronRight size={18} className="text-muted-foreground rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}