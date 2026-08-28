import React, { useRef, useState, useCallback, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";

const THRESHOLD = 70;

// Unified pull-to-refresh.
// - Window mode (default): binds to the window scroll. Used by Home/Search.
// - Container mode (when `scrollRef` is provided): renders its own scrollable
//   div and forwards the ref so callers can observe it (e.g. ChatRoom's
//   IntersectionObserver for read receipts). Used by ChatRoom.
// Only activates when already scrolled to the very top, so normal scrolling
// and in-card carousels are unaffected. Desktop (mouse) is untouched.
export default function PullToRefresh({ onRefresh, children, scrollRef, className = "" }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const internalRef = useRef(null);
  const elRef = scrollRef || internalRef;
  const isContainer = !!scrollRef;

  const setP = (v) => { pullRef.current = v; setPull(v); };

  const atTop = useCallback(() => {
    if (isContainer) return !!elRef.current && elRef.current.scrollTop <= 0;
    return window.scrollY <= 0;
  }, [isContainer, elRef]);

  const onTouchStart = useCallback((e) => {
    if (refreshingRef.current) return;
    if (atTop()) { startY.current = e.touches[0].clientY; active.current = true; }
    else { startY.current = null; active.current = false; }
  }, [atTop]);

  const onTouchMove = useCallback((e) => {
    if (!active.current || startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setP(Math.min(dy * 0.5, 100)); else setP(0);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
      refreshingRef.current = true; setRefreshing(true); setP(THRESHOLD);
      try { await onRefresh(); } finally {
        refreshingRef.current = false; setRefreshing(false); setP(0);
      }
    } else setP(0);
  }, [onRefresh]);

  useEffect(() => {
    if (isContainer) return;
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd, isContainer]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const visible = pull > 0 || refreshing;
  const indicatorClass = isContainer
    ? "absolute top-0 inset-x-0 z-10 flex justify-center pointer-events-none transition-transform duration-150"
    : "fixed top-0 inset-x-0 z-[60] flex justify-center pointer-events-none transition-transform duration-150";
  const indicator = (
    <div className={indicatorClass} style={{ transform: `translateY(${pull}px)`, opacity: visible ? 1 : 0 }}>
      <div className="mt-1 w-9 h-9 rounded-full bg-background border border-border/60 shadow-lg flex items-center justify-center">
        {refreshing ? (
          <Loader2 size={18} className="text-primary animate-spin" />
        ) : (
          <ChevronDown size={18} className={`text-primary transition-transform ${progress >= 1 ? "rotate-180" : ""}`} />
        )}
      </div>
    </div>
  );

  if (isContainer) {
    return (
      <div className="relative flex-1 min-h-0">
        {indicator}
        <div
          ref={elRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          className={`absolute inset-0 overflow-y-auto overscroll-y-contain ${className}`}
        >
          {children}
        </div>
      </div>
    );
  }
  return (<>{indicator}{children}</>);
}