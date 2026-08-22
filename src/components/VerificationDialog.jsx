import React, { useState } from "react";
import { X, Loader2, BadgeCheck, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import PhoneOtpVerifier from "@/components/PhoneOtpVerifier";
import { userPhoneE164, digitsOnly } from "@/lib/phone";

export default function VerificationDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [fullName, setFullName] = useState(user?.name || "");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneE164, setPhoneE164] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const hasAvatar = !!user?.avatar;

  const submit = async () => {
    setError("");
    if (!hasAvatar) {
      setError(ar ? "أضف صورة شخصية أولاً من تعديل الملف" : "Please add a profile photo first from Edit Profile");
      return;
    }
    if (!fullName.trim() || !nationalId.trim()) {
      setError(ar ? "أكمل جميع الحقول" : "Please complete all fields");
      return;
    }
    if (!phoneVerified) {
      setError(ar ? "تحقق من رقم جوالك أولاً" : "Verify your phone number first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitVerification", {
        fullName: fullName.trim(),
        phone: digitsOnly(phoneE164),
        nationalId: nationalId.trim(),
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
            <PhoneOtpVerifier
              channel="sms"
              initialPhone={userPhoneE164(user)}
              onVerified={(e164) => { setPhoneE164(e164); setPhoneVerified(true); }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "رقم الهوية" : "National ID"} *</label>
            <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} inputMode="numeric" className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>

          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-2.5 text-xs text-sky-700 dark:text-sky-300 text-center">
            {ar ? "رسوم التوثيق معطّلة حالياً — سيتم المراجعة مجاناً." : "Verification fee is disabled for now — review is free."}
          </div>
          <button onClick={submit} disabled={submitting || !hasAvatar || !phoneVerified} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? (ar ? "جاري الإرسال…" : "Submitting…") : (ar ? "إرسال الطلب" : "Submit request")}
          </button>
        </div>
      </div>
    </div>
  );
}