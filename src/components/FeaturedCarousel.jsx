import React, { useEffect, useRef, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";

// Fair, paid-feature carousel: every currently-active boosted listing gets
// airtime. Items are split into batches; each batch auto-scrolls as a seamless
// infinite loop (items are duplicated and the row wraps when one full set
// width is traversed — no ping-pong). We auto-advance to the next batch every
// ADVANCE_MS so a seller who paid is guaranteed to appear when their batch
// rotates in. A session-stable random start offset rotates which batch is
// first, so the same seller isn't always last across loads.
const BATCH = 12;
const ADVANCE_MS = 12000;

export default function FeaturedCarousel({ items, onOpen, sellers }) {
  const t = useT();
  const containerRef = useRef(null);
  const rowRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [batchIdx, setBatchIdx] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const translate = useRef(0);
  const drag = useRef({ active: false, startX: 0, startTranslate: 0, moved: false });
  const resumeTimer = useRef(null);

  // Reset rotation + batch when the active-featured set changes.
  useEffect(() => {
    setStartOffset(items.length > BATCH ? Math.floor(Math.random() * items.length) : 0);
    setBatchIdx(0);
    translate.current = 0;
  }, [items]);

  const rotated = useMemo(() => {
    if (!items.length) return [];
    const off = startOffset % items.length;
    return [...items.slice(off), ...items.slice(0, off)];
  }, [items, startOffset]);

  const batches = useMemo(() => {
    const b = [];
    for (let i = 0; i < rotated.length; i += BATCH) b.push(rotated.slice(i, i + BATCH));
    return b;
  }, [rotated]);
  const numBatches = batches.length;
  const current = batches[batchIdx] || batches[0] || [];

  // Track whether the current batch overflows the viewport — only then do we
  // need the duplicate copy for the seamless loop. When the batch is small
  // (few featured items), duplicating would show the same card twice with no
  // animation running, so we render a single copy instead.
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const container = containerRef.current, row = rowRef.current;
    if (!container || !row || !current.length) { setOverflows(false); return; }
    const check = () => {
      const oneSet = overflows ? row.scrollWidth / 2 : row.scrollWidth;
      setOverflows(oneSet > container.clientWidth);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(container);
    ro.observe(row);
    return () => ro.disconnect();
  }, [current.length, overflows]);

  const loopItems = useMemo(() => {
    if (!current.length) return [];
    return overflows ? [...current, ...current] : current;
  }, [current, overflows]);

  // Continuous one-direction loop — no ping-pong, no direction reversal.
  useEffect(() => {
    if (!current.length || paused) return;
    const container = containerRef.current, row = rowRef.current;
    if (!container || !row) return;
    let raf;
    const step = 1.1; // px per frame (~66 px/s at 60fps)
    const tick = () => {
      const isRtl = window.getComputedStyle(container).direction === "rtl";
      const hw = row.scrollWidth / 2;
      // Only animate when the batch overflows the viewport.
      if (hw > 0 && hw > container.clientWidth) {
        let next = translate.current + step * (isRtl ? 1 : -1);
        // Wrap modulo one set width — seamless because of the duplicate copy.
        if (isRtl) {
          if (next >= hw) next -= hw;
          else if (next < 0) next += hw;
        } else {
          if (next <= -hw) next += hw;
          else if (next > 0) next -= hw;
        }
        translate.current = next;
        row.style.transform = `translate3d(${next}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [batchIdx, paused, current.length, overflows]);

  // Reset scroll position when the batch changes.
  useEffect(() => {
    translate.current = 0;
    if (rowRef.current) rowRef.current.style.transform = "translate3d(0,0,0)";
  }, [batchIdx]);

  // Auto-advance to the next batch so every paying booster gets airtime.
  useEffect(() => {
    if (paused || numBatches <= 1) return;
    const id = setInterval(() => setBatchIdx((i) => (i + 1) % numBatches), ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, numBatches]);

  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2200);
  };
  const onPointerDown = (e) => {
    drag.current = { active: true, startX: e.clientX, startTranslate: translate.current, moved: false };
    setPaused(true);
  };
  const onPointerMove = (e) => {
    const row = rowRef.current, container = containerRef.current;
    if (!row || !container || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    const isRtl = window.getComputedStyle(container).direction === "rtl";
    const hw = row.scrollWidth / 2;
    let next = drag.current.startTranslate + dx;
    // Clamp within one loop width so the drag stays within the visible set.
    if (isRtl) next = Math.max(0, Math.min(hw, next));
    else next = Math.max(-hw, Math.min(0, next));
    translate.current = next;
    row.style.transform = `translate3d(${next}px,0,0)`;
  };
  const onPointerUp = () => { if (!drag.current.active) return; drag.current.active = false; scheduleResume(); };
  const onClickCapture = (e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); } };

  if (!items.length) return null;
  return (
    <section className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-700 dark:to-slate-900 text-white p-4 overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg flex items-center gap-1.5">
            <Sparkles size={18} /> {t("featuredStrip")}
          </h2>
          <p className="text-white/70 text-xs">{t("featuredStripDesc")}</p>
        </div>
        {numBatches > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {batches.map((_, i) => (
              <button
                key={i}
                onClick={() => setBatchIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === batchIdx ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                aria-label={`batch ${i + 1}`}
              />
            ))}
          </div>
        )}
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
          {loopItems.map((it, i) => (
            <div key={`${it.id}-${i}`} className="shrink-0 w-40 pointer-events-auto">
              <ItemCard item={it} onClick={() => onOpen(it.id)} sellerInfo={sellers?.[it.seller_id]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}