import React, { useState, useRef } from "react";
import { Trash2 } from "lucide-react";

const REVEAL = 80;
const TRIGGER = 140;
const DRAG_THRESHOLD = 6;

export default function SwipeToDelete({ children, onDelete, label }) {
  const [x, setX] = useState(0);
  const start = useRef(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const width = useRef(0);

  const onDown = (e) => {
    start.current = { x: e.clientX, baseX: x };
    width.current = e.currentTarget.parentElement?.offsetWidth || 300;
    moved.current = false;
  };

  const onMove = (e) => {
    if (start.current == null) return;
    const dx = e.clientX - start.current.x;
    if (!dragging.current && Math.abs(dx) > DRAG_THRESHOLD) {
      dragging.current = true;
      moved.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (!dragging.current) return;
    const next = Math.max(-width.current, Math.min(0, start.current.baseX + dx));
    setX(next);
  };

  const onUp = (e) => {
    if (!dragging.current) {
      start.current = null;
      return;
    }
    dragging.current = false;
    start.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (x <= -TRIGGER) {
      onDelete();
      setX(0);
    } else if (x <= -REVEAL / 2) {
      setX(-REVEAL);
    } else {
      setX(0);
    }
  };

  // Block the click that follows a drag so the row doesn't navigate
  const onClickCapture = (e) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-end pe-5 bg-rose-600">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-white font-bold text-sm"
          aria-label={label}
        >
          <Trash2 size={18} /> {label}
        </button>
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
        style={{ transform: `translateX(${x}px)`, touchAction: "pan-y" }}
        className="relative bg-card transition-transform duration-200"
      >
        {children}
      </div>
    </div>
  );
}