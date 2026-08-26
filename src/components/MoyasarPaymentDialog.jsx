import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Embeds the Moyasar Payment Form (MPF) inside an in-app modal so the user
// never leaves the app to a hosted checkout page. On a successful card payment
// it verifies server-side (via the provided confirm function) and shows a
// "payment successful" state before calling onSuccess and closing.
//
// Props:
//  - amount: SAR (number)
//  - description, metadata, publishableKey, callbackUrl: Moyasar form config
//  - confirmFunction: backend function name invoked with { paymentId } on paid
//    (omit for flows with no server-side confirm)
//  - onSuccess(result): called after a successful confirm (or paid payment)
//  - title, lang
const MPF_JS = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.10/dist/moyasar.umd.min.js";
const MPF_CSS = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.10/dist/moyasar.css";

let scriptPromise = null;
function loadMpf() {
  if (typeof window !== "undefined" && window.Moyasar) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${MPF_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MPF_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = MPF_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error("Failed to load payment form")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function MoyasarPaymentDialog({
  open,
  onClose,
  amount,
  description,
  metadata,
  publishableKey,
  callbackUrl,
  confirmFunction,
  onSuccess,
  lang = "en",
  title,
}) {
  const ar = lang === "ar";
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | form | confirming | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    resultRef.current = null;

    loadMpf()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const M = window.Moyasar;
        if (!M) { setErrorMsg(ar ? "تعذّر تحميل نموذج الدفع" : "Couldn't load payment form"); setStatus("error"); return; }
        containerRef.current.innerHTML = "";
        try {
          M.init({
            element: containerRef.current,
            amount: Math.round(Number(amount) * 100),
            currency: "SAR",
            description,
            publishable_api_key: publishableKey,
            callback_url: callbackUrl || window.location.href,
            supported_networks: ["mada", "visa", "mastercard", "unionpay"],
            methods: ["creditcard"],
            language: ar ? "ar" : "en",
            metadata,
            on_completed: async (payment) => {
              const paymentId = payment?.id;
              if (!paymentId) return;
              // If the payment is already paid (non-3DS card), confirm right away.
              // For 3DS cards the form may fire on_completed with 'initiated' and
              // complete the challenge in-page; poll the server confirm until the
              // payment is marked paid (covers both cases).
              setStatus("confirming");
              if (confirmFunction) {
                let res = null;
                for (let i = 0; i < 20; i++) {
                  if (cancelled) return;
                  try {
                    res = await base44.functions.invoke(confirmFunction, { paymentId });
                    if (res?.data?.ok || res?.data?.verified || res?.data?.activated) break;
                  } catch {}
                  await new Promise((r) => setTimeout(r, 2000));
                }
                if (cancelled) return;
                if (res?.data?.ok || res?.data?.verified || res?.data?.activated) {
                  resultRef.current = res.data;
                  setStatus("success");
                } else {
                  setErrorMsg(ar ? "لم يكتمل الدفع بعد" : "Payment not completed yet");
                  setStatus("error");
                }
              } else if (payment.status === "paid") {
                resultRef.current = { ok: true };
                setStatus("success");
              }
            },
            on_failure: async (err) => {
              if (cancelled) return;
              setErrorMsg(typeof err === "string" ? err : (err?.message || (ar ? "فشل الدفع" : "Payment failed")));
              setStatus("error");
            },
            // Keep the user in-app: intercept the post-payment redirect and
            // handle the result via on_completed instead of navigating away.
            on_redirect: async () => false,
          });
          setStatus("form");
        } catch (e) {
          setErrorMsg(e?.message || (ar ? "تعذّر بدء الدفع" : "Couldn't start payment"));
          setStatus("error");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setErrorMsg(e?.message || (ar ? "تعذّر تحميل نموذج الدفع" : "Couldn't load payment form"));
        setStatus("error");
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleDone = () => {
    try { onSuccess?.(resultRef.current); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={status === "form" ? onClose : undefined} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{title || (ar ? "الدفع" : "Payment")}</h3>
          {status === "form" && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
          )}
        </div>

        {status === "loading" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{ar ? "جارٍ تحميل نموذج الدفع…" : "Loading payment form…"}</p>
          </div>
        )}

        {(status === "form" || status === "confirming") && (
          <div>
            <div ref={containerRef} className="mysr-form" />
            {status === "confirming" && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> {ar ? "جارٍ التحقق من الدفع…" : "Verifying payment…"}
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <p className="text-lg font-extrabold">{ar ? "تم الدفع بنجاح" : "Payment successful"}</p>
            <button onClick={handleDone} className="mt-2 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold">
              {ar ? "متابعة" : "Continue"}
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <AlertCircle size={36} className="text-rose-600" />
            </div>
            <p className="text-sm font-semibold text-rose-600">{errorMsg || (ar ? "تعذّر إتمام الدفع" : "Couldn't complete payment")}</p>
            <button onClick={onClose} className="mt-2 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold">
              {ar ? "إغلاق" : "Close"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}