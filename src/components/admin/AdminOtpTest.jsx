import React, { useState } from "react";
import { Phone, Send, ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

export default function AdminOtpTest() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    const p = phone.trim();
    if (!/^\+\d{8,15}$/.test(p)) {
      toast({ title: ar ? "رقم غير صالح — استخدم صيغة +966XXXXXXXXX" : "Invalid number — use +966XXXXXXXXX", variant: "destructive" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendPhoneOtp", { phone: p });
      if (res?.data?.ok) {
        toast({ title: ar ? "تم إرسال الرمز" : "Code sent", description: ar ? "تحقق من رسائل الجوال" : "Check your SMS" });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      setResult({ ok: false, message: e.message });
      toast({ title: ar ? "فشل الإرسال" : "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    const p = phone.trim();
    const c = code.trim();
    if (!p || !c) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("verifyPhoneOtp", { phone: p, code: c });
      if (res?.data?.ok) {
        setResult({ ok: true, message: ar ? "تم التحقق بنجاح ✓" : "Verified successfully ✓" });
        toast({ title: ar ? "تم التحقق" : "Verified" });
      } else {
        throw new Error(res?.data?.error || "Invalid code");
      }
    } catch (e) {
      setResult({ ok: false, message: e.message });
      toast({ title: ar ? "رمز غير صحيح" : "Invalid code", description: e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
        {ar
          ? "حساب تجريبي: يجب إضافة الرقم المستلم وتوثيقه في Twilio (Phone Numbers → Verified Caller IDs) قبل الإرسال إليه."
          : "Trial account: add and verify the destination number in Twilio (Phone Numbers → Verified Caller IDs) before sending to it."}
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
        <label className="text-sm font-semibold">{ar ? "رقم الجوال (E.164)" : "Phone number (E.164)"}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9665XXXXXXXX"
              dir="ltr"
              className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm text-start"
            />
          </div>
          <button onClick={send} disabled={sending} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5 disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {ar ? "إرسال" : "Send"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
        <label className="text-sm font-semibold">{ar ? "رمز التحقق" : "Verification code"}</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            dir="ltr"
            inputMode="numeric"
            className="flex-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm tracking-widest text-center font-mono"
          />
          <button onClick={verify} disabled={verifying || code.length !== 6} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50">
            {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {ar ? "تحقق" : "Verify"}
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-2xl p-3 flex items-center gap-2 text-sm font-semibold ${result.ok ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"}`}>
          {result.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {result.message}
        </div>
      )}
    </div>
  );
}