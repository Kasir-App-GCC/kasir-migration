import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Sparkles, ShoppingBag, Map as MapIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCategory, getCityName } from "@/lib/constants";
import { matchLocation } from "@/lib/location";

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
  const { locationFilter, lang, prefs, country } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (subcategories.length && !(Array.isArray(it.subcategory) ? it.subcategory.some((s) => subcategories.includes(s)) : subcategories.includes(it.subcategory))) return false;
    if (!prefs.showSold && it.status === "sold") return false;
    return matchLocation(it, locationFilter, country);
  });
  const now = Date.now();
  const featured = items.filter((it) => {
    if (!it.featured || it.status === "sold") return false;
    if (it.featured_until && new Date(it.featured_until).getTime() < now) return false;
    // Per-country: show only items featured in the browsing country,
    // unless the seller paid for the cross-country option.
    if (it.country === country) return true;
    if (it.featured_cross_country) return true;
    return false;
  }).slice(0, 30);
  const showFeatured = categories.length === 0 && featured.length > 0;

  return (
    <div className="space-y-5 pt-2">
      {/* AI Shopping Assistant button */}
      <button
        onClick={() => nav("/assistant")}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition"
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <ShoppingBag size={20} />
        </div>
        <div className="flex-1 text-start">
          <p className="font-bold text-sm leading-tight">
            {lang === "ar" ? "مساعد التسوق الذكي" : "AI Shopping Assistant"}
          </p>
          <p className="text-xs text-white/80 leading-tight mt-0.5">
            {lang === "ar" ? "اوصف اللي تبيه وأساعدك تلاقيه" : "Describe what you need and I'll find it"}
          </p>
        </div>
        <Sparkles size={18} className="shrink-0" />
      </button>

      {showFeatured && <FeaturedCarousel items={featured} onOpen={(iid) => nav(`/item/${iid}`)} />}

      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-lg">
          {categories.length === 1
            ? (lang === "ar" ? getCategory(categories[0]).ar : getCategory(categories[0]).en)
            : t("newArrivals")}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{filtered.length} {t("items")}</span>
          <button
            onClick={() => nav("/map")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/70 text-sm font-semibold transition"
          >
            <MapIcon size={16} /> {lang === "ar" ? "الخريطة" : "Map"}
          </button>
        </div>
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