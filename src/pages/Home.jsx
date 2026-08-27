import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Sparkles, ShoppingBag, Map as MapIcon, Eye, EyeOff, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCategory, getCityName } from "@/lib/constants";
import { matchLocation } from "@/lib/location";
import { fetchSellerInfos } from "@/lib/useTrusted";
import { readFeedCache, writeFeedCache, FEED_STALE_MS } from "@/lib/feedCache";
import PullToRefresh from "@/components/PullToRefresh";
import RecentlyViewed from "@/components/RecentlyViewed";
import FeaturedCarouselSkeleton from "@/components/FeaturedCarouselSkeleton";

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
  const { locationFilter, lang, prefs, setPrefs, country, user } = useStore();
  const t = useT();
  const nav = useNavigate();
  const PAGE_SIZE = 60;
  const cacheKey = `home:${country}`;
  const [items, setItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [sponsoredItems, setSponsoredItems] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsRef = useRef([]);
  const sentinelRef = useRef(null);
  const refreshingRef = useRef(false);

  // Cursor (keyset) pagination: fetch items older than the oldest loaded
  // created_date. More reliable than offset — no duplicate/shift when new
  // listings arrive mid-browse (what OfferUp uses).
  const fetchPage = useCallback(async (cursor) => {
    const query = { country, archived: { $ne: true }, review_status: { $nin: ["pending", "rejected"] }, status: { $ne: "draft" } };
    if (cursor) query.created_date = { $lt: cursor };
    return base44.entities.Item.filter(query, "-created_date", PAGE_SIZE);
  }, [country]);

  // silent = stale-while-revalidate: prepend only items newer than the newest
  // loaded one (no scroll jump, no cards disappearing). non-silent = cold
  // start / pull-to-refresh: replace page 1.
  const refresh = useCallback(async (silent) => {
    if (silent && refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const list = await fetchPage(null);
      const ids = [...new Set(list.map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await fetchSellerInfos(ids) : {};
      setSellers((prev) => ({ ...prev, ...sMap }));
      if (silent && itemsRef.current.length) {
        const newest = itemsRef.current[0]?.created_date;
        const existing = new Set(itemsRef.current.map((x) => x.id));
        const fresh = newest
          ? list.filter((i) => new Date(i.created_date) > new Date(newest) && !existing.has(i.id))
          : list.filter((i) => !existing.has(i.id));
        if (fresh.length) setItems((prev) => [...fresh, ...prev]);
      } else {
        setItems(list);
        setHasMore(list.length === PAGE_SIZE);
      }
    } catch {
      if (!silent) { setItems([]); setHasMore(false); }
    } finally {
      refreshingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [fetchPage]);

  // Featured listings are fetched independently of the feed page so the
  // paid carousel works even with a small feed page size — a boosted but
  // older listing (low created_date) would otherwise never reach the top
  // of the feed. Sorted by featured_until so the longest-remaining boosts
  // surface first; country/cross-country filtering is applied client-side.
  // Featured listings are read from a precomputed fair-sample cache
  // (FeaturedRotation) refreshed every ~15 min by a scheduled workflow that
  // reservoir-samples across ALL active boosts — so the carousel scales to
  // any number of concurrent boosts (10K+) without fetching them all on
  // every page load. The viewer's own active boosts are always merged in so
  // a paying seller sees their own card even if it wasn't sampled this window.
  const loadFeatured = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      const rotation = await base44.entities.FeaturedRotation.filter({ country }, "-updated_date", 1);
      const sampleIds = (rotation && rotation[0]?.sample_ids) || [];
      let ownIds = [];
      if (user?.id) {
        const own = await base44.entities.Item.filter({ seller_id: user.id, featured: true, featured_until: { $gt: nowIso } }, "-featured_until", 20);
        ownIds = (own || []).map((i) => i.id);
      }
      const allIds = [...new Set([...ownIds, ...sampleIds])].slice(0, 150);
      let list = [];
      if (allIds.length) {
        list = await base44.entities.Item.filter({ id: { $in: allIds }, featured_until: { $gt: nowIso }, archived: { $ne: true }, review_status: { $nin: ["pending", "rejected"] } }, "-featured_until", 150);
      }
      const ids = [...new Set((list || []).map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await fetchSellerInfos(ids) : {};
      setSellers((prev) => ({ ...prev, ...sMap }));
      setFeaturedItems(list || []);
    } catch {
      setFeaturedItems([]);
    } finally {
      setFeaturedLoaded(true);
    }
  }, [country, user?.id]);

  // Admin-sponsored listings are fetched independently and pinned to the
  // top of the grid regardless of their created_date. Only active sponsorships
  // (admin_sponsored_until in the future) are returned, so expired ones drop
  // back to normal ordering automatically.
  const loadSponsored = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      const list = await base44.entities.Item.filter({
        admin_sponsored: true,
        admin_sponsored_until: { $gt: nowIso },
        country,
        archived: { $ne: true },
        review_status: { $nin: ["pending", "rejected"] },
        status: { $ne: "draft" },
      }, "-admin_sponsored_until", 50);
      const ids = [...new Set((list || []).map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await fetchSellerInfos(ids) : {};
      setSellers((prev) => ({ ...prev, ...sMap }));
      setSponsoredItems(list || []);
    } catch {
      setSponsoredItems([]);
    }
  }, [country]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const oldest = itemsRef.current[itemsRef.current.length - 1]?.created_date;
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const next = await fetchPage(oldest);
      const list = next || [];
      const ids = [...new Set(list.map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await fetchSellerInfos(ids) : {};
      setSellers((prev) => ({ ...prev, ...sMap }));
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...list.filter((x) => !seen.has(x.id))];
      });
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchPage]);

  // Keep a ref of loaded items for the cursor + SWR prepend (avoids stale state).
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Persist the feed snapshot so returning from an item detail page renders
  // instantly from cache (stale-while-revalidate).
  useEffect(() => {
    if (items.length || featuredItems.length) {
      writeFeedCache(cacheKey, { items, featured: featuredItems, sellers });
    }
  }, [items, featuredItems, sellers, cacheKey]);

  useEffect(() => {
    const cached = readFeedCache(cacheKey);
    if (cached) {
      setItems(cached.items || []);
      setFeaturedItems(cached.featured || []);
      setSellers(cached.sellers || {});
      setHasMore((cached.items || []).length >= PAGE_SIZE);
      setLoading(false);
      refresh(true);   // background SWR refresh
      loadFeatured(); loadSponsored();
    } else {
      setLoading(true);
      refresh(false);
      loadFeatured(); loadSponsored();
    }
    // Keep the feed live: apply any item change in-place as it happens.
    const unsub = base44.entities.Item.subscribe((event) => {
      if (!event) return;
      const it = event.data;
      const isSpon = (x) => !!x?.admin_sponsored && (!x.admin_sponsored_until || new Date(x.admin_sponsored_until).getTime() > Date.now());
      if (event.type === "delete") {
        setItems((prev) => prev.filter((x) => x.id !== it?.id));
        setFeaturedItems((prev) => prev.filter((x) => x.id !== it?.id));
        setSponsoredItems((prev) => prev.filter((x) => x.id !== it?.id));
      } else if (event.type === "create" && it) {
        setItems((prev) => [it, ...prev.filter((x) => x.id !== it.id)]);
        if (it.featured) setFeaturedItems((prev) => [it, ...prev.filter((x) => x.id !== it.id)]);
        if (isSpon(it)) setSponsoredItems((prev) => [it, ...prev.filter((x) => x.id !== it.id)]);
      } else if (it) {
        // Updates refresh an existing item in place — never prepend, so
        // editing an old listing can't bump it to the top (no free boost).
        setItems((prev) => {
          const idx = prev.findIndex((x) => x.id === it.id);
          if (idx === -1) return prev;
          const copy = [...prev]; copy[idx] = it; return copy;
        });
        // Keep the featured carousel in sync: upsert while featured, drop when not.
        setFeaturedItems((prev) => {
          const idx = prev.findIndex((x) => x.id === it.id);
          if (it.featured) {
            if (idx === -1) return [it, ...prev];
            const copy = [...prev]; copy[idx] = it; return copy;
          }
          return idx === -1 ? prev : prev.filter((x) => x.id !== it.id);
        });
        // Keep the sponsored rail in sync: upsert while active, drop when not.
        setSponsoredItems((prev) => {
          const idx = prev.findIndex((x) => x.id === it.id);
          if (isSpon(it)) {
            if (idx === -1) return [it, ...prev];
            const copy = [...prev]; copy[idx] = it; return copy;
          }
          return idx === -1 ? prev : prev.filter((x) => x.id !== it.id);
        });
      }
    });
    // Only self-heal on focus when the cache is stale AND the user is near the
    // top — never wipe a deep-scroll session, never reload on every tab switch.
    const onFocus = () => {
      const cached = readFeedCache(cacheKey);
      if ((!cached || Date.now() - cached.ts > FEED_STALE_MS) && window.scrollY < 300) {
        refresh(true);
        loadFeatured(); loadSponsored();
      }
    };
    const onVis = () => { if (!document.hidden) onFocus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      unsub?.();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [cacheKey, refresh, loadFeatured, loadSponsored]);

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

  const filtered = useMemo(() => items.filter((it) => {
    if (categories.length && !categories.includes(it.category)) return false;
    if (subcategories.length && !(Array.isArray(it.subcategory) ? it.subcategory.some((s) => subcategories.includes(s)) : subcategories.includes(it.subcategory))) return false;
    if (!prefs.showSold && it.status === "sold") return false;
    return matchLocation(it, locationFilter, country);
  }), [items, categories, subcategories, prefs.showSold, locationFilter, country]);
  // Admin-sponsored items are pinned to the very top of the grid, ahead of the
  // normal created_date ordering, and de-duplicated against the regular feed.
  const sponsored = sponsoredItems.filter((it) => {
    if (!prefs.showSold && it.status === "sold") return false;
    if (it.admin_sponsored_until && new Date(it.admin_sponsored_until).getTime() < Date.now()) return false;
    if (it.country !== country) return false;
    if (categories.length && !categories.includes(it.category)) return false;
    if (subcategories.length && !(Array.isArray(it.subcategory) ? it.subcategory.some((s) => subcategories.includes(s)) : subcategories.includes(it.subcategory))) return false;
    return matchLocation(it, locationFilter, country);
  });
  const sponsoredIds = new Set(sponsored.map((it) => it.id));
  const ordered = useMemo(() => [...sponsored, ...filtered.filter((it) => !sponsoredIds.has(it.id))], [sponsored, filtered, sponsoredIds]);
  const now = Date.now();
  const featured = useMemo(() => featuredItems.filter((it) => {
    if (it.status === "sold") return false;
    if (it.featured_until && new Date(it.featured_until).getTime() < now) return false;
    if (it.country !== country) return false;
    if (categories.length && !categories.includes(it.category)) return false;
    if (subcategories.length && !(Array.isArray(it.subcategory) ? it.subcategory.some((s) => subcategories.includes(s)) : subcategories.includes(it.subcategory))) return false;
    return matchLocation(it, locationFilter, country);
  }), [featuredItems, now, country, categories, subcategories, locationFilter]);
  const showFeatured = featured.length > 0;

  return (
    <PullToRefresh onRefresh={async () => { await refresh(false); await loadFeatured(); }}>
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

      {/* Buy Requests button */}
      <button
        onClick={() => nav("/buy-requests")}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/60 hover:shadow-lg hover:border-border transition"
      >
        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
          <Megaphone size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 text-start">
          <p className="font-bold text-sm leading-tight">
            {lang === "ar" ? "طلبات الشراء" : "Buy Requests"}
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {lang === "ar" ? "أوصف اللي تدوره وانتظر العروض" : "Post what you need and wait for offers"}
          </p>
        </div>
      </button>

      <RecentlyViewed sellers={sellers} />
      {showFeatured ? (
        <FeaturedCarousel items={featured} onOpen={(iid) => nav(`/item/${iid}`)} sellers={sellers} />
      ) : !featuredLoaded && (
        <FeaturedCarouselSkeleton />
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-lg">
          {categories.length === 1
            ? (lang === "ar" ? getCategory(categories[0]).ar : getCategory(categories[0]).en)
            : t("newArrivals")}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{ordered.length} {t("items")}</span>
          <div className="inline-flex items-center bg-muted rounded-xl p-0.5 text-sm font-semibold">
            <button
              onClick={() => setPrefs({ showSold: false })}
              className={`px-2.5 py-1.5 rounded-lg transition ${!prefs.showSold ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground"}`}
            >
              {lang === "ar" ? "متاح" : "Available"}
            </button>
            <button
              onClick={() => setPrefs({ showSold: true })}
              className={`px-2.5 py-1.5 rounded-lg transition ${prefs.showSold ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {lang === "ar" ? "الكل" : "All"}
            </button>
          </div>
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
            {ordered.map((it) => (
              <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} sellerInfo={sellers[it.seller_id]} />
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
            ) : null}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}