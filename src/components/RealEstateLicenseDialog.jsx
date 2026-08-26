import React, { useState, useEffect } from "react";
import { Building2, ShieldCheck, BadgeCheck, Clock, X, Loader2, ImagePlus, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const LICENSE_TYPES = [
  { id: "individual_fal", ar: "رخصة فال (فرد)", en: "FAL (Individual)" },
  { id: "establishment_fal", ar: "رخصة فال (منشأة)", en: "FAL (Establishment)" },
];

export default function RealEstateLicenseDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const ar = lang === "ar";
  const status = user?.re_license_status || "";

  const [licenseType, setLicenseType] = useState(user?.re_license_type || "");
  const [licenseNumber, setLicenseNumber] = useState(user?.re_license_number || "");
  const [licenseHolder, setLicenseHolder] = useState(user?.re_license_holder || "");
  const [licenseExpiry, setLicenseExpiry] = useState(user?.re_license_expiry ? String(user.re_license_expiry).slice(0, 10) : "");
  const [licenseDoc, setLicenseDoc] = useState(user?.re_license_doc || "");
  const [establishmentNumber, setEstablishmentNumber] = useState(user?.re_establishment_number || "");
  const [docUploading, setDocUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Reset edit mode whenever the dialog is opened so an approved license
  // shows its read-only view first, not a stale edit form from a prior open.
  useEffect(() => { if (open) setEditMode(false); }, [open]);

  if (!open) return null;

  const trusted = !!user?.is_trusted;
  const editing = trusted && (status === "" || status === "rejected" || status === "expired" || editMode);
  const valid = licenseType && licenseNumber.trim() && licenseHolder.trim() && licenseExpiry && licenseDoc && (licenseType !== "establishment_fal" || establishmentNumber.trim());

  const uploadDoc = async (file) => {
    setDocUploading(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      setLicenseDoc(r.file_url);
    } catch {
      toast({ title: ar ? "تعذّر رفع الملف" : "Upload failed", variant: "destructive" });
    }
    setDocUploading(false);
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke("submitRealEstateLicense", {
        license_type: licenseType,
        license_number: licenseNumber.trim(),
        license_holder: licenseHolder.trim(),
        license_expiry: licenseExpiry,
        license_doc: licenseDoc,
        establishment_number: establishmentNumber.trim(),
      });
      await refreshUser();
      setEditMode(false);
      toast({ title: ar ? "تم إرسال ترخيصك للمراجعة" : "License submitted for review" });
      onClose();
    } catch (e) {
      toast({ title: ar ? "فشل الإرسال" : "Failed to submit", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const typeLabel = (t) => {
    const m = LICENSE_TYPES.find((x) => x.id === t);
    return m ? (ar ? m.ar : m.en) : t || "-";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Building2 size={20} className="text-indigo-500" /> {ar ? "ترخيص الوساطة العقارية" : "Real Estate License"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{ar ? "أدخل ترخيصك مرة واحدة لتتمكن من نشر إعلانات عقارية في السعودية." : "Enter your license once to post real estate listings in Saudi Arabia."}</p>

        <div className="flex items-center gap-2 mb-3">
          {status === "approved" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-bold"><BadgeCheck size={12} /> {ar ? "معتمد" : "Approved"}</span>}
          {status === "pending" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[11px] font-bold"><Clock size={12} /> {ar ? "قيد المراجعة" : "Pending"}</span>}
          {status === "rejected" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-[11px] font-bold"><X size={12} /> {ar ? "مرفوض" : "Rejected"}</span>}
          {status === "expired" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[11px] font-bold"><Clock size={12} /> {ar ? "منتهية" : "Expired"}</span>}
          {status === "" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold">{ar ? "غير مُدخل" : "Not added"}</span>}
        </div>

        {!trusted && (
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 text-sm text-sky-700 dark:text-sky-300 flex items-start gap-2">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <span>{ar ? "يجب توثيق حسابك أولاً قبل إضافة ترخيص الوساطة العقارية." : "You must verify your account before adding a real estate license."}</span>
          </div>
        )}

        {status === "rejected" && user?.re_license_review_reason && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 mb-3">
            {ar ? "سبب الرفض: " : "Rejection reason: "}{user.re_license_review_reason}
          </div>
        )}
        {status === "expired" && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300 mb-3">
            {ar ? "انتهت صلاحية ترخيصك. يرجى تحديث بيانات الترخيص وإعادة إرسالها للمراجعة." : "Your license has expired. Please update your license details and resubmit for review."}
          </div>
        )}

        {status === "approved" && !editing && (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><p className="text-muted-foreground">{ar ? "نوع الترخيص" : "License type"}</p><p className="font-semibold">{typeLabel(user.re_license_type)}</p></div>
              <div><p className="text-muted-foreground">{ar ? "رقم الترخيص" : "License number"}</p><p className="font-semibold font-mono">{user.re_license_number}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground">{ar ? "صاحب الترخيص" : "License holder"}</p><p className="font-semibold">{user.re_license_holder}</p></div>
              {user.re_establishment_number && <div className="col-span-2"><p className="text-muted-foreground">{ar ? "الرقم الموحد للمنشأة" : "Establishment number"}</p><p className="font-semibold font-mono">{user.re_establishment_number}</p></div>}
              <div><p className="text-muted-foreground">{ar ? "تاريخ الانتهاء" : "Expiry"}</p><p className="font-semibold">{user.re_license_expiry ? new Date(user.re_license_expiry).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}</p></div>
            </div>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="w-full py-2.5 rounded-xl bg-card border border-border/70 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-muted transition"
            >
              {ar ? "تعديل بيانات الترخيص" : "Change details"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">{ar ? "يمكنك تحديث بيانات الترخيص وإعادة إرسالها للمراجعة." : "Update your license details and resubmit for review."}</p>
          </>
        )}

        {status === "pending" && (
          <p className="text-xs text-muted-foreground">{ar ? "سيتمكن إعلانك العقاري من النشر فور اعتماد الترخيص من الإدارة." : "You'll be able to post real estate listings once your license is approved."}</p>
        )}

        {editing && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "نوع الترخيص" : "License type"} *</label>
              <div className="flex flex-wrap gap-2">
                {LICENSE_TYPES.map((lt) => (
                  <button key={lt.id} type="button" onClick={() => setLicenseType(lt.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${licenseType === lt.id ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70"}`}>
                    {ar ? lt.ar : lt.en}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "رقم الترخيص" : "License number"} *</label>
              <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.slice(0, 50))} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "اسم صاحب الترخيص" : "License holder name"} *</label>
              <input value={licenseHolder} onChange={(e) => setLicenseHolder(e.target.value.slice(0, 80))} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm" />
            </div>
            {licenseType === "establishment_fal" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold">{ar ? "الرقم الموحد للمنشأة" : "Unified establishment number"} *</label>
                <input value={establishmentNumber} onChange={(e) => setEstablishmentNumber(e.target.value.slice(0, 50))} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "تاريخ انتهاء الرخصة" : "License expiry date"} *</label>
              <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "مستند الترخيص" : "License document"} *</label>
              {licenseDoc ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted">
                  <a href={licenseDoc} target="_blank" rel="noreferrer" className="flex-1 text-sm text-primary font-semibold truncate">{ar ? "عرض الترخيص" : "View license"}</a>
                  <button type="button" onClick={() => setLicenseDoc("")} className="p-1 rounded-full hover:bg-muted"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted border-2 border-dashed border-border/60 cursor-pointer hover:bg-muted/70">
                  {docUploading ? <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> : <ImagePlus size={18} />}
                  <span className="text-xs font-semibold">{ar ? "ارفع صورة أو PDF للترخيص" : "Upload license image or PDF"}</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadDoc(f); }} />
                </label>
              )}
            </div>
            <button onClick={submit} disabled={!valid || submitting} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {status === "rejected" || status === "expired" || (status === "approved" && editMode) ? (ar ? "إعادة الإرسال للمراجعة" : "Re-submit for review") : (ar ? "إرسال للمراجعة" : "Submit for review")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}