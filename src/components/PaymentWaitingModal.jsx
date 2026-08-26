import React from "react";
import { Loader2, CheckCircle2, XCircle, X, ExternalLink, CreditCard } from "lucide-react";
import { useStore } from "@/lib/store";

// In-app overlay shown while a popup Moyasar payment is in flight.
// Reflects the `usePopupPayment` state: waiting → paid / failed / closed.
export default function PaymentWaitingModal({ state, amount, invoiceUrl, onCancel, onDone }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  if (state === "idle") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border/60 shadow-2xl p-6 text-center">
        {state === "waiting" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={30} className="text-emerald-600 animate-spin" />
            </div>
            <h3 className="text-lg font-extrabold mb-1">{ar ? "في انتظار الدفع" : "Waiting for payment"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {ar
                ? "أكمل الدفع في النافذة المنبثقة. سنُغلقها تلقائياً عند نجاح الدفع."
                : "Complete the payment in the popup. We'll close it automatically once it's paid."}
            </p>
            {amount && (
              <p className="text-2xl font-extrabold mb-4">{amount} <span className="text-sm text-muted-foreground">{ar ? "ر.س" : "SAR"}</span></p>
            )}
            {invoiceUrl && (
              <a href={invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline mb-4">
                <ExternalLink size={14} /> {ar ? "فتح نافذة الدفع مجدداً" : "Reopen payment window"}
              </a>
            )}
            <button onClick={onCancel} className="w-full py-3 rounded-2xl bg-muted text-sm font-bold flex items-center justify-center gap-2 hover:bg-muted/70 transition">
              <X size={16} /> {ar ? "إلغاء" : "Cancel"}
            </button>
          </>
        )}

        {state === "paid" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={34} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-extrabold mb-1 text-emerald-700 dark:text-emerald-400">{ar ? "تم الدفع بنجاح" : "Payment successful"}</h3>
            <p className="text-sm text-muted-foreground mb-5">{ar ? "شكراً لك! يمكنك المتابعة الآن." : "Thank you! You can continue now."}</p>
            <button onClick={onDone} className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
              <CreditCard size={16} /> {ar ? "متابعة" : "Continue"}
            </button>
          </>
        )}

        {(state === "failed" || state === "closed") && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
              <XCircle size={34} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-extrabold mb-1">{ar ? "لم يكتمل الدفع" : "Payment not completed"}</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {state === "closed"
                ? (ar ? "تم إغلاق نافذة الدفع قبل إتمام العملية." : "The payment window was closed before completion.")
                : (ar ? "تعذّر إتمام الدفع. حاول مرة أخرى." : "Payment couldn't be completed. Please try again.")}
            </p>
            <button onClick={onDone} className="w-full py-3 rounded-2xl bg-muted text-sm font-bold flex items-center justify-center gap-2 hover:bg-muted/70 transition">
              {ar ? "إغلاق" : "Close"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}