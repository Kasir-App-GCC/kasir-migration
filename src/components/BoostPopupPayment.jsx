import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { usePopupPayment } from "@/hooks/usePopupPayment";
import PaymentWaitingModal from "@/components/PaymentWaitingModal";

// Popup-based Moyasar payment for boosts (redirect mode). Opens the hosted
// checkout in a popup, polls the invoice, and on success calls
// confirmBoostPayment to activate the boost immediately (the webhook also
// activates — confirmBoostPayment is idempotent). Replaces the old
// `window.open(url, "_blank")` flow that left users stuck on "invoice paid".
export default function BoostPopupPayment({ open, url, invoiceId, boostRequestId, amount, onDone, onClose }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const popup = usePopupPayment();

  useEffect(() => {
    if (!open || !url) return;
    popup.start({
      url,
      invoiceId,
      onSuccess: async () => {
        try {
          await base44.functions.invoke("confirmBoostPayment", { boostRequestId });
          toast({ title: ar ? "تم تفعيل التعزيز ⭐" : "Boost activated ⭐" });
        } catch {}
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url]);

  if (!open) return null;

  return (
    <PaymentWaitingModal
      state={popup.state}
      amount={amount}
      invoiceUrl={url}
      onCancel={() => { popup.cancel(); onClose?.(); }}
      onDone={() => {
        const paid = popup.state === "paid";
        popup.reset();
        onDone?.(paid);
      }}
    />
  );
}