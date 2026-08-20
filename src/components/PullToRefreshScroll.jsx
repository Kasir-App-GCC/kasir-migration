import React, { useRef, useState, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";

const THRESHOLD = 70;

// Pull-to-refresh bound to a scroll container (not the window). Only activates
// when the container is scrolled to the very top, so normal scrolling is
// unaffected. Desktop (mouse) is untouched.
export default function PullToRefreshScroll({ onRefresh, className = "", children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const scrollRef = useRef(null);

  const setP = (v) => { pullRef.current = v; setPull(v); };

  const onTouchStart = useCallback((e) => {
    if (refreshingRef.current) return;
    const el = scrollRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    } else {
      startY.current = null;
      active.current = false;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!active.current || startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setP(Math.min(dy * 0.5, 100));
    else setP(0);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
      refreshingRef.current = true;
      setRefreshing(true);
      setP(THRESHOLD);
      try { await onRefresh(); } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setP(0);
      }
    } else {
      setP(0);
    }
  }, [onRefresh]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const visible = pull > 0 || refreshing;

  return (
    <div className="relative flex-1 min-h-0">
      <div
        className="absolute top-0 inset-x-0 z-10 flex justify-center pointer-events-none transition-transform duration-150"
        style={{ transform: `translateY(${pull}px)`, opacity: visible ? 1 : 0 }}
      >
        <div className="mt-1 w-9 h-9 rounded-full bg-background border border-border/60 shadow-lg flex items-center justify-center">
          {refreshing ? (
            <Loader2 size={18} className="text-primary animate-spin" />
          ) : (
            <ChevronDown size={18} className={`text-primary transition-transform ${progress >= 1 ? "rotate-180" : ""}`} />
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
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