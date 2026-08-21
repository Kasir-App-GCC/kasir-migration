import React, { useState } from "react";
import { Search, X, SlidersHorizontal, RotateCcw, ChevronDown, MapPin } from "lucide-react";
import CitySearchSelect from "@/components/CitySearchSelect";
import { CATEGORIES, SUBCATEGORIES, getSubcategories } from "@/lib/constants";
import { getBuyRequestTagsForCategory } from "@/lib/buyRequestTags";

export default function BuyRequestFilters({
  lang, cities,
  searchQuery, setSearchQuery,
  filterCity, setFilterCity,
  filterCategories, setFilterCategories,
  filterSubcategories, setFilterSubcategories,
  filterTags, setFilterTags,
}) {
  const ar = lang === "ar";
  const [expanded, setExpanded] = useState(false);
  const activeCount =
    filterCategories.length + filterSubcategories.length + filterTags.length + (filterCity ? 1 : 0);

  const clearAll = () => {
    setFilterCategories([]);
    setFilterSubcategories([]);
    setFilterTags([]);
    setFilterCity("");
  };

  const subOptions = filterCategories
    .flatMap((cat) => (SUBCATEGORIES[cat] || []))
    .filter((s, i, arr) => arr.findIndex((x) => x.en === s.en) === i);
  const tagOptions = filterCategories
    .flatMap((cat) => getBuyRequestTagsForCategory(cat, filterSubcategories))
    .filter((t, i, arr) => arr.findIndex((x) => x.en === t.en) === i);

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition active:scale-95 ${
        active
          ? "bg-violet-500 text-white border-transparent shadow-sm shadow-violet-500/25"
          : "bg-card text-muted-foreground border-border/70 hover:bg-muted hover:border-border"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 space-y-3">
      {/* Text search */}
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={ar ? "ابحث في كل الطلبات..." : "Search all requests..."}
          className="w-full ps-9 pe-9 py-2.5 rounded-xl bg-muted/70 outline-none focus:ring-2 ring-violet-400/40 focus:bg-card text-sm transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 -translate-y-1/2 end-2 w-6 h-6 rounded-full bg-muted-foreground/15 flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/25 transition"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* City search */}
      <div className="relative">
        <MapPin size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none z-10" />
        <div className="ps-9">
          <CitySearchSelect
            value={filterCity}
            onChange={setFilterCity}
            cities={cities}
            lang={lang}
            placeholder={ar ? "ابحث عن مدينة..." : "Search city..."}
          />
        </div>
        {filterCity && (
          <button
            onClick={() => setFilterCity("")}
            className="absolute top-1/2 -translate-y-1/2 end-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 z-10"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filters header */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-bold"
        >
          <SlidersHorizontal size={15} className="text-violet-500" />
          {ar ? "تصفية سريعة" : "Quick filters"}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          <ChevronDown size={15} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw size={12} />
            {ar ? "مسح الكل" : "Clear all"}
          </button>
        )}
      </div>

      {/* Expanded filter chips */}
      {expanded && (
        <div className="space-y-3 pt-0.5">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{ar ? "الأقسام" : "Categories"}</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <Chip
                  key={c.id}
                  active={filterCategories.includes(c.id)}
                  onClick={() => setFilterCategories((prev) =>
                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                  )}
                >
                  {ar ? c.ar : c.en}
                </Chip>
              ))}
            </div>
          </div>

          {subOptions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{ar ? "الأقسام الفرعية" : "Subcategories"}</p>
              <div className="flex flex-wrap gap-1.5">
                {subOptions.map((s) => (
                  <Chip
                    key={s.en}
                    active={filterSubcategories.includes(s.en)}
                    onClick={() => setFilterSubcategories((prev) =>
                      prev.includes(s.en) ? prev.filter((x) => x !== s.en) : [...prev, s.en]
                    )}
                  >
                    {ar ? s.ar : s.en}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {tagOptions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{ar ? "وسوم" : "Tags"}</p>
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((t) => (
                  <Chip
                    key={t.en}
                    active={filterTags.includes(t.en)}
                    onClick={() => setFilterTags((prev) =>
                      prev.includes(t.en) ? prev.filter((x) => x !== t.en) : [...prev, t.en]
                    )}
                  >
                    {ar ? t.ar : t.en}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}