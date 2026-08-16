import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Phone, ChevronRight, ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function Login() {
  const { sendOtp, verifyOtp, loginProvider, pendingPhone } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("+966 ");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState("");
  const [err, setErr] = useState("");

  const handleSend = () => {
    if (phone.trim().length < 8) {
      setErr(t("enterPhone"));
      return;
    }
    const c = sendOtp(phone.trim());
    setHint(c);
    setStep("otp");
    setErr("");
  };

  const handleVerify = () => {
    if (!verifyOtp(code)) {
      setErr(t("enterOtp"));
      return;
    }
    nav("/");
  };

  const providerLogin = (p) => {
    loginProvider(p);
    nav("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-4">
            <Tag size={30} className="-rotate-12" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("tagline")}</p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t("enterPhone")}</label>
              <div className="flex items-center gap-2 px-3.5 py-3.5 rounded-2xl bg-muted focus-within:ring-2 ring-primary/30">
                <Phone size={18} className="text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="bg-transparent outline-none flex-1 text-base"
                  dir="ltr"
                />
              </div>
            </div>
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <button
              onClick={handleSend}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              {t("sendCode")} <ChevronRight size={18} />
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground">{t("login")}</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <button
              onClick={() => providerLogin("google")}
              className="w-full py-3.5 rounded-2xl border border-border bg-card font-semibold flex items-center justify-center gap-3 hover:bg-muted/50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              {t("loginWithGoogle")}
            </button>
            <button
              onClick={() => providerLogin("apple")}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-3 hover:bg-slate-800"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.36 1.43c.04 1.13-.4 2.22-1.06 3.04-.7.86-1.84 1.53-2.96 1.45-.06-1.1.46-2.22 1.1-2.96.7-.82 1.94-1.44 2.92-1.53zM20.5 17.1c-.55 1.28-.82 1.85-1.53 2.98-1 1.6-2.4 3.6-4.15 3.61-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.1.99-1.75-.02-3.07-1.82-4.07-3.42C.06 16.3-.2 11.5 2.1 8.7c1.1-1.34 2.84-2.18 4.47-2.21 1.62-.03 3.14 1.08 4.13 1.08.98 0 2.83-1.34 4.77-1.15.81.04 3.1.33 4.56 2.47-3.97 2.17-3.36 7.83.16 9.2-.55 1.28-1.06 2.55-1.7 3.7z"/></svg>
              {t("loginWithApple")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setStep("phone")} className="text-muted-foreground flex items-center gap-1 text-sm">
              <ArrowLeft size={16} /> {t("back")}
            </button>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t("otpSent")} <span dir="ltr">{pendingPhone}</span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t("otpPlaceholder")}
                className="w-full px-4 py-4 rounded-2xl bg-muted text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 ring-primary/30"
                dir="ltr"
                inputMode="numeric"
              />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t("demoOtpHint")} <span className="font-bold">{hint}</span>
              </p>
            </div>
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <button
              onClick={handleVerify}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              {t("verify")}
            </button>
            <button onClick={handleSend} className="w-full text-sm text-muted-foreground hover:text-foreground">
              {t("resendCode")}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck size={14} /> {t("login")}</span>
          <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {t("rating")}</span>
        </div>
      </div>
    </div>
  );
}