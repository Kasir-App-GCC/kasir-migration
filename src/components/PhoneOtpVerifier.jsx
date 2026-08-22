import React, { useState, useEffect } from "react";
import { Send, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import WhatsAppIcon from "@/components/WhatsAppIcon";

// Reusable phone + OTP verifier. Sends a code via the given channel (sms/whatsapp)
// through the sendPhoneOtp backend function and verifies it via verifyPhoneOtp.
// Calls onVerified(e164) once the code is confirmed.
export default function PhoneOtpVerifier({ initialPhone = "", channel = "sms", onVerified }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const normalize = (p) => {
    let e164 = (p || "").trim();
    if (!e164.startsWith("+")) e164 = "+" + e164;
    return e164;
  };

  const send = async () => {
    setError("");
    const e164 = normalize(phone);
    if (!/^\+\d{8,15}$/.test(e164)) {
      setError(ar ? "رقم غير صالح — استخدم صيغة +966XXXXXXXXX" : "Invalid number — use +966XXXXXXXXX");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendPhoneOtp", { phone: e164, channel });
      if (res?.data?.ok) {
        setSent(true);
        setCooldown(20);
        setCode("");
        toast({ title: ar ? "تم إرسال الرمز" : "Code sent" });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      setError(e.message || (ar ? "فشل الإرسال" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError("");
    const e164 = normalize(phone);
    const c = code.trim();
    if (!c) return;
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("verifyPhoneOtp", { phone: e164, code: c });
      if (res?.data?.ok) {
        setVerified(true);
        toast({ title: ar ? "تم التحقق" : "Verified" });
        onVerified?.(e164);
      } else {
        throw new Error(res?.data?.error || "Invalid code");
      }
    } catch (e) {
      setError(e.message || (ar ? "رمز غير صحيح" : "Invalid code"));
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={18} className="shrink-0" />
        <span>{ar ? "تم التحقق من الرقم" : "Number verified"}</span>
        <span dir="ltr" className="font-mono">{normalize(phone)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">{ar ? "رقم الجوال (E.164)" : "Phone (E.164)"}</label>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            inputMode="tel"
            placeholder="+9665XXXXXXXX"
            className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start"
          />
          <button
            onClick={send}
            disabled={sending || cooldown > 0}
            className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : (channel === "whatsapp" ? <WhatsAppIcon size={16} /> : <Send size={16} />)}
            {cooldown > 0 ? `${cooldown}s` : (ar ? "إرسال" : "Send")}
          </button>
        </div>
      </div>

      {sent && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">{ar ? "رمز التحقق" : "Verification code"}</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              dir="ltr"
              placeholder="0000"
              className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-center tracking-widest font-mono"
            />
            <button
              onClick={verify}
              disabled={verifying || code.length !== 4}
              className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {ar ? "تحقق" : "Verify"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}

      <p className="text-xs text-muted-foreground">
        {channel === "whatsapp"
          ? (ar ? "ستصلك رسالة التحقق على واتساب. الحد ٣ محاولات كل ٣٠ دقيقة." : "You'll receive the code on WhatsApp. Max 3 attempts per 30 minutes.")
          : (ar ? "ستصلك رسالة SMS بالرمز. الحد ٣ محاولات كل ٣٠ دقيقة." : "You'll receive the code via SMS. Max 3 attempts per 30 minutes.")}
      </p>
    </div>
  );
}