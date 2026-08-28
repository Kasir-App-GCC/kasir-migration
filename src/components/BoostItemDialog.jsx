import React, { useEffect, useState } from "react";
import { Zap, Loader2, Sparkles, CheckCircle2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import Price from "@/components/Price";
import { computeBoostPrice, BOOST_MIN_HOURS, BOOST_MAX_HOURS } from "@/lib/boostPricing";
import BoostPopupPayment from "@/components/BoostPopupPayment";
import { openCheckoutBlank, closeCheckoutPopup } from "@/hooks/usePopupPayment";

// Self-service short-term boost: the seller picks an available (non-draft,
// not-currently-boosted) listing and a duration (2–168h). The price is
// computed from the item's price server-side. Payment runs through Moyasar
// (popup), and the boost activates instantly on confirmation — no admin review.
export default function BoostItemDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [hours, setHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [pay, setPay] = useState(null); // { url, invoiceId, boostRequestId, amount }

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelectedId("");
    setHours(24);
    setPay(null);
    base44.entities.Item.filter({ seller_id: user.id, status: "available" }, "-created_date", 200)
      .then((list) => setListings(list || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  const selectedItem = listings.find((x) => x.id === selectedId);
  const amount = selectedItem ? computeBoostPrice(Number(selectedItem.price) || 0, hours).amount : 0;

  const arHours = (n) => (n === 1 ? "ساعة" : n === 2 ? "ساعتين" : n >= 3 && n <= 10 ? "ساعات" : "ساعة");

  const submit = async () => {
    if (!selectedItem || submitting) return;
    setSubmitting(true);
    // Open the popup synchronously in the click handler — if we wait until
    // after the async backend call, the browser blocks it (no user gesture)
    // and we fall back to a full-page redirect. start() navigates this same
    // named window to the checkout URL once we have it.
    openCheckoutBlank();
    try {
      const res = await base44.functions.invoke("createBoostRequest", {
        item_id: selectedItem.id,
        hours,
        origin: window.location.origin,
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      setPay({ url: data.url, invoiceId: data.invoiceId, boostRequestId: data.request?.id, amount: data.amount });
    } catch (e) {
      closeCheckoutPopup();
      toast({ title: ar ? "تعذّر إنشاء التعزيز" : "Couldn't start boost", description: e?.message || "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open && !pay} onOpenChange={(o) => { if (!o) onClose?.(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              {ar ? "تعزيز إعلان" : "Boost an item"}
            </DialogTitle>
            <DialogDescription>
              {ar ? "عرّض إعلانك في مقدمة النتائج لساعات قصيرة لجذب مشترين أسرع." : "Pin your listing to the top for a few hours to attract buyers faster."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3.5 flex gap-2.5">
            <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              {ar ? "التعزيز فوري بعد الدفع — لا يحتاج موافقة الإدارة. يُحاسب بالريال السعودي." : "Boosts activate instantly after payment — no admin review needed. Charged in SAR."}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">{ar ? "اختر إعلانك" : "Choose your listing"}</p>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : listings.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {ar ? "لا توجد إعلانات متاحة. أنشئ إعلان أولاً." : "No available listings. Create a listing first."}
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pe-1">
                {listings.map((it) => {
                  const isSelected = it.id === selectedId;
                  const isCurrentlyBoosted = it.featured && it.featured_until && new Date(it.featured_until) > new Date();
                  return (
                    <button
                      key={it.id}
                      disabled={isCurrentlyBoosted}
                      onClick={() => setSelectedId(it.id)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-start transition ${isCurrentlyBoosted ? "opacity-50 cursor-not-allowed border-border/60" : isSelected ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-border/60 hover:bg-muted/50"}`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Zap size={16} className="text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{it.title}</p>
                        <Price value={it.price} lang={lang} country={it.country} />
                      </div>
                      {isCurrentlyBoosted && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <Sparkles size={9} /> {ar ? "مُعزز" : "Boosted"}
                        </span>
                      )}
                      {isSelected && <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0"><CheckCircle2 size={12} className="text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{ar ? "مدة التعزيز" : "Boost duration"}</p>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{hours} {ar ? arHours(hours) : hours === 1 ? "hour" : "hours"}</span>
            </div>
            <Slider value={[hours]} min={BOOST_MIN_HOURS} max={BOOST_MAX_HOURS} step={2} onValueChange={(v) => setHours(v[0])} />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{BOOST_MIN_HOURS} {ar ? "ساعة" : "h"}</span>
              <span>{BOOST_MAX_HOURS} {ar ? "ساعة" : "h"}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted p-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{ar ? "الإجمالي" : "Total"}</p>
              <p className="text-xl font-extrabold"><Price value={amount} lang={lang} country="SA" /></p>
            </div>
            <button
              onClick={submit}
              disabled={!selectedId || submitting}
              className="px-5 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? (ar ? "جارٍ الإنشاء…" : "Starting…") : (ar ? "ادفع وعرّض" : "Pay & boost")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <BoostPopupPayment
        open={!!pay}
        url={pay?.url}
        invoiceId={pay?.invoiceId}
        boostRequestId={pay?.boostRequestId}
        amount={pay?.amount}
        onDone={() => { setPay(null); onClose?.(); }}
        onClose={() => setPay(null)}
      />
    </>
  );
}