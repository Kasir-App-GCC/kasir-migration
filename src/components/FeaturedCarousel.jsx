import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";

export default function FeaturedCarousel({ items, onOpen }) {
  const t = useT();
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const resumeTimer = useRef(null);

  // Continuous, smooth frame-by-frame auto-scroll. Loops back to the start
  // when it reaches the end. Pauses only while the user is actively dragging.
  useEffect(() => {
    if (!items.length || paused) return;
    const el = ref.current;
    if (!el) return;
    let raf;
    const step = 1.1;
    let dir = 1;
    const tick = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max > 0) {
        let next = el.scrollLeft + step * dir;
        if (next >= max) { next = max; dir = -1; }
        else if (next <= 0) { next = 0; dir = 1; }
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length, paused]);

  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2200);
  };

  const onPointerDown = (e) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    setPaused(true);
    try { el.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    scheduleResume();
  };

  // Suppress item click if the pointer interaction was a drag, not a tap.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
        className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {items.map((it) => (
          <div key={it.id} className="shrink-0 w-40 pointer-events-auto">
            <ItemCard item={it} onClick={() => onOpen(it.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}