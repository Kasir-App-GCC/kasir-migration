import React, { useState, useEffect, useRef } from "react";
import { Check, Camera, FileText, MapPin, Tag, X, Sparkles } from "lucide-react";

// A floating, always-visible completeness indicator. Sits as a small circular
// progress ring at the bottom corner of the viewport while the user scrolls
// the form; taps expand a checklist popover so they can see exactly what's
// left to fill in. Replaces the old inline card that disappeared on scroll.
export default function CompletenessDock({ images, title, description, price, category, city }) {
  const ar = document.documentElement?.dir === "rtl";
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const checks = [
    { icon: Camera, label: ar ? "صورة واحدة على الأقل" : "1+ photo", done: (images?.length || 0) >= 1 },
    { icon: Tag, label: ar ? "السعر والتصنيف" : "Price & category", done: !!price && !!category },
    { icon: MapPin, label: ar ? "الموقع" : "Location set", done: !!city },
  ];
  const score = checks.filter((c) => c.done).length;
  const pct = Math.round((score / checks.length) * 100);
  const done = pct === 100;

  // Close the popover on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  // Circular ring geometry.
  const R = 18;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <div ref={popRef} className={`fixed bottom-5 ${ar ? "left-4" : "right-4"} z-40 flex flex-col items-end gap-2`}>
      {/* Expanded checklist */}
      {open && (
        <div className="w-64 rounded-2xl bg-card border border-border/60 shadow-2xl p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-bold flex items-center gap-1.5">
              {done ? <Sparkles size={14} className="text-emerald-500" /> : null}
              {ar ? "اكتمال الإعلان" : "Listing completeness"}
            </p>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted -m-1">
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.label} className={`flex items-center gap-2 text-xs ${c.done ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-500 text-white" : "bg-muted-foreground/15"}`}>
                  {c.done ? <Check size={12} /> : <c.icon size={12} />}
                </span>
                {c.label}
              </div>
            ))}
          </div>
          {pct < 100 ? (
            <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
              {ar ? "الإعلانات الأكثر اكتمالاً تحصل على مشاهدات أكثر" : "More complete listings get more views"}
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 font-semibold mt-2.5">
              {ar ? "إعلانك جاهز للنشر! 🎉" : "Your listing is ready! 🎉"}
            </p>
          )}
        </div>
      )}

      {/* Compact circular ring button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ar ? "اكتمال الإعلان" : "Listing completeness"}
        className={`relative w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 ${done ? "bg-emerald-500" : "bg-card border border-border/60"}`}
      >
        <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={R} fill="none" stroke={done ? "rgba(255,255,255,0.25)" : "hsl(var(--muted))"} strokeWidth="3" />
          <circle
            cx="24" cy="24" r={R} fill="none"
            stroke={done ? "#fff" : "#f59e0b"}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <span className={`text-xs font-extrabold ${done ? "text-white" : "text-amber-600"}`}>{pct}%</span>
      </button>
    </div>
  );
}