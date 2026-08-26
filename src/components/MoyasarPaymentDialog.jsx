import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { loadMoyasar } from "@/lib/loadMoyasar";

// In-app embedded Moyasar card form. Renders Moyasar's Payment Form inside a
// modal, shows a "payment successful" state when on_completed fires with a
// paid payment (after running the optional onPaid confirm step), then lets
// the user continue. The 3DS challenge is handled by MPF in-page; callbackUrl
// is kept as a required fallback that returns to the app's existing
// redirect-confirm handlers.
export default function MoyasarPaymentDialog({
  open,
  onClose,
  amount,
  currency = "SAR",
  description,
  publishableKey,
  metadata,
  callbackUrl,
  onPaid,
  lang = "ar",
}) {
  const ar = lang === "ar";
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | processing | confirming | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const paidRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    paidRef.current = false;

    (async () => {
      try {
        await loadMoyasar();
        if (cancelled || !containerRef.current) return;
        if (!publishableKey) {
          setErrorMsg(ar ? "تعذّر تحميل بيانات الدفع" : "Payment configuration missing");
          setStatus("error");
          return;
        }
        containerRef.current.innerHTML = "";
        window.Moyasar.init({
          element: containerRef.current,
          amount: Math.round(Number(amount) * 100),
          currency,
          description: description || "Payment",
          publishable_api_key: publishableKey,
          callback_url: callbackUrl || window.location.origin,
          methods: ["creditcard"],
          language: ar ? "ar" : "en",
          fixed_width: false,
          metadata: metadata || {},
          on_completed: async (payment) => {
            if (paidRef.current) return;
            if (payment?.status === "paid") {
              paidRef.current = true;
              if (onPaid) {
                setStatus("confirming");
                try {
                  await onPaid(payment);
                } catch (e) {
                  setErrorMsg(e?.message || (ar ? "تعذّر التأكيد" : "Confirmation failed"));
                  setStatus("error");
                  return;
                }
              }
              setStatus("success");
            } else if (payment?.status === "initiated") {
              // 3D Secure in progress — MPF handles it in-page; wait for the
              // final on_completed with a paid status.
              setStatus("processing");
            } else {
              setErrorMsg(
                payment?.status
                  ? ar ? `حالة الدفع: ${payment.status}` : `Payment status: ${payment.status}`
                  : ar ? "لم يكتمل الدفع" : "Payment not completed"
              );
              setStatus("error");
            }
          },
          on_failure: async (err) => {
            setErrorMsg(typeof err === "string" ? err : ar ? "تعذّر إتمام الدفع" : "Payment failed");
            setStatus("error");
          },
        });
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e?.message || (ar ? "تعذّر تحميل نموذج الدفع" : "Couldn't load payment form"));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, retryKey, publishableKey]);

  if (!open) return null;

  const canClose = status !== "confirming" && status !== "processing";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={canClose ? onClose : undefined} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{ar ? "الدفع" : "Payment"}</h3>
          {canClose && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
              <X size={20} />
            </button>
          )}
        </div>

        {status === "success" ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={56} className="text-emerald-500" />
            <p className="text-lg font-bold">{ar ? "تم الدفع بنجاح" : "Payment successful"}</p>
            <button onClick={onClose} className="mt-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold">
              {ar ? "تم" : "Done"}
            </button>
          </div>
        ) : status === "error" ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <AlertCircle size={48} className="text-rose-500" />
            <p className="text-sm font-semibold text-center max-w-[90%]">{errorMsg}</p>
            <button onClick={() => setRetryKey((k) => k + 1)} className="mt-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold">
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : (
          <div className="relative min-h-[120px]">
            <div ref={containerRef} className="mysr-form" />
            {(status === "loading" || status === "confirming") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 rounded-xl">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm font-semibold">
                  {status === "confirming"
                    ? ar ? "جارٍ التأكيد…" : "Confirming…"
                    : ar ? "جارٍ تحميل نموذج الدفع…" : "Loading payment form…"}
                </p>
              </div>
            )}
            {status === "processing" && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                {ar ? "جارٍ التحقق من البنك…" : "Verifying with your bank…"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}