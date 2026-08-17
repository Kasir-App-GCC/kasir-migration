import { useRef, useEffect } from "react";

// Enables horizontal scroll on desktop (mouse drag + vertical wheel → horizontal)
// while leaving native touch scrolling untouched on mobile.
export function useDragScroll() {
  const ref = useRef(null);
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    const onMove = (e) => {
      const el = ref.current;
      if (!el || !state.current.down) return;
      const dx = e.clientX - state.current.startX;
      if (Math.abs(dx) > 5) state.current.moved = true;
      el.scrollLeft = state.current.startScroll - dx;
    };
    const onUp = () => { state.current.down = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (e) => {
    // Let touch devices use native scrolling
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    state.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };

  // Prevent a button click if the drag moved beyond a threshold
  const onClickCapture = (e) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  };

  // Translate vertical wheel into horizontal scroll
  const onWheel = (e) => {
    const el = ref.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  return { ref, onPointerDown, onClickCapture, onWheel };
}