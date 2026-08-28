import React from "react";
import { Check } from "lucide-react";

/**
 * A single node in a vertical timeline. `state` controls the dot:
 *  - "done": green check (step completed)
 *  - "active": primary, pulsing (current step awaiting action)
 *  - "pending": muted (not yet reached)
 * A connector line is drawn to the next step unless `isLast`.
 */
export default function TimelineStep({ state, icon: Icon, title, subtitle, children, isLast }) {
  const done = state === "done";
  const active = state === "active";
  const dot = done
    ? "bg-emerald-500 text-white"
    : active
      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
      : "bg-muted text-muted-foreground border border-border/60";
  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className={`absolute start-[15px] top-8 bottom-0 w-0.5 ${done ? "bg-emerald-400/50" : "bg-border/60"}`} />
      )}
      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${dot} ${active ? "animate-pulse" : ""}`}>
        {done ? <Check size={15} /> : <Icon size={15} />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-4"}`}>
        <p className="text-sm font-bold leading-tight">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        {children && <div className="mt-2 space-y-2">{children}</div>}
      </div>
    </div>
  );
}