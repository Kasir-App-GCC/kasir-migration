import React, { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function FullscreenImageViewer({ images, index, onClose, lang }) {
  const ar = lang === "ar";
  const [active, setActive] = useState(index);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const panStart = useRef(null);
  const swipeStart = useRef(null);
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const applyZoom = (s, p) => { scaleRef.current = s; panRef.current = p; setScale(s); setPan(p); };
  const resetZoom = () => { scaleRef.current = 1; panRef.current = { x: 0, y: 0 }; setScale(1); setPan({ x: 0, y: 0 }); };

  useEffect(() => { resetZoom(); }, [active]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setActive((i) => (ar ? Math.max(i - 1, 0) : Math.min(i + 1, images.length - 1)));
      if (e.key === "ArrowLeft") setActive((i) => (ar ? Math.min(i + 1, images.length - 1) : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose, ar]);

  const clampPan = (x, y, s, w, h) => {
    if (s <= 1) return { x: 0, y: 0 };
    const maxX = ((s - 1) * w) / 2;
    const maxY = ((s - 1) * h) / 2;
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  };

  const goNext = () => setActive((i) => Math.min(i + 1, images.length - 1));
  const goPrev = () => setActive((i) => Math.max(i - 1, 0));

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), scale: scaleRef.current, panX: panRef.current.x, panY: panRef.current.y };
    } else if (pointers.current.size === 1) {
      if (scaleRef.current > 1.05) {
        panStart.current = { x: e.clientX, y: e.clientY, px: panRef.current.x, py: panRef.current.y };
      } else {
        swipeStart.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const [p1, p2] = [...pointers.current.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      let ns = Math.min(Math.max(pinchStart.current.scale * (d / pinchStart.current.dist), 1), 5);
      applyZoom(ns, ns <= 1.05 ? { x: 0, y: 0 } : { x: pinchStart.current.panX, y: pinchStart.current.panY });
    } else if (pointers.current.size === 1 && panStart.current && scaleRef.current > 1.05) {
      const r = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      applyZoom(scaleRef.current, clampPan(panStart.current.px + dx, panStart.current.py + dy, scaleRef.current, r.width, r.height));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      if (scaleRef.current > 1.05) panStart.current = { x: p.x, y: p.y, px: panRef.current.x, py: panRef.current.y };
      else { panStart.current = null; swipeStart.current = { x: p.x, y: p.y }; }
      return;
    }
    if (pointers.current.size === 0) {
      setGesturing(false);
      panStart.current = null;
      const start = swipeStart.current;
      swipeStart.current = null;
      if (scaleRef.current <= 1.05 && start) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          // RTL: invert so swiping toward the reading-start feels natural
          if (ar) { if (dx < 0) goPrev(); else goNext(); }
          else { if (dx < 0) goNext(); else goPrev(); }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center select-none" style={{ touchAction: "none" }}>
      <button onClick={onClose} className="absolute top-[env(safe-area-inset-top)] end-3 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white">
        <X size={22} />
      </button>
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointers.current.clear(); pinchStart.current = null; swipeStart.current = null; panStart.current = null; setGesturing(false); resetZoom(); }}
      >
        <img
          src={images[active]}
          alt=""
          draggable={false}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: gesturing ? "none" : "transform 0.2s ease-out",
          }}
        />
      </div>
      {images.length > 1 && (
        <>
          <button onClick={goPrev} disabled={active === 0} className="absolute start-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
            <ChevronLeft size={24} className="rtl:rotate-180" />
          </button>
          <button onClick={goNext} disabled={active === images.length - 1} className="absolute end-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
            <ChevronRight size={24} className="rtl:rotate-180" />
          </button>
          <div className="absolute bottom-[env(safe-area-inset-bottom)] inset-x-0 flex justify-center items-center gap-1.5 pb-4 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all ${i === active ? "bg-white w-4" : "bg-white/40 w-2"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}