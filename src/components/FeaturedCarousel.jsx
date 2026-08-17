import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";

export default function FeaturedCarousel({ items, onOpen }) {
  const t = useT();
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);

  // Continuous, smooth frame-by-frame auto-scroll. Loops back to the start
  // when it reaches the end. Pauses on hover / touch so the user can swipe.
  useEffect(() => {
    if (!items.length || paused) return;
    const el = ref.current;
    if (!el) return;
    let raf;
    const step = 0.5;
    const tick = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max > 0) {
        let next = el.scrollLeft + step;
        if (next >= max) next = 0;
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
        className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1"
      >
        {items.map((it) => (
          <div key={it.id} className="shrink-0 w-40">
            <ItemCard item={it} onClick={() => onOpen(it.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}