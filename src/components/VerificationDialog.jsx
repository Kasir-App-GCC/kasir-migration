import React, { useState } from "react";
import { X, Upload, Loader2, BadgeCheck, Camera, FileCheck2, CreditCard, Receipt } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { VERIFICATION_FEE, TRANSFER_METHODS } from "@/lib/verificationPayment";
import CopyButton from "@/components/CopyButton";

const MAX_FILE = 10 * 1024 * 1024; // 10MB

export default function VerificationDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone ? (user.country_code || "") + user.phone : "");
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  if (!open) return null;

  const hasAvatar = !!user?.avatar;

  const onPickReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE) {
      setError(ar ? "الحجم الأقصى 10 ميجابايت" : "Max file size is 10MB");
      return;
    }
    setUploadingReceipt(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPaymentReceiptUrl(file_url);
      setReceiptName(file.name);
    } catch {
      setError(ar ? "فشل رفع الملف" : "Failed to upload file");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!hasAvatar) {
      setError(ar ? "أضف صورة شخصية أولاً من تعديل الملف" : "Please add a profile photo first from Edit Profile");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !nationalId.trim() || !paymentReceiptUrl) {
      setError(ar ? "أكمل جميع الحقول بما فيها إيصال الدفع" : "Please complete all fields including the payment receipt");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitVerification", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        paymentReceiptUrl,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({ title: ar ? "تم إرسال طلب التوثيق" : "Verification request submitted", description: ar ? "سنطلعك عند المراجعة" : "We'll notify you once reviewed" });
      onClose();
    } catch (err) {
      setError(err.message || (ar ? "فشل الإرسال" : "Failed to submit"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><BadgeCheck size={20} className="text-sky-500" /> {ar ? "توثيق الحساب" : "Account verification"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        {!hasAvatar && (
          <div className="mb-4 p-3 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-sm flex items-start gap-2">
            <Camera size={16} className="shrink-0 mt-0.5" />
            <span>{ar ? "يلزم وجود صورة شخصية قبل طلب التوثيق. أضف صورة من «تعديل الملف»." : "A profile photo is required before requesting verification. Add one from Edit Profile."}</span>
          </div>
        )}

        {error && <div className="mb-3 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">{error}</div>}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "الاسم الكامل" : "Full name"} *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "رقم الجوال" : "Phone number"} *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "رقم الهوية" : "National ID"} *</label>
            <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} inputMode="numeric" className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          {/* Verification fee + payment receipt */}
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-2">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
              <CreditCard size={16} />
              <span className="text-sm font-bold">{ar ? "رسوم التوثيق" : "Verification fee"}</span>
              <span className="ms-auto font-extrabold">{VERIFICATION_FEE} {ar ? "ر.س" : "SAR"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ar ? "حوّل المبلغ إلى الحساب البنكي التالي ثم ارفع إيصال الدفع:" : "Transfer the amount to the bank account below, then upload the payment receipt:"}</p>
            <div className="space-y-1">
              {TRANSFER_METHODS.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs bg-background/60 rounded-lg px-2.5 py-1.5">
                  <span className="font-semibold">{ar ? m.ar : m.en}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground selectable" dir="ltr">
                    {m.detail}
                    {m.iban && <CopyButton value={m.iban} />}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-1.5"><Receipt size={14} /> {ar ? "إيصال الدفع" : "Payment receipt"} * <span className="text-xs text-muted-foreground font-normal">({ar ? "حد أقصى 10 ميجابايت" : "10MB max"})</span></label>
            <label className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition">
              {uploadingReceipt ? <Loader2 size={18} className="animate-spin" /> : paymentReceiptUrl ? <FileCheck2 size={18} className="text-emerald-500" /> : <Upload size={18} />}
              <span className="text-sm font-medium">{uploadingReceipt ? (ar ? "جاري الرفع…" : "Uploading…") : paymentReceiptUrl ? (receiptName || (ar ? "تم الرفع" : "Uploaded")) : (ar ? "ارفع صورة الإيصال" : "Upload receipt")}</span>
              <input type="file" className="hidden" onChange={onPickReceipt} accept="image/*,application/pdf" />
            </label>
          </div>

          <button onClick={submit} disabled={submitting || uploadingReceipt || !hasAvatar || !paymentReceiptUrl} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? (ar ? "جاري الإرسال…" : "Submitting…") : (ar ? "إرسال الطلب" : "Submit request")}
          </button>
        </div>
      </div>
    </div>
  );
}