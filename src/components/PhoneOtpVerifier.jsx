import React, { useState, useEffect, useMemo } from "react";
import { Send, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { digitsOnly } from "@/lib/phone";
import { apiErrorMessage } from "@/lib/apiError";
import SheetSelect from "@/components/SheetSelect";
import WhatsAppIcon from "@/components/WhatsAppIcon";

// Reusable phone + OTP verifier. Sends a code via the given channel (sms/whatsapp)
// through the sendPhoneOtp backend function and verifies it via verifyPhoneOtp.
// Calls onVerified(e164) once the code is confirmed.
// The country code is prefilled from the user's country (changeable via dropdown),
// so the user only types their local number. Numbers already claimed by another
// account are rejected before the OTP is sent.

function splitE164(e164, fallbackCode) {
  const s = (e164 || "").replace(/^\+/, "").replace(/\D/g, "");
  const codes = COUNTRIES.map((c) => c.phoneCode).sort((a, b) => b.length - a.length);
  const matched = codes.find((c) => s.startsWith(c));
  if (matched) return { code: matched, local: s.slice(matched.length) };
  return { code: fallbackCode || "966", local: s };
}

export default function PhoneOtpVerifier({ initialPhone = "", channel = "sms", onVerified, disallowE164 = "" }) {
  const { lang } = useStore();
  const { user } = useAuth();
  const ar = lang === "ar";
  const { toast } = useToast();

  const defaultCode = getCountry(user?.country)?.phoneCode || "966";
  const initial = splitE164(initialPhone, defaultCode);
  const [countryCode, setCountryCode] = useState(initial.code);
  const [localNumber, setLocalNumber] = useState(initial.local);
  const [otp, setOtp] = useState("");
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

  const buildE164 = () => "+" + countryCode + (localNumber || "").replace(/\D/g, "");

  const codeOptions = useMemo(() => {
    const base = COUNTRIES.map((c) => ({ value: c.phoneCode, label: `${c.flag} +${c.phoneCode}` }));
    if (countryCode && !base.some((o) => o.value === countryCode)) {
      base.unshift({ value: countryCode, label: `+${countryCode}` });
    }
    return base;
  }, [countryCode]);

  const send = async () => {
    setError("");
    const e164 = buildE164();
    if (!/^\+\d{8,15}$/.test(e164)) {
      setError(ar ? "رقم غير صالح" : "Invalid number");
      return;
    }
    // Block re-verifying a number that's already verified for this user.
    if (disallowE164 && digitsOnly(e164) === digitsOnly(disallowE164)) {
      setError(ar ? "هذا الرقم موثّق بالفعل" : "This number is already verified");
      return;
    }
    // Enforce phone uniqueness — reject numbers already claimed by another account.
    try {
      const check = await base44.functions.invoke("checkPhoneUnique", {
        phone: digitsOnly(e164),
        local: (localNumber || "").replace(/\D/g, ""),
        cc: countryCode,
      });
      if (check?.data && check.data.available === false) {
        setError(ar ? "هذا الرقم مستخدم بواسطة حساب آخر" : "This number is already used by another account");
        return;
      }
    } catch (e) {
      // If the uniqueness check fails, proceed — don't block verification on a transient error.
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendPhoneOtp", { phone: e164, channel });
      if (res?.data?.ok) {
        setSent(true);
        setCooldown(60);
        setOtp("");
        toast({ title: ar ? "تم إرسال الرمز" : "Code sent" });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      setError(apiErrorMessage(e, ar ? "فشل الإرسال" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError("");
    const e164 = buildE164();
    const c = otp.trim();
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
      setError(apiErrorMessage(e, ar ? "رمز غير صحيح" : "Invalid code"));
    } finally {
      setVerifying(false);
    }
  };

  const isDisallowed = !!disallowE164 && digitsOnly(countryCode + (localNumber || "").replace(/\D/g, "")) === digitsOnly(disallowE164);

  if (verified) {
    return (
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={18} className="shrink-0" />
        <span>{ar ? "تم التحقق من الرقم" : "Number verified"}</span>
        <span dir="ltr" className="font-mono">{buildE164()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2" dir="ltr">
        <div className="w-28 shrink-0">
          <SheetSelect
            value={countryCode}
            onChange={setCountryCode}
            options={codeOptions}
            buttonClassName="px-3 py-3"
          />
        </div>
        <input
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 15 - countryCode.length))}
          dir="ltr"
          inputMode="tel"
          placeholder={ar ? "5XXXXXXXX" : "5XXXXXXXX"}
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start"
        />
        <button
          onClick={send}
          disabled={sending || cooldown > 0 || isDisallowed}
          className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : (channel === "whatsapp" ? <WhatsAppIcon size={16} /> : <Send size={16} />)}
          {isDisallowed ? (ar ? "موثّق" : "Verified") : (cooldown > 0 ? `${cooldown}s` : (ar ? "إرسال" : "Send"))}
        </button>
      </div>

      {sent && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">{ar ? "رمز التحقق" : "Verification code"}</label>
          <div className="flex gap-2">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              dir="ltr"
              placeholder="0000"
              className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-center tracking-widest font-mono"
            />
            <button
              onClick={verify}
              disabled={verifying || otp.length !== 4}
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
          ? (ar ? "ستصلك رسالة التحقق على واتساب." : "You'll receive the code on WhatsApp.")
          : (ar ? "سيصلك رمز برسالة نصية." : "You'll receive a code via SMS.")}
      </p>
    </div>
  );
}