import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCategory, getCityName } from "@/lib/constants";
import { matchLocation } from "@/lib/location";
import Price from "@/components/Price";

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/60">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-2.5 space-y-2">
        <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export default function Home() {
  const { categories, subcategories } = useOutletContext();
  const { locationFilter, lang, prefs } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const featRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await base44.entities.Item.list("-created_date", 100);
        setItems(all || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((it) => {
    if (categories.length && !categories.includes(it.category)) return false;
    if (subcategories.length && !subcategories.includes(it.subcategory)) return false;
    if (!prefs.showSold && it.status === "sold") return false;
    return matchLocation(it, locationFilter);
  });
  const featured = [...items]
    .filter((it) => it.status !== "sold")
    .sort((a, b) => (Number(!!b.featured) - Number(!!a.featured)) || ((b.views || 0) - (a.views || 0)))
    .slice(0, 30);
  const showFeatured = categories.length === 0 && featured.length > 0;

  return (
    <div className="space-y-5 pt-2">
      {showFeatured && (
        <section className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-700 dark:to-slate-900 text-white p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-1.5">
                <Sparkles size={18} /> {t("featuredStrip")}
              </h2>
              <p className="text-white/70 text-xs">{t("featuredStripDesc")}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => featRef.current?.scrollBy({ left: -280, behavior: "smooth" })} className="absolute start-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center">
              <ChevronLeft size={18} className="rtl:rotate-180" />
            </button>
            <button onClick={() => featRef.current?.scrollBy({ left: 280, behavior: "smooth" })} className="absolute end-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center">
              <ChevronRight size={18} className="rtl:rotate-180" />
            </button>
            <div ref={featRef} className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1 scroll-smooth">
              {featured.map((it) => (
                <div
                  key={it.id}
                  onClick={() => nav(`/item/${it.id}`)}
                  className="shrink-0 w-32 cursor-pointer"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white/10">
                    <img src={it.images?.[0]} alt={it.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold mt-1.5 line-clamp-1">{it.title}</p>
                  <p className="text-[11px] font-bold text-amber-300"><Price value={it.price} lang={lang} /></p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-lg">
          {categories.length === 1
            ? (lang === "ar" ? getCategory(categories[0]).ar : getCategory(categories[0]).en)
            : t("newArrivals")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {filtered.length} {t("items")}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-semibold">{t("emptyFeed")}</p>
          <p className="text-sm mt-1">{t("emptyFeedDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((it) => (
            <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}