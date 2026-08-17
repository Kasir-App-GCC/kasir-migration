import React, { useState, useRef } from "react";
import { Heart, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import { getCategory, getCityName, getCondition } from "@/lib/constants";

export default function ItemCard({ item, onClick }) {
  const { lang, favorites, toggleFavorite } = useStore();
  const t = useT();
  const [idx, setIdx] = useState(0);
  const swipeStart = useRef(null);
  const fav = favorites.includes(item.id);
  const imgs = item.images?.length
    ? item.images
    : ["https://picsum.photos/seed/" + encodeURIComponent(item.title || item.id) + "/600/600"];
  const cond = getCondition(item.condition);
  const multi = imgs.length > 1;

  const step = (d, e) => {
    e.stopPropagation();
    setIdx((i) => (i + d + imgs.length) % imgs.length);
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/60 hover:shadow-xl hover:border-border transition-all duration-300 hover:-translate-y-0.5"
    >
      <div
        className="relative aspect-square bg-muted overflow-hidden touch-pan-y"
        onPointerDown={(e) => { swipeStart.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          if (!swipeStart.current) return;
          const dx = e.clientX - swipeStart.current.x;
          const dy = e.clientY - swipeStart.current.y;
          swipeStart.current = null;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            setIdx((i) => (dx < 0 ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length));
          }
        }}
      >
        <img
          src={imgs[idx]}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Price tag — hanging from the top, tag with triangular corner + hole */}
        <div className="absolute top-2 start-2.5 z-20">
          <div className="w-px h-2.5 bg-amber-600/70 ms-2" />
          <div
            className="relative bg-amber-300 text-slate-900 pl-4 pr-3 py-1.5 shadow-lg shadow-black/25"
            style={{ clipPath: "polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px)" }}
          >
            <span className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-900/30 ring-2 ring-amber-300" />
            <span className="text-[13px] font-extrabold whitespace-nowrap"><Price value={item.price} lang={lang} /></span>
          </div>
        </div>

        {/* Heart (favorite) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          aria-label={t("favorite")}
          className="absolute top-2.5 end-2.5 w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/55 backdrop-blur flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition z-20"
        >
          <Heart
            className={fav ? "fill-rose-500 text-rose-500" : "text-slate-700 dark:text-slate-100"}
            size={18}
          />
        </button>

        {/* Multi-image controls */}
        {multi && (
          <>
            <button
              onClick={(e) => step(-1, e)}
              aria-label="prev"
              className="absolute top-1/2 -translate-y-1/2 start-1 w-7 h-7 rounded-full bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <button
              onClick={(e) => step(1, e)}
              aria-label="next"
              className="absolute top-1/2 -translate-y-1/2 end-1 w-7 h-7 rounded-full bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 z-10">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        {item.is_family && (
          <span className="absolute bottom-2.5 start-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow">
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
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cond.color}`}>
            {lang === "ar" ? cond.ar : cond.en}
          </span>
          {multi && <span className="text-[10px] text-muted-foreground">{imgs.length} {t("photos")}</span>}
        </div>
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