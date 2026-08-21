import React, { useEffect, useState } from "react";
import { Package, Eye, TrendingUp, Star, CheckCircle, MessageSquare, Heart, BarChart3 } from "lucide-react";
import Price from "@/components/Price";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { base44 } from "@/api/base44Client";

export default function SellerDashboard({ myListings, ratings }) {
  const { lang, user } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [chatCounts, setChatCounts] = useState({});
  const [loadingChats, setLoadingChats] = useState(false);

  // One batched query for every listing's chat rooms — avoids an N+1 of
  // ChatRoom.filter per item. Counts unique rooms per item_id.
  useEffect(() => {
    const ids = (myListings || []).map((it) => it.id).filter(Boolean);
    if (!ids.length) { setChatCounts({}); return; }
    let alive = true;
    setLoadingChats(true);
    base44.entities.ChatRoom.filter({ item_id: { $in: ids } }, "-created_date", 500)
      .then((rooms) => {
        if (!alive) return;
        const map = {};
        (rooms || []).forEach((r) => { if (r.item_id) map[r.item_id] = (map[r.item_id] || 0) + 1; });
        setChatCounts(map);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingChats(false); });
    return () => { alive = false; };
  }, [myListings]);

  const active = myListings.filter((it) => it.status !== "sold");
  const sold = myListings.filter((it) => it.status === "sold");
  const totalViews = myListings.reduce((s, it) => s + (Number(it.views) || 0), 0);
  const totalChats = Object.values(chatCounts).reduce((s, n) => s + n, 0);
  const totalFavs = myListings.reduce((s, it) => s + Math.max(0, Number(it.favorites_count) || 0), 0);
  const revenue = sold.reduce((s, it) => s + (Number(it.price) || 0), 0);
  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : user?.rating?.toFixed(1) || "5.0";
  const conversion = myListings.length ? Math.round((sold.length / myListings.length) * 100) : 0;

  const stats = [
    { icon: Package, label: t("activeListings"), value: active.length, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
    { icon: CheckCircle, label: t("soldItems"), value: sold.length, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { icon: Eye, label: t("totalViews"), value: totalViews, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { icon: Star, label: t("rating"), value: avg, color: "text-rose-600 bg-rose-50 dark:bg-rose-950" },
  ];

  const sorted = [...myListings].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));

  return (
    <div className="rounded-3xl bg-card border border-border/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> {t("sellerDashboard")}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-muted/50 p-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <p className="font-extrabold text-lg leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-3.5">
        <div>
          <p className="text-xs text-muted-foreground">{t("totalRevenue")}</p>
          <p className="font-extrabold text-lg text-emerald-700 dark:text-emerald-300"><Price value={revenue} lang={lang} /></p>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted-foreground">{t("conversionRate")}</p>
          <p className="font-extrabold text-lg">{conversion}%</p>
        </div>
      </div>

      {myListings.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-1.5"><BarChart3 size={15} className="text-primary" /> {t("perListingStats")}</h3>
          <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
            {sorted.map((it) => {
              const chats = chatCounts[it.id] || 0;
              const favs = Math.max(0, Number(it.favorites_count) || 0);
              const isSold = it.status === "sold";
              return (
                <div key={it.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <Package size={16} className="w-full h-full flex items-center justify-center text-muted-foreground p-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{it.title}</p>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5" title={t("totalViews")}><Eye size={11} /> {Number(it.views) || 0}</span>
                      <span className="inline-flex items-center gap-0.5" title={t("chatsCount")}><MessageSquare size={11} /> {chats}</span>
                      <span className="inline-flex items-center gap-0.5" title={t("favoritesCount")}><Heart size={11} /> {favs}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${isSold ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                    {isSold ? (ar ? "مباع" : "Sold") : (ar ? "متاح" : "Live")}
                  </span>
                </div>
              );
            })}
            {loadingChats && <p className="text-[11px] text-muted-foreground text-center py-1">…</p>}
          </div>
        </div>
      )}
    </div>
  );
}