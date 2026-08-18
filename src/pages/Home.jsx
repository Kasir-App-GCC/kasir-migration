import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const PAGE_SIZE = 100;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const skipRef = useRef(0);
  const sentinelRef = useRef(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    skipRef.current = 0;
    setHasMore(true);
    try {
      const first = await base44.entities.Item.filter({ country }, "-created_date", PAGE_SIZE, 0);
      const list = first || [];
      setItems(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [country]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const skip = skipRef.current + PAGE_SIZE;
    skipRef.current = skip; // reserve the page synchronously so self-heal can't wipe it
    try {
      const next = await base44.entities.Item.filter({ country }, "-created_date", PAGE_SIZE, skip);
      const list = next || [];
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...list.filter((x) => !seen.has(x.id))];
      });
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      skipRef.current = skip - PAGE_SIZE; // roll back on failure
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, country]);

  useEffect(() => {
    loadInitial();
    // Keep the feed live: apply any item change in-place as it happens.
    const unsub = base44.entities.Item.subscribe((event) => {
      if (!event) return;
      const it = event.data;
      if (event.type === "delete") {
        setItems((prev) => prev.filter((x) => x.id !== it?.id));
      } else if (it) {
        setItems((prev) => {
          const idx = prev.findIndex((x) => x.id === it.id);
          if (idx === -1) return [it, ...prev];
          const copy = [...prev]; copy[idx] = it; return copy;
        });
      }
    });
    // Self-heal only while idle on the first page, so deep pagination isn't wiped.
    const onFocus = () => { if (skipRef.current === 0 && !loadingMore) loadInitial(); };
    const onVis = () => { if (!document.hidden && skipRef.current === 0 && !loadingMore) loadInitial(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      unsub?.();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadInitial]);

  // Infinite scroll: fetch the next page when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

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
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />
            ))}
          </div>
          <div ref={sentinelRef} className="flex flex-col items-center justify-center py-6 gap-3">
            {loadingMore ? (
              <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : hasMore ? (
              <button
                onClick={loadMore}
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition"
              >
                {lang === "ar" ? "تحميل المزيد" : "Load more"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">{t("endOfFeed") || (lang === "ar" ? "لا مزيد من الإعلانات" : "No more listings")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}