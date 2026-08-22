import React, { useState } from "react";
import { Phone, Send, ShieldCheck, Loader2, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function AdminOtpTest() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (channel = "sms") => {
    const p = phone.trim();
    if (!/^\+\d{8,15}$/.test(p)) {
      toast({ title: ar ? "رقم غير صالح — استخدم صيغة +966XXXXXXXXX" : "Invalid number — use +966XXXXXXXXX", variant: "destructive" });
      return;
    }
    if (channel === "whatsapp") setSendingWa(true); else setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendPhoneOtp", { phone: p, channel });
      if (res?.data?.ok) {
        toast({
          title: ar ? "تم إرسال الرمز" : "Code sent",
          description: channel === "whatsapp"
            ? (ar ? "تحقق من واتساب" : "Check your WhatsApp")
            : (ar ? "تحقق من رسائل الجوال" : "Check your SMS"),
        });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      setResult({ ok: false, message: e.message });
      toast({ title: ar ? "فشل الإرسال" : "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
      setSendingWa(false);
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
      <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 text-xs text-sky-700 dark:text-sky-300">
        {ar
         ? "يتم الإرسال عبر Authentica.sa. أدخل رقمك بصيغة E.164 (مثال: +9665XXXXXXXX) ثم اضغط إرسال."
         : "Codes are sent via Authentica.sa. Enter your number in E.164 format (e.g. +9665XXXXXXXX) and press Send."}
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
          <button onClick={() => send("sms")} disabled={sending || sendingWa} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5 disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {ar ? "إرسال SMS" : "Send SMS"}
          </button>
          <button onClick={() => send("whatsapp")} disabled={sending || sendingWa} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50">
            {sendingWa ? <Loader2 size={16} className="animate-spin" /> : <WhatsAppIcon size={16} />}
            {ar ? "واتساب" : "WhatsApp"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
        <label className="text-sm font-semibold">{ar ? "رمز التحقق" : "Verification code"}</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
            dir="ltr"
            inputMode="numeric"
            className="flex-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm tracking-widest text-center font-mono"
          />
          <button onClick={verify} disabled={verifying || code.length !== 4} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50">
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