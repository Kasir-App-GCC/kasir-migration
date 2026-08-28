import React, { useState, useEffect, useMemo } from "react";
import { Send, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { apiErrorMessage } from "@/lib/apiError";
import SheetSelect from "@/components/SheetSelect";

// Verifies a phone number that appears on the broker's Fal license, via OTP.
// Unlike PhoneOtpVerifier, this does NOT reclaim the number onto the user's
// account — it only confirms the broker can receive a code at the license
// number. 90-second resend cooldown. Calls onVerified(e164) on success.
export default function LicensePhoneVerifier({ onVerified }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();

  const defaultCode = getCountry(country)?.phoneCode || "966";
  const [countryCode, setCountryCode] = useState(defaultCode);
  const [localNumber, setLocalNumber] = useState("");
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
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendPhoneOtp", { phone: e164, channel: "sms" });
      if (res?.data?.ok) {
        setSent(true);
        setCooldown(90);
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
      const res = await base44.functions.invoke("verifyLicensePhone", { phone: e164, code: c });
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

  if (verified) {
    return (
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={16} className="shrink-0" />
        <span>{ar ? "تم التحقق من الرقم" : "Number verified"}</span>
        <span dir="ltr" className="font-mono">{buildE164()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2" dir="ltr">
        <div className="w-28 shrink-0">
          <SheetSelect value={countryCode} onChange={setCountryCode} options={codeOptions} buttonClassName="px-3 py-2.5" />
        </div>
        <input
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 15 - countryCode.length))}
          dir="ltr"
          inputMode="tel"
          placeholder={ar ? "5XXXXXXXX" : "5XXXXXXXX"}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start text-sm"
        />
        <button
          onClick={send}
          disabled={sending || cooldown > 0}
          className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {cooldown > 0 ? `${cooldown}s` : (ar ? "إرسال" : "Send")}
        </button>
      </div>

      {sent && (
        <div className="flex gap-2">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            dir="ltr"
            placeholder="0000"
            className="flex-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-center tracking-widest font-mono text-sm"
          />
          <button
            onClick={verify}
            disabled={verifying || otp.length !== 4}
            className="px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {ar ? "تحقق" : "Verify"}
          </button>
        </div>
      )}

      {error && <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs">{error}</div>}
    </div>
  );
}