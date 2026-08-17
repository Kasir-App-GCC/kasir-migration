import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import Price from "@/components/Price";

export default function FeaturedCarousel({ items, onOpen }) {
  const { lang } = useStore();
  const t = useT();
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!items.length || paused) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = el.scrollLeft + 140 >= max - 4 ? 0 : el.scrollLeft + 140;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(id);
  }, [items.length, paused]);

  if (!items.length) return null;
  return (
    <section className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-700 dark:to-slate-900 text-white p-4 overflow-hidden">
      <div className="mb-3">
        <h2 className="font-extrabold text-lg flex items-center gap-1.5">
          <Sparkles size={18} /> {t("featuredStrip")}
        </h2>
        <p className="text-white/70 text-xs">{t("featuredStripDesc")}</p>
      </div>
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 2500)}
        className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1 scroll-smooth snap-x"
      >
        {items.map((it) => (
          <div key={it.id} onClick={() => onOpen(it.id)} className="snap-start shrink-0 w-32 cursor-pointer">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/10">
              <img src={it.images?.[0]} alt={it.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-semibold mt-1.5 line-clamp-1">{it.title}</p>
            <p className="text-[11px] font-bold text-amber-300"><Price value={it.price} lang={lang} /></p>
          </div>
        ))}
      </div>
    </section>
  );
}