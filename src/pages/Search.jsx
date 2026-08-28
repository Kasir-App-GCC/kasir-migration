import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, X, Sparkles, ShoppingBag, Megaphone, Bookmark, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import SearchLocationControl from "@/components/SearchLocationControl";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, getSubcategories } from "@/lib/constants";
import { matchLocation, cityCoords, distanceKm } from "@/lib/location";
import { nearbyCities } from "@/lib/countries";
import { getSellerInfos } from "@/lib/sellerCache";
import { readFeedCache, writeFeedCache } from "@/lib/feedCache";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import { escapeRegex } from "@/lib/regexEscape";
import { debounce } from "lodash";
import SavedSearchChips from "@/components/SavedSearchChips";
import RecentSearches, { addRecentSearch } from "@/components/RecentSearches";
import { useToast } from "@/components/ui/use-toast";
import { base44Analytics } from "@/lib/analytics";

const PAGE_SIZE = 60;

export default function Search() {
  const { categories, setCategories, subcategories, setSubcategories } = useOutletContext();
  const { user, locationFilter, setLocationFilter, lang, prefs, country } = useStore();
  const t = useT();
  const { toast } = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState("newest");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const skipRef = useRef(0);
  const itemsRef = useRef([]);
  const refreshingRef = useRef(false);
  const sentinelRef = useRef(null);

  // Debounce the text query so each keystroke doesn't fire a server request.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  // Apply a saved search passed via router state (from Profile → Saved searches)
  // on mount only, then clear the state so it doesn't reapply on back/forward.
  useEffect(() => {
    const s = location.state?.savedSearch;
    if (!s) return;
    if (s.q) { setQ(s.q); setDebouncedQ(s.q); }
    if (s.minPrice) setMinPrice(s.minPrice);
    if (s.maxPrice) setMaxPrice(s.maxPrice);
    if (s.condition) setCondition([s.condition]);
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror loaded items into a ref so cursor pagination reads the latest oldest
  // created_date without re-creating the loadMore callback on every render.
  useEffect(() => { itemsRef.current = items; }, [items]);

  const sortKey = sort === "priceLowHigh" ? "price" : sort === "priceHighLow" ? "-price" : "-created_date";

  // Build the server-side filter query — push every structured filter (and
  // the text search via $regex) to the server so we don't have to load the
  // whole catalog to find matches.
  const buildQuery = useCallback(() => {
    const query = { country, archived: { $ne: true }, review_status: { $nin: ["pending", "rejected"] } };
    if (categories.length === 1) query.category = categories[0];
    else if (categories.length > 1) query.category = { $in: categories };
    if (subcategories.length) query.subcategory = { $in: subcategories };
    if (condition.length) query.condition = { $in: condition };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (!prefs.showSold) query.status = "available";
    else query.status = { $ne: "draft" };
    if (verifiedOnly) query.seller_trusted = true;
    if (locationFilter.mode === "city" && locationFilter.city) {
      const nearby = nearbyCities(locationFilter.city, country, 25);
      query.city = nearby.length > 1 ? { $in: nearby } : nearby[0];
    }
    if (debouncedQ) {
      const pattern = escapeRegex(debouncedQ);
      query.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];
    }
    return query;
  }, [country, categories, subcategories, condition, minPrice, maxPrice, prefs.showSold, verifiedOnly, locationFilter.mode, locationFilter.city, debouncedQ]);

  // Only fetch when the user has specified some search criteria — otherwise
  // the search page would just duplicate the home feed.
  const hasActiveFilter = !!(
    debouncedQ ||
    categories.length ||
    subcategories.length ||
    condition.length ||
    minPrice ||
    maxPrice ||
    (locationFilter.mode === "city" && locationFilter.city) ||
    locationFilter.mode === "radius" ||
    locationFilter.mode === "map"
  );

  const refresh = useCallback(async (silent) => {
    if (!hasActiveFilter) {
      setItems([]);
      setSellers({});
      setHasMore(false);
      setLoading(false);
      return;
    }
    if (silent && refreshingRef.current) return;
    refreshingRef.current = true;
    if (!silent) {
      setLoading(true);
      skipRef.current = 0;
      setHasMore(true);
    }
    try {
      const first = await base44.entities.Item.filter(buildQuery(), sortKey, PAGE_SIZE, 0);
      const list = first || [];
      const ids = [...new Set(list.map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await getSellerInfos(ids) : {};
      setSellers(sMap);
      setItems(list);
      setHasMore(list.length === PAGE_SIZE);
      if (!silent && debouncedQ && list.length) { addRecentSearch(debouncedQ); base44Analytics.searchPerformed(debouncedQ, list.length); }
    } catch {
      if (!silent) { setItems([]); setHasMore(false); }
    } finally {
      refreshingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [buildQuery, sortKey, hasActiveFilter, debouncedQ]);

  // Stable cache key for this exact filter/sort combination.
  const cacheKey = useMemo(
    () => `search:${country}:${JSON.stringify(buildQuery())}:${sortKey}`,
    [country, buildQuery, sortKey]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      let list;
      if (sort === "newest") {
        // Cursor (keyset) pagination: fetch items older than the oldest loaded
        // one. Stable under new inserts — no drift, no skipped items on deep
        // scroll (unlike offset, which shifts when new listings arrive).
        const oldest = itemsRef.current[itemsRef.current.length - 1]?.created_date;
        if (!oldest) { setHasMore(false); return; }
        list = await base44.entities.Item.filter({ ...buildQuery(), created_date: { $lt: oldest } }, sortKey, PAGE_SIZE);
      } else {
        // Price/distance sorts can't use a created_date cursor; fall back to
        // offset. Deep scroll is rare in these modes so the cost is acceptable.
        const skip = skipRef.current + PAGE_SIZE;
        skipRef.current = skip;
        list = await base44.entities.Item.filter(buildQuery(), sortKey, PAGE_SIZE, skip);
      }
      const next = list || [];
      const ids = [...new Set(next.map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await getSellerInfos(ids) : {};
      setSellers((prev) => ({ ...prev, ...sMap }));
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...next.filter((x) => !seen.has(x.id))];
      });
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      if (sort !== "newest") skipRef.current = Math.max(0, skipRef.current - PAGE_SIZE);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, buildQuery, sortKey, sort]);

  useEffect(() => {
    const cached = readFeedCache(cacheKey);
    if (cached && hasActiveFilter) {
      setItems(cached.items || []);
      setSellers(cached.sellers || {});
      setHasMore((cached.items || []).length >= PAGE_SIZE);
      setLoading(false);
      refresh(true);   // background SWR refresh
    } else {
      refresh(false);
    }
  }, [cacheKey, refresh, hasActiveFilter]);

  // Persist the result snapshot so returning to the same search renders instantly.
  const debouncedWrite = useRef(debounce((key, snap) => writeFeedCache(key, snap), 500)).current;
  useEffect(() => {
    if (hasActiveFilter && (items.length || Object.keys(sellers).length)) {
      debouncedWrite(cacheKey, { items, sellers });
    }
  }, [items, sellers, cacheKey, hasActiveFilter]);

  // Fetch featured (promoted) listings to inject as sponsored slots in results.
  // Only when the user has an active filter — otherwise the search page just
  // duplicates the home feed and the featured fetch is wasted bandwidth.
  const loadFeatured = useCallback(async () => {
    if (!hasActiveFilter) { setFeaturedItems([]); return; }
    try {
      const list = await base44.entities.Item.filter({ featured: true, status: "available", country, archived: { $ne: true }, review_status: { $nin: ["pending", "rejected"] } }, "-featured_until", 20);
      setFeaturedItems(list || []);
    } catch {
      setFeaturedItems([]);
    }
  }, [hasActiveFilter, country]);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

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

  // Radius/map location can't be expressed server-side, so narrow the loaded
  // pages client-side. City mode is already handled by the server query.
  const filtered = useMemo(() => {
    if (locationFilter.mode === "city" || locationFilter.mode === "radius" || locationFilter.mode === "map") {
      return items.filter((it) => matchLocation(it, locationFilter, country));
    }
    return items;
  }, [items, locationFilter, country]);

  // Distance sort is client-side (over the loaded page) since the server can't
  // rank by proximity. Falls back to the server order when no center is set.
  // ("Verified only" is already enforced server-side via seller_trusted.)
  const sorted = useMemo(() => {
    if (sort !== "distance") return filtered;
    const center = (locationFilter.lat && locationFilter.lng)
      ? { lat: locationFilter.lat, lng: locationFilter.lng }
      : (locationFilter.mode === "city" && locationFilter.city ? cityCoords(locationFilter.city) : null);
    if (!center) return filtered;
    const distOf = (it) => {
      const c = (it.lat && it.lng) ? { lat: it.lat, lng: it.lng } : cityCoords(it.city);
      return c ? distanceKm(center.lat, center.lng, c.lat, c.lng) : 1e9;
    };
    return [...filtered].sort((a, b) => distOf(a) - distOf(b));
  }, [filtered, sort, locationFilter]);

  // Interleave promoted (sponsored) items into search results every 5 slots.
  const { displayItems, promotedIds } = useMemo(() => {
    const now = Date.now();
    const promoted = featuredItems.filter((it) => {
      if (it.featured_until && new Date(it.featured_until).getTime() < now) return false;
      if (it.country === country) return true;
      if (it.featured_cross_country) return true;
      return false;
    }).filter((it) => {
      if (categories.length === 1 && it.category !== categories[0]) return false;
      return true;
    }).slice(0, 5);
    const ids = new Set(promoted.map((p) => p.id));
    const clean = sorted.filter((it) => !ids.has(it.id));
    const result = [];
    let pIdx = 0;
    clean.forEach((it, i) => {
      result.push(it);
      if ((i + 1) % 5 === 0 && pIdx < promoted.length) {
        result.push(promoted[pIdx]);
        pIdx++;
      }
    });
    return { displayItems: result, promotedIds: ids };
  }, [sorted, featuredItems, country, categories]);

  const reset = () => {
    setMinPrice(""); setMaxPrice(""); setCondition([]); setSort("newest"); setVerifiedOnly(false);
    setCategories([]); setSubcategories([]);
    setLocationFilter({ mode: "city", city: null, radius: 25 });
  };

  const saveSearch = async () => {
    if (!user || !hasActiveFilter) return;
    try {
      const cat = categories.length === 1 ? categories[0] : "";
      const catObj = CATEGORIES.find((c) => c.id === cat);
      const parts = [];
      if (debouncedQ) parts.push(debouncedQ);
      if (catObj) parts.push(lang === "ar" ? catObj.ar : catObj.en);
      if (locationFilter.mode === "city" && locationFilter.city) parts.push(locationFilter.city);
      if (minPrice || maxPrice) parts.push(`${minPrice || "0"}–${maxPrice || "∞"}`);
      const name = parts.join(" · ") || (lang === "ar" ? "بحث محفوظ" : "Saved search");
      await base44.entities.SavedSearch.create({
        user_id: user.id,
        name,
        query: debouncedQ || "",
        category: cat,
        subcategory: subcategories,
        city: locationFilter.mode === "city" ? locationFilter.city || "" : "",
        country,
        price_min: minPrice ? Number(minPrice) : null,
        price_max: maxPrice ? Number(maxPrice) : null,
        condition: condition.length === 1 ? condition[0] : "",
      });
      toast({ title: lang === "ar" ? "تم حفظ البحث — سننبّهك عند ظهور نتائج جديدة" : "Search saved — we'll alert you when new matches appear" });
    } catch {
      toast({ title: lang === "ar" ? "تعذّر حفظ البحث" : "Couldn't save search", variant: "destructive" });
    }
  };

  const applySaved = (s) => {
    setQ(s.query || "");
    setDebouncedQ(s.query || "");
    setCategories(s.category && s.category !== "all" ? [s.category] : []);
    setSubcategories(Array.isArray(s.subcategory) ? s.subcategory : []);
    setMinPrice(s.price_min ? String(s.price_min) : "");
    setMaxPrice(s.price_max ? String(s.price_max) : "");
    setCondition(s.condition ? [s.condition] : []);
    if (s.city) setLocationFilter({ mode: "city", city: s.city, radius: locationFilter.radius || 25 });
  };

  return (
    <PullToRefresh onRefresh={() => refresh(false)}>
    <div className="pt-2 space-y-3">
      <div className="flex gap-2">
        <button onClick={() => nav("/assistant")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition">
          <Sparkles size={13} /> {t("assistantChip")}
        </button>
        <button onClick={() => nav("/buy-requests")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition">
          <Megaphone size={13} /> {t("buyRequestsChip")}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-10 pe-3 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
          />
          <RecentSearches
            visible={searchFocused && !q}
            onPick={(term) => { setQ(term); setDebouncedQ(term); }}
            onClose={() => setSearchFocused(false)}
          />
          <UserSearchDropdown
            query={q}
            lang={lang}
            onPick={(u) => nav(`/user/${u.id}?name=${encodeURIComponent(u.full_name || "")}&avatar=${encodeURIComponent(u.avatar || "")}`)}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="px-3.5 rounded-2xl bg-muted hover:bg-muted/70 flex items-center gap-1.5 text-sm font-semibold"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <SavedSearchChips onApply={applySaved} />

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{sorted.length} {t("results")}</span>
        <div className="flex items-center gap-3">
          {hasActiveFilter && (
            <button onClick={saveSearch} className="inline-flex items-center gap-1 text-primary font-semibold active:scale-95 transition">
              <Bookmark size={13} /> {lang === "ar" ? "حفظ البحث" : "Save search"}
            </button>
          )}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${verifiedOnly ? "bg-sky-500 text-white" : "bg-muted text-muted-foreground"}`}
          >
            <BadgeCheck size={13} /> {t("verifiedOnly")}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-foreground font-medium outline-none"
          >
            <option value="newest">{t("newest")}</option>
            <option value="priceLowHigh">{t("priceLowHigh")}</option>
            <option value="priceHighLow">{t("priceHighLow")}</option>
            <option value="distance">{t("distance")}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-2.5 h-10" />
            </div>
          ))}
        </div>
      ) : !hasActiveFilter ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-lg">{lang === "ar" ? "ابحث أو اختر فلتر" : "Search or apply filters"}</p>
          <p className="text-sm mt-1">{lang === "ar" ? "اكتب كلمة بحث، اختر قسم، أو حدد موقع لعرض النتائج" : "Type a search, pick a category, or set a location to see results"}</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t("noResults")} description={t("noResultsDesc")} lang={lang} />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayItems.map((it) => (
              <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} sellerInfo={sellers[it.seller_id]} promoted={promotedIds.has(it.id)} />
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

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full sm:max-w-md max-h-[100dvh] sm:max-h-[90vh] flex flex-col bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between p-5 pb-3 shrink-0">
              <h3 className="font-bold text-lg">{t("filters")}</h3>
              <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto px-5 pb-2 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("category")}</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => {
                    const active = categories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const next = active ? categories.filter((x) => x !== c.id) : [...categories, c.id];
                          setCategories(next);
                          // Prune subcategories that no longer belong to any selected category.
                          const validSubs = new Set(next.flatMap((cid) => getSubcategories(cid)).map((s) => s.en));
                          setSubcategories((prev) => prev.filter((s) => validSubs.has(s)));
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
                      >
                        <c.icon size={15} />
                        {lang === "ar" ? c.ar : c.en}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Subcategories — shown when at least one category is selected, mirroring the Home category bar. */}
              {categories.length > 0 && (() => {
                const subs = Array.from(new Map(categories.flatMap((id) => getSubcategories(id)).map((s) => [s.en, s])).values());
                if (!subs.length) return null;
                return (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("subcategory")}</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSubcategories([])}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${subcategories.length === 0 ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"}`}
                      >
                        {t("all")}
                      </button>
                      {subs.map((s) => {
                        const active = subcategories.includes(s.en);
                        return (
                          <button
                            key={s.en}
                            onClick={() => setSubcategories(active ? subcategories.filter((x) => x !== s.en) : [...subcategories, s.en])}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-card text-foreground border-border/60 hover:bg-muted"}`}
                          >
                            {lang === "ar" ? s.ar : s.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("locationFilter")}</label>
                <SearchLocationControl />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("price")}</label>
                <div className="flex gap-2">
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t("minPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("maxPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("condition")}</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const active = condition.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCondition(active ? condition.filter((x) => x !== c.id) : [...condition, c.id])}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {lang === "ar" ? c.ar : c.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-3 shrink-0">
              <button onClick={reset} className="px-4 py-3 rounded-xl bg-muted text-muted-foreground font-semibold">{t("reset")}</button>
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold">{t("applyFilters")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}