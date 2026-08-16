import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemCard from "@/components/ItemCard";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getCategory, getCityName } from "@/lib/constants";

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
  const { category } = useOutletContext();
  const { locationFilter, lang } = useStore();
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

  const matchLoc = (it) => {
    if (locationFilter.mode === "radius") return true;
    if (!locationFilter.city) return true;
    return it.city === locationFilter.city;
  };

  const filtered = items.filter((it) => {
    if (category !== "all" && it.category !== category) return false;
    return matchLoc(it);
  });
  const families = items.filter((it) => it.is_family).slice(0, 10);
  const showFamilies = category === "all" || category === "families";

  return (
    <div className="space-y-5 pt-2">
      {showFamilies && families.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-1.5">
                <Sparkles size={18} /> {t("productiveFamilies")}
              </h2>
              <p className="text-white/80 text-xs">{t("featuredDesc")}</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {families.map((it) => (
              <div
                key={it.id}
                onClick={() => nav(`/item/${it.id}`)}
                className="shrink-0 w-32 cursor-pointer"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/20">
                  <img src={it.images?.[0]} alt={it.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold mt-1.5 line-clamp-1">{it.title}</p>
                <p className="text-[11px] font-bold text-amber-200">{it.price} ر.س</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-lg">
          {category === "all" ? t("newArrivals") : (lang === "ar" ? getCategory(category).ar : getCategory(category).en)}
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