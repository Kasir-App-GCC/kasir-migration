import React from "react";
import { Check, Camera, FileText, MapPin, Tag } from "lucide-react";

// Gentle listing-quality meter: shows sellers what they can add to get more
// views, inspired by Aqar/OLX listing-completeness indicators.
export default function ListingCompleteness({ images, title, description, price, category, city }) {
  const ar = document.documentElement?.dir === "rtl";
  const checks = [
    { icon: Camera, label: ar ? "3 صور أو أكثر" : "3+ photos", done: (images?.length || 0) >= 3 },
    { icon: FileText, label: ar ? "وصف مفصّل" : "Detailed description", done: (description?.trim().length || 0) >= 30 },
    { icon: Tag, label: ar ? "السعر والتصنيف" : "Price & category", done: !!price && !!category },
    { icon: MapPin, label: ar ? "الموقع" : "Location set", done: !!city },
  ];
  const score = checks.filter((c) => c.done).length;
  const pct = Math.round((score / checks.length) * 100);

  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-bold">{ar ? "اكتمال الإعلان" : "Listing completeness"}</p>
        <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.done ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-500 text-white" : "bg-muted-foreground/15"}`}>
              {c.done ? <Check size={12} /> : <c.icon size={12} />}
            </span>
            {c.label}
          </div>
        ))}
      </div>
      {pct < 100 && (
        <p className="text-[11px] text-muted-foreground mt-2.5">
          {ar ? "الإعلانات الأكثر اكتمالاً تحصل على مشاهدات أكثر" : "More complete listings get more views"}
        </p>
      )}
    </div>
  );
}