import React, { useState, useRef } from "react";
import { Trash2 } from "lucide-react";

const REVEAL = 80;
const TRIGGER = 140;

export default function SwipeToDelete({ children, onDelete, label }) {
  const [x, setX] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const start = useRef(null);
  const dragging = useRef(false);
  const width = useRef(0);

  const onDown = (e) => {
    dragging.current = true;
    start.current = { x: e.clientX, baseX: x };
    width.current = e.currentTarget.parentElement?.offsetWidth || 300;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging.current || start.current == null) return;
    const dx = e.clientX - start.current.x;
    // Only allow dragging to the left (negative), clamped
    const next = Math.max(-width.current, Math.min(0, start.current.baseX + dx));
    setX(next);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    start.current = null;
    if (x <= -TRIGGER) {
      onDelete();
      setX(0);
      setRevealed(false);
    } else if (x <= -REVEAL / 2) {
      setX(-REVEAL);
      setRevealed(true);
    } else {
      setX(0);
      setRevealed(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <div className="absolute inset-0 flex items-center justify-end pe-5 bg-rose-600">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-white font-bold text-sm"
          aria-label={label}
        >
          <Trash2 size={18} /> {label}
        </button>
      </div>
      {/* Foreground */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ transform: `translateX(${x}px)`, touchAction: "pan-y" }}
        className="relative bg-card transition-transform duration-200"
      >
        {children}
      </div>
    </div>
  );
}