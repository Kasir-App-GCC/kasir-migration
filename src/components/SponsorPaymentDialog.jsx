import React, { useEffect, useState } from "react";
import { Rocket, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { usePopupPayment } from "@/hooks/usePopupPayment";
import Price from "@/components/Price";

// Opens when the user lands on /profile?pay_sponsor=<requestId> (from the
// "approved — pay now" notification). Runs the popup Moyasar payment for the
// invoice created at approval time, then confirms + activates instantly.
export default function SponsorPaymentDialog({ open, requestId, onClose }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const popup = usePopupPayment();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !requestId) return;
    setLoading(true);
    setDone(false);
    base44.entities.SponsorRequest.get(requestId)
      .then((r) => setRequest(r || null))
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [open, requestId]);

  useEffect(() => {
    if (popup.state !== "waiting") setPaying(false);
  }, [popup.state]);

  const pay = () => {
    if (!request?.invoice_url || paying) return;
    setPaying(true);
    popup.start({
      url: request.invoice_url,
      invoiceId: request.invoice_id,
      onSuccess: async () => {
        try {
          await base44.functions.invoke("confirmSponsorPayment", { invoiceId: request.invoice_id });
          toast({ title: ar ? "تم تفعيل الرعاية 🚀" : "Sponsorship activated 🚀" });
          setDone(true);
        } catch {
          toast({ title: ar ? "تم الدفع — يُفعّل قريباً" : "Paid — activating shortly" });
          setDone(true);
        }
      },
      onFail: () => setPaying(false),
    });
  };

  const notApproved = request && request.status !== "approved";
  const alreadyPaid = request && request.status === "paid";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { popup.cancel(); onClose?.(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket size={20} className="text-violet-500" />
            {ar ? "ادفع رعاية إعلانك" : "Pay for sponsorship"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "تمت الموافقة على طلبك — ادفع لتفعيل الرعاية فوراً." : "Your request was approved — pay to activate the sponsorship instantly."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : !request ? (
          <p className="text-center py-8 text-sm text-muted-foreground">{ar ? "تعذّر العثور على الطلب." : "Couldn't find the request."}</p>
        ) : done || alreadyPaid ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Rocket size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-base font-bold">{ar ? "رعايتك مُفعّلة! 🚀" : "Sponsorship active! 🚀"}</p>
            <p className="text-sm text-muted-foreground">{ar ? "إعلانك الآن مثبّت في أعلى الصفحة الرئيسية." : "Your listing is now pinned to the top of the home feed."}</p>
            <button onClick={() => onClose?.()} className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm">{ar ? "تم" : "Done"}</button>
          </div>
        ) : notApproved ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <AlertCircle size={30} className="text-amber-500" />
            <p className="text-sm font-semibold">{ar ? "هذا الطلب بانتظار مراجعة الإدارة" : "This request is awaiting admin review"}</p>
            <button onClick={() => onClose?.()} className="mt-2 px-5 py-2.5 rounded-xl bg-muted font-bold text-sm">{ar ? "إغلاق" : "Close"}</button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ar ? "الإعلان" : "Listing"}</span>
                <span className="font-semibold truncate max-w-[60%]">{request.item_title || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ar ? "المدة" : "Duration"}</span>
                <span className="font-semibold">{request.weeks} {ar ? "أسبوع" : request.weeks === 1 ? "week" : "weeks"}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-sm text-muted-foreground">{ar ? "المبلغ" : "Amount"}</span>
                <span className="text-xl font-extrabold"><Price value={request.amount} lang={lang} country="SA" /></span>
              </div>
            </div>
            <button
              onClick={pay}
              disabled={paying}
              className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              {paying ? (ar ? "جارٍ الدفع…" : "Paying…") : (ar ? "ادفع الآن" : "Pay now")}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}