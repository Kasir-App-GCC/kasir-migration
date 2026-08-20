import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";

export default function FeaturedCarousel({ items, onOpen, sellers }) {
  const t = useT();
  const containerRef = useRef(null);
  const rowRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const translate = useRef(0);
  const dir = useRef(-1);
  const drag = useRef({ active: false, startX: 0, startTranslate: 0, moved: false });
  const resumeTimer = useRef(null);

  const bounds = () => {
    const container = containerRef.current, row = rowRef.current;
    if (!container || !row) return { lo: 0, hi: 0 };
    const isRtl = window.getComputedStyle(container).direction === "rtl";
    const overflow = row.scrollWidth - container.clientWidth;
    if (overflow <= 0) return { lo: 0, hi: 0 };
    return isRtl ? { lo: 0, hi: overflow } : { lo: -overflow, hi: 0 };
  };

  // Continuous, smooth frame-by-frame glide. Ping-pongs between the two edges
  // so it loops without duplicating items and without any sudden jump.
  useEffect(() => {
    if (!items.length || paused) return;
    const container = containerRef.current, row = rowRef.current;
    if (!container || !row) return;
    let raf;
    const step = 0.55;
    const tick = () => {
      const { lo, hi } = bounds();
      if (hi !== lo) {
        let next = translate.current + step * dir.current;
        if (next <= lo) { next = lo; dir.current = 1; }
        else if (next >= hi) { next = hi; dir.current = -1; }
        translate.current = next;
        row.style.transform = `translate3d(${next}px,0,0)`;
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
    const container = containerRef.current;
    if (!container) return;
    drag.current = { active: true, startX: e.clientX, startTranslate: translate.current, moved: false };
    setPaused(true);
  };
  const onPointerMove = (e) => {
    const row = rowRef.current;
    if (!row || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    const { lo, hi } = bounds();
    let next = drag.current.startTranslate + dx;
    next = Math.max(lo, Math.min(hi, next));
    translate.current = next;
    row.style.transform = `translate3d(${next}px,0,0)`;
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    scheduleResume();
  };
  const onClickCapture = (e) => {
    if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); }
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
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <div ref={rowRef} className="flex gap-3 w-max pb-1" style={{ willChange: "transform" }}>
          {items.map((it) => (
            <div key={it.id} className="shrink-0 w-40 pointer-events-auto">
              <ItemCard item={it} onClick={() => onOpen(it.id)} sellerInfo={sellers?.[it.seller_id]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}