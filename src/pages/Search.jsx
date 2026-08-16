import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, SAUDI_CITIES } from "@/lib/constants";
import { matchLocation } from "@/lib/location";

export default function Search() {
  const { category, subcategory } = useOutletContext();
  const { locationFilter, lang, prefs } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState("");

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

  const results = useMemo(() => {
    let r = items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (subcategory && it.subcategory !== subcategory) return false;
      if (!prefs.showSold && it.status === "sold") return false;
      if (!matchLocation(it, locationFilter)) return false;
      if (q && !(`${it.title} ${it.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (condition && it.condition !== condition) return false;
      if (minPrice && Number(it.price) < Number(minPrice)) return false;
      if (maxPrice && Number(it.price) > Number(maxPrice)) return false;
      return true;
    });
    if (sort === "priceLowHigh") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "priceHighLow") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [items, category, subcategory, locationFilter, q, condition, minPrice, maxPrice, sort, prefs.showSold]);

  const reset = () => {
    setMinPrice(""); setMaxPrice(""); setCondition(""); setSort("newest");
  };

  return (
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
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="px-3.5 rounded-2xl bg-muted hover:bg-muted/70 flex items-center gap-1.5 text-sm font-semibold"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{results.length} {t("results")}</span>
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
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-semibold text-lg">{t("noResults")}</p>
          <p className="text-sm mt-1">{t("noResultsDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {results.map((it) => (
            <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />
          ))}
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
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("price")}</label>
                <div className="flex gap-2">
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t("minPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("maxPrice")} className="w-1/2 px-3 py-2.5 rounded-xl bg-muted outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{t("condition")}</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(condition === c.id ? "" : c.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold ${condition === c.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {lang === "ar" ? c.ar : c.en}
                    </button>
                  ))}
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
  );
}