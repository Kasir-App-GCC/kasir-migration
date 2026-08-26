import React, { useState } from "react";
import { X, MapPin, Eye, Heart, Calendar, Building2, FileText, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useStore } from "@/lib/store";
import { Image } from "@/components/ui/image";
import Price from "@/components/Price";
import { getCategory, getCityName, getCondition, getSubcategories } from "@/lib/constants";
import { getSpecFields } from "@/lib/specs";

export default function AdminItemPreview({ item, onClose }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const [idx, setIdx] = useState(0);
  if (!item) return null;

  const imgs = item.images?.length
    ? item.images
    : ["https://picsum.photos/seed/" + encodeURIComponent(item.title || item.id) + "/600/600"];
  const cond = getCondition(item.condition);
  const cat = getCategory(item.category);
  const subs = Array.isArray(item.subcategory) ? item.subcategory : [];
  const specFields = getSpecFields(item.category);

  const licenseTypeLabel = (t) => {
    const map = {
      individual_fal: ar ? "رخصة فال (فرد)" : "FAL (Individual)",
      establishment_fal: ar ? "رخصة فال (منشأة)" : "FAL (Establishment)",
      ad_license: ar ? "ترخيص إعلان عقاري" : "Ad License",
    };
    return map[t] || t || "-";
  };

  const step = (d) => setIdx((i) => (i + d + imgs.length) % imgs.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-background rounded-3xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/95 backdrop-blur border-b border-border">
          <h3 className="font-bold text-base">{ar ? "تفاصيل الإعلان" : "Listing Details"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image gallery */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted group">
            <Image src={imgs[idx]} fittingType="fill" className="w-full h-full" />
            {imgs.length > 1 && (
              <>
                <button onClick={() => step(-1)} className="absolute top-1/2 -translate-y-1/2 start-2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow flex items-center justify-center">
                  <ChevronLeft size={18} className="rtl:rotate-180" />
                </button>
                <button onClick={() => step(1)} className="absolute top-1/2 -translate-y-1/2 end-2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow flex items-center justify-center">
                  <ChevronRight size={18} className="rtl:rotate-180" />
                </button>
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                  {imgs.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
            {item.review_status === "pending" && (
              <span className="absolute top-2 end-2 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                {ar ? "قيد المراجعة" : "Pending"}
              </span>
            )}
          </div>

          {/* Title + price */}
          <div>
            <h4 className="font-bold text-lg leading-snug">{item.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold text-primary"><Price value={item.price} lang={lang} country={item.country || "SA"} /></span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${cond?.color}`}>{ar ? cond?.ar : cond?.en}</span>
            </div>
          </div>

          {/* Category + subcategories */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-muted font-semibold">{ar ? cat?.ar : cat?.en}</span>
            {subs.map((s) => {
              const sub = getSubcategories(item.category).find((x) => x.en === s);
              return (
                <span key={s} className="px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground text-xs">
                  {sub ? (lang === "ar" ? sub.ar : sub.en) : s}
                </span>
              );
            })}
          </div>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                  <Tag size={9} /> {t}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div>
              <p className="text-sm font-semibold mb-1">{ar ? "الوصف" : "Description"}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap selectable leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Specs */}
          {specFields.length > 0 && item.specs && Object.keys(item.specs).length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-1.5">{ar ? "المواصفات" : "Specifications"}</p>
              <div className="grid grid-cols-2 gap-2">
                {specFields.map((f) => item.specs[f.key] != null && item.specs[f.key] !== "" && (
                  <div key={f.key} className="rounded-lg bg-muted px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground">{ar ? f.ar : f.en}</p>
                    <p className="text-sm font-semibold">{item.specs[f.key]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={15} className="text-muted-foreground shrink-0" />
            <span>{item.location_name || getCityName(item.city, lang)}</span>
          </div>

          {/* License details (real estate) */}
          {item.category === "realestate" && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
                <Building2 size={15} /> {ar ? "ترخيص الإعلان العقاري" : "Real Estate Ad License"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">{ar ? "نوع الترخيص" : "License type"}</p>
                  <p className="font-semibold">{licenseTypeLabel(item.re_license_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{ar ? "رقم الترخيص" : "License number"}</p>
                  <p className="font-semibold font-mono">{item.re_license_number || "-"}</p>
                </div>
              </div>
              {item.re_license_doc && (
                <a href={item.re_license_doc} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <FileText size={14} /> {ar ? "عرض مستند الترخيص" : "View license document"}
                </a>
              )}
            </div>
          )}

          {/* Meta stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="inline-flex items-center gap-1">
              <Eye size={13} /> {new Intl.NumberFormat(ar ? "ar-SA" : "en-US").format(item.views || 0)} {ar ? "مشاهدة" : "views"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={13} /> {new Intl.NumberFormat(ar ? "ar-SA" : "en-US").format(item.favorites_count || 0)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} /> {new Date(item.created_date).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}