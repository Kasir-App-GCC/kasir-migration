import React, { useState } from "react";
import { FileText, ImagePlus, X, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

// Per-listing REGA ad-license fields for Saudi real estate.
// Shown only when the seller is an approved Fal broker (the Fal license
// info is auto-copied from their profile; this component collects the
// per-property ad license + title deed + brokerage contract + mortgage
// disclosure that REGA requires for every published real estate ad).
export default function RealEstateAdLicenseFields({ value, onChange }) {
  const { lang } = useStore();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [deedUploading, setDeedUploading] = useState(false);

  const set = (k, v) => onChange({ ...value, [k]: v });

  const uploadDeed = async (file) => {
    setDeedUploading(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      set("re_title_deed_doc", r.file_url);
    } catch {
      toast({ title: ar ? "تعذّر رفع الملف" : "Upload failed", variant: "destructive" });
    }
    setDeedUploading(false);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm";
  const labelCls = "text-xs font-semibold";

  return (
    <div className="p-3.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-indigo-500 shrink-0" />
        <div>
          <p className="text-sm font-bold">{ar ? "ترخيص إعلان هذا العقار" : "Ad license for this property"}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {ar ? "كل إعلان عقاري يحتاج ترخيص إعلان من REGA. أدخل بيانات الترخيص لهذا العقار." : "Each real estate ad needs its own REGA ad license. Enter the license details for this property."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 col-span-2">
          <label className={labelCls}>{ar ? "رقم الإعلان" : "Ad license number"} <span className="text-rose-500">*</span></label>
          <input value={value.re_ad_license_number || ""} onChange={(e) => set("re_ad_license_number", e.target.value.slice(0, 50))} className={inputCls} />
        </div>
        <div className="space-y-1 col-span-2">
          <label className={labelCls}>{ar ? "رابط استعلام رخصة الإعلان" : "Ad license inquiry link"} <span className="text-rose-500">*</span></label>
          <input type="url" value={value.re_ad_license_link || ""} onChange={(e) => set("re_ad_license_link", e.target.value.slice(0, 500))} placeholder="https://eservicesredp.rega.gov.sa/..." dir="ltr" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>{ar ? "تاريخ انتهاء الترخيص" : "Ad license expiry"} <span className="text-rose-500">*</span></label>
          <input type="date" value={value.re_ad_license_expiry ? String(value.re_ad_license_expiry).slice(0, 10) : ""} onChange={(e) => set("re_ad_license_expiry", e.target.value)} min={new Date().toISOString().slice(0, 10)} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>{ar ? "رقم عقد الوساطة" : "Brokerage contract no."} <span className="text-rose-500">*</span></label>
          <input value={value.re_brokerage_contract_number || ""} onChange={(e) => set("re_brokerage_contract_number", e.target.value.slice(0, 50))} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>{ar ? "رقم صك الملكية" : "Title deed number"} <span className="text-rose-500">*</span></label>
          <input value={value.re_title_deed_number || ""} onChange={(e) => set("re_title_deed_number", e.target.value.slice(0, 50))} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>{ar ? "المساحة حسب الصك" : "Area per deed"} <span className="text-rose-500">*</span></label>
          <input value={value.re_deed_area || ""} onChange={(e) => set("re_deed_area", e.target.value.slice(0, 60))} className={inputCls} />
        </div>
        <div className="space-y-1 col-span-2">
          <label className={labelCls}>{ar ? "المخطط والقطعة" : "Plan & plot"} <span className="text-rose-500">*</span></label>
          <input value={value.re_plan_plot || ""} onChange={(e) => set("re_plan_plot", e.target.value.slice(0, 80))} className={inputCls} />
        </div>
      </div>

      {/* Title deed upload */}
      <div className="space-y-1">
        <label className={labelCls}>{ar ? "صك الملكية (صورة أو PDF)" : "Title deed (image or PDF)"} <span className="text-rose-500">*</span></label>
        {value.re_title_deed_doc ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted">
            <FileText size={16} className="text-muted-foreground shrink-0" />
            <a href={value.re_title_deed_doc} target="_blank" rel="noreferrer" className="flex-1 text-sm text-primary font-semibold truncate">{ar ? "عرض الصك" : "View deed"}</a>
            <button type="button" onClick={() => set("re_title_deed_doc", "")} className="p-1 rounded-full hover:bg-muted"><X size={14} /></button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted border-2 border-dashed border-border/60 cursor-pointer hover:bg-muted/70">
            {deedUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            <span className="text-xs font-semibold">{ar ? "ارفع صورة أو PDF للصك" : "Upload deed image or PDF"}</span>
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadDeed(f); }} />
          </label>
        )}
      </div>

      {/* Mortgage / restriction disclosure */}
      <div className="space-y-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
        <label className="flex items-center justify-between">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" />
            {ar ? "هل يوجد رهن أو قيد على العقار؟" : "Any mortgage or restriction on the property?"}
          </span>
          <button type="button" onClick={() => set("re_has_mortgage", !value.re_has_mortgage)} className={`w-11 h-6 rounded-full p-0.5 transition ${value.re_has_mortgage ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${value.re_has_mortgage ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
          </button>
        </label>
        {value.re_has_mortgage && (
          <input value={value.re_mortgage_details || ""} onChange={(e) => set("re_mortgage_details", e.target.value.slice(0, 200))} placeholder={ar ? "تفاصيل الرهن أو القيد…" : "Mortgage/restriction details…"} className={inputCls} />
        )}
      </div>
    </div>
  );
}