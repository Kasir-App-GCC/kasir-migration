import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import SearchLocationControl from "@/components/SearchLocationControl";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { matchLocation } from "@/lib/location";
import { fetchSellerInfos } from "@/lib/useTrusted";
import PullToRefresh from "@/components/PullToRefresh";

const PAGE_SIZE = 60;

export default function Search() {
  const { categories, setCategories, subcategories, setSubcategories } = useOutletContext();
  const { locationFilter, setLocationFilter, lang, prefs, country } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState([]);
  const skipRef = useRef(0);
  const sentinelRef = useRef(null);

  // Debounce the text query so each keystroke doesn't fire a server request.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const sortKey = sort === "priceLowHigh" ? "price" : sort === "priceHighLow" ? "-price" : "-created_date";

  // Build the server-side filter query — push every structured filter (and
  // the text search via $regex) to the server so we don't have to load the
  // whole catalog to find matches.
  const buildQuery = useCallback(() => {
    const query = { country };
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
    if (locationFilter.mode === "city" && locationFilter.city) query.city = locationFilter.city;
    if (debouncedQ) {
      query.$or = [
        { title: { $regex: debouncedQ, $options: "i" } },
        { description: { $regex: debouncedQ, $options: "i" } },
      ];
    }
    return query;
  }, [country, categories, subcategories, condition, minPrice, maxPrice, prefs.showSold, locationFilter.mode, locationFilter.city, debouncedQ]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    skipRef.current = 0;
    setHasMore(true);
    try {
      const first = await base44.entities.Item.filter(buildQuery(), sortKey, PAGE_SIZE, 0);
      const list = first || [];
      const ids = [...new Set(list.map((i) => i.seller_id).filter(Boolean))];
      const sMap = ids.length ? await fetchSellerInfos(ids) : {};
      setSellers(sMap);
      setItems(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, sortKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const skip = skipRef.current + PAGE_SIZE;
    skipRef.current = skip;
    try {
      const next = await base44.entities.Item.filter(buildQuery(), sortKey, PAGE_SIZE, skip);
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
      skipRef.current = skip - PAGE_SIZE;
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, buildQuery, sortKey]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

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
    if (locationFilter.mode !== "radius" && locationFilter.mode !== "map") return items;
    return items.filter((it) => matchLocation(it, locationFilter, country));
  }, [items, locationFilter, country]);

  const reset = () => {
    setMinPrice(""); setMaxPrice(""); setCondition([]); setSort("newest");
    setCategories([]); setSubcategories([]);
    setLocationFilter({ mode: "city", city: null, radius: 25 });
  };

  return (
    <PullToRefresh onRefresh={loadInitial}>
    <div className="pt-2 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-10 pe-3 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
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

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{filtered.length} {t("results")}</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-transparent text-foreground font-medium outline-none"
        >
          <option value="newest">{t("newest")}</option>
          <option value="priceLowHigh">{t("priceLowHigh")}</option>
          <option value="priceHighLow">{t("priceHighLow")}</option>
        </select>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-semibold text-lg">{t("noResults")}</p>
          <p className="text-sm mt-1">{t("noResultsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((it) => (
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

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{t("filters")}</h3>
              <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="space-y-4">
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
            <div className="flex gap-2 mt-6">
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