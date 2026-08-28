import React, { useState, useEffect, useRef } from "react";
import { Check, Camera, FileText, MapPin, Tag, X, Sparkles, ShieldCheck } from "lucide-react";

// A floating, always-visible completeness indicator. Sits as a small circular
// progress ring pinned to the bottom-left (LTR) / bottom-right (RTL) above the
// bottom nav while the user scrolls the form; taps expand a checklist popover
// so they can see exactly what's left to fill in.
//
// For Saudi real estate listings, extra checks are added:
//   - No approved FAL license → a permanently-incomplete item caps the bar
//     below 100% until the seller adds one from their profile.
//   - Approved FAL license → per-listing ad license details must be complete.
export default function CompletenessDock({ images, title, description, price, category, city, saRealEstate, reApproved, adLicenseValid }) {
  const ar = document.documentElement?.dir === "rtl";
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const checks = [
    { icon: Camera, label: ar ? "صورة واحدة على الأقل" : "1+ photo", done: (images?.length || 0) >= 1 },
    { icon: Tag, label: ar ? "السعر والتصنيف" : "Price & category", done: !!price && !!category },
    { icon: MapPin, label: ar ? "الموقع" : "Location set", done: !!city },
  ];

  // Real estate adds extra requirements. Without an approved FAL license the
  // bar can never reach 100% — the seller must add one from their profile.
  if (saRealEstate) {
    if (!reApproved) {
      checks.push({ icon: ShieldCheck, label: ar ? "ترخيص فال (من الملف الشخصي)" : "FAL license (from profile)", done: false });
    } else {
      checks.push({ icon: FileText, label: ar ? "بيانات ترخيص الإعلان" : "Ad license details", done: !!adLicenseValid });
    }
  }

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

  return (
    <div
      ref={popRef}
      className={`fixed z-40 flex flex-col items-${ar ? "end" : "start"} gap-2 ${ar ? "right-4" : "left-4"}`}
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 0.75rem)" }}
    >
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

      {/* Vertical lights — one segment per section, lights up emerald when complete */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ar ? "اكتمال الإعلان" : "Listing completeness"}
        className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-card/90 backdrop-blur border border-border/60 shadow-lg active:scale-95 transition"
      >
        {checks.map((c, i) => (
          <span
            key={i}
            className={`w-3.5 rounded-full transition-all duration-500 ${c.done ? "bg-emerald-500 shadow-[0_0_10px_3px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300/50" : "bg-muted-foreground/25 ring-1 ring-border/40"}`}
            style={{ height: `${Math.round(40 / checks.length) + 20}px` }}
          />
        ))}
      </button>
    </div>
  );
}