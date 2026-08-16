import React from "react";
import { Heart, MapPin, Clock } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice, timeAgo } from "@/lib/format";
import { getCategory, getCityName } from "@/lib/constants";

export default function ItemCard({ item, onClick }) {
  const { lang, favorites, toggleFavorite } = useStore();
  const t = useT();
  const fav = favorites.includes(item.id);
  const cat = getCategory(item.category);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/60 hover:shadow-xl hover:border-border transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <Image
          src={item.images?.[0]}
          fittingType="fill"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

        {/* Price tag (hanging label) */}
        <div className="absolute bottom-0 start-0 -rotate-6 translate-y-2.5 -translate-x-0.5 origin-bottom-start z-10">
          <div
            className="relative ps-4 pe-3 py-1.5 bg-amber-300 text-slate-900 shadow-lg shadow-black/25"
            style={{ clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)" }}
          >
            <span className="absolute top-1/2 -translate-y-1/2 start-[3px] w-1.5 h-1.5 rounded-full bg-slate-900/30 ring-1 ring-slate-900/25" />
            <span className="text-[13px] font-extrabold tracking-tight whitespace-nowrap">
              {formatPrice(item.price, lang)}
            </span>
          </div>
        </div>

        {/* Heart (favorite) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          aria-label={t("favorite")}
          className="absolute top-2.5 end-2.5 w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/55 backdrop-blur flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition z-10"
        >
          <Heart
            className={fav ? "fill-rose-500 text-rose-500" : "text-slate-700 dark:text-slate-100"}
            size={18}
          />
        </button>

        {/* Badges */}
        {item.is_family && (
          <span className="absolute top-2.5 start-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow">
            {t("featuredBadge")}
          </span>
        )}
        {item.status === "sold" && (
          <span className="absolute inset-0 z-0 flex items-center justify-center bg-black/45">
            <span className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-sm font-bold uppercase tracking-wide">
              {t("sold")}
            </span>
          </span>
        )}
      </div>

      <div className="p-2.5">
        <h3 className="text-sm font-semibold line-clamp-1 leading-snug">{item.title}</h3>
        <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 line-clamp-1">
            <MapPin size={12} className="shrink-0" />
            {getCityName(item.city, lang)}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <Clock size={12} />
            {timeAgo(item.created_date, lang)}
          </span>
        </div>
      </div>
    </div>
  );
}