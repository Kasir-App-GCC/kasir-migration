import React, { useState, useEffect } from "react";
import { X, Loader2, BadgeCheck, Camera, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PhoneOtpVerifier from "@/components/PhoneOtpVerifier";
import { userPhoneE164, digitsOnly } from "@/lib/phone";
import { apiErrorMessage } from "@/lib/apiError";
import { validateNationalId, nationalIdRule } from "@/lib/nationalId";
import MoyasarPaymentDialog from "@/components/MoyasarPaymentDialog";

export default function VerificationDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [fullName, setFullName] = useState(user?.name || "");
  const initialPhoneE164 = user?.phone_verified ? userPhoneE164(user) : "";
  const [phoneVerified, setPhoneVerified] = useState(!!initialPhoneE164);
  const [phoneE164, setPhoneE164] = useState(initialPhoneE164);
  const [showPhoneVerifier, setShowPhoneVerifier] = useState(!initialPhoneE164);
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [payState, setPayState] = useState(null);

  const idRule = nationalIdRule(user?.country);
  const hasAvatar = !!user?.avatar;
  const idCheck = validateNationalId(nationalId, user?.country);
  const formValid = hasAvatar && fullName.trim() && phoneVerified && idCheck.valid;

  useEffect(() => {
    if (!open) return;
    setPendingRequest(null);
    (async () => {
      try {
        const res = await base44.entities.VerificationRequest.filter(
          { user_id: user.id, status: "pending" },
          "-created_date",
          1
        );
        // Only block the form for manual-review requests (no Moyasar payment).
        // Old payment-flow requests are cleaned up by createVerificationPayment.
        if (res && res.length > 0 && !(res[0].payment_receipt_url || "").startsWith("moyasar:")) {
          setPendingRequest(res[0]);
        }
      } catch (e) {}
    })();
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError("");
    if (!hasAvatar) {
      setError(ar ? "أضف صورة شخصية أولاً من تعديل الملف" : "Please add a profile photo first from Edit Profile");
      return;
    }
    if (!fullName.trim()) {
      setError(ar ? "اكتب اسمك الكامل" : "Please enter your full name");
      return;
    }
    if (!phoneVerified) {
      setError(ar ? "تحقق من رقم جوالك أولاً" : "Verify your phone number first");
      return;
    }
    const idCheck = validateNationalId(nationalId, user?.country);
    if (!idCheck.valid) {
      setError(ar ? `رقم الهوية غير صالح — يجب أن يكون ${idRule.length} رقمًا${user?.country === "SA" ? " ويبدأ بـ 1 أو 2" : ""}` : `Invalid ID — must be ${idRule.length} digits${user?.country === "SA" ? " starting with 1 or 2" : ""}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createVerificationPayment", {
        fullName: fullName.trim(),
        phone: digitsOnly(phoneE164),
        nationalId: idCheck.digits,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      if (!res?.data?.ok) throw new Error(ar ? "تعذّر بدء الدفع" : "Couldn't start payment");
      setSubmitting(false);
      setPayState({
        amount: res.data.amount,
        publishableKey: res.data.publishableKey,
        callbackUrl: `${window.location.origin}/profile?verify_payment=1`,
        metadata: {
          type: "verification",
          user_id: String(user.id),
          verification_request_id: String(res.data.requestId),
        },
      });
    } catch (err) {
      setError(apiErrorMessage(err, ar ? "تعذّر بدء الدفع" : "Couldn't start payment"));
    } finally {
      setSubmitting(false);
    }
  };

  const onPaidVerification = async (payment) => {
    const res = await base44.functions.invoke("confirmVerificationPayment", { paymentId: payment.id });
    if (res?.data?.error) throw new Error(res.data.error);
    await refreshUser();
    toast({ title: ar ? "تم توثيق حسابك بنجاح! 🎉" : "Account verified! 🎉" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><BadgeCheck size={20} className="text-sky-500" /> {ar ? "توثيق الحساب" : "Account verification"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        {pendingRequest ?
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-4 flex items-start gap-3">
            <Clock size={20} className="text-sky-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-sky-700 dark:text-sky-300">{ar ? "طلبك قيد المراجعة" : "Your request is under review"}</p>
              <p className="text-muted-foreground mt-1">{ar ? "لا يمكن تقديم طلب جديد حتى تكتمل المراجعة." : "You cannot submit a new request until the review is complete."}</p>
            </div>
          </div> :

        <>
            {!hasAvatar &&
          <div className="mb-4 p-3 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-sm flex items-start gap-2">
                <Camera size={16} className="shrink-0 mt-0.5" />
                <span>{ar ? "يلزم وجود صورة شخصية قبل طلب التوثيق. أضف صورة من «تعديل الملف»." : "A profile photo is required before requesting verification. Add one from Edit Profile."}</span>
              </div>
          }

            {error && <div className="mb-3 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">{error}</div>}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{ar ? "الاسم الكامل" : "Full name"} *</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{ar ? "رقم الجوال" : "Phone number"} *</label>
                {showPhoneVerifier ?
              <div className="space-y-1">
                    <PhoneOtpVerifier
                  channel="sms"
                  initialPhone={phoneE164 || userPhoneE164(user)}
                  disallowE164={phoneVerified ? phoneE164 : ""}
                  onVerified={async (e164) => {
                    setPhoneE164(e164);
                    setPhoneVerified(true);
                    setShowPhoneVerifier(false);
                    try {
                      await base44.auth.updateMe({ phone: digitsOnly(e164), phone_verified: true });
                      await refreshUser();
                    } catch (e) {}
                  }} />
                
                    {phoneVerified &&
                <button type="button" onClick={() => setShowPhoneVerifier(false)} className="text-xs text-muted-foreground underline">
                        {ar ? "إبقاء الرقم الحالي" : "Keep current number"}
                      </button>
                }
                  </div> :

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
                    <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold font-mono" dir="ltr">+{digitsOnly(phoneE164)}</span>
                    <button type="button" onClick={() => setShowPhoneVerifier(true)} className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold underline">
                      {ar ? "تغيير الرقم" : "Change number"}
                    </button>
                  </div>
              }
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{ar ? "رقم الهوية" : "National ID"} *</label>
                <input
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, "").slice(0, idRule.length))}
                inputMode="numeric"
                dir="ltr"
                placeholder={ar ? `${idRule.length} أرقام` : `${idRule.length} digits`}
                className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start font-mono" />
              
                
              </div>

              <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 text-xs text-sky-700 dark:text-sky-300 text-center">
                <p className="font-bold">{ar ? "رسوم التوثيق: 12 ريال (دفعة واحدة)" : "Verification fee: 12 SAR (one-time)"}</p>
              </div>
              <button onClick={submit} disabled={submitting || !formValid} className="w-full py-3.5 rounded-2xl bg-sky-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? (ar ? "جاري التحضير…" : "Preparing…") : (ar ? "ادفع 12 ريال وتوّقّق" : "Pay 12 SAR & verify")}
              </button>
            </div>
          </>
        }

      {payState && (
        <MoyasarPaymentDialog
          open
          lang={lang}
          amount={payState.amount}
          publishableKey={payState.publishableKey}
          callbackUrl={payState.callbackUrl}
          metadata={payState.metadata}
          description="رسوم توثيق الحساب - كاسر"
          onPaid={onPaidVerification}
          onClose={() => { setPayState(null); onClose(); }}
        />
      )}
      </div>
    </div>);

}