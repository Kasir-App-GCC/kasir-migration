import React, { useEffect, useState } from "react";
import { Rocket, FileText, Loader2, Sparkles, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { usePopupPayment } from "@/hooks/usePopupPayment";
import Price from "@/components/Price";
import { computeSponsorPrice, SPONSOR_MIN_WEEKS, SPONSOR_MAX_WEEKS } from "@/lib/sponsorPricing";

// Self-service sponsorship dialog: the seller picks one of their listings
// (drafts included, badged), picks a duration (1–12 weeks), and pays via the
// popup Moyasar flow. On payment the item is pinned to the top of the Home
// feed (admin_sponsored) with the "Sponsored" badge — same fields the admin
// panel uses, so no new feed logic is needed.
export default function SponsorItemDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const popup = usePopupPayment();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [weeks, setWeeks] = useState(1);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelectedId("");
    setWeeks(1);
    base44.entities.Item.filter({ seller_id: user.id }, "-created_date", 200)
      .then((list) => setListings(list || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  // Reset the paying spinner whenever the popup flow settles.
  useEffect(() => {
    if (popup.state !== "waiting") setPaying(false);
  }, [popup.state]);

  const amount = computeSponsorPrice(weeks);
  const selectedItem = listings.find((x) => x.id === selectedId);

  const pay = async () => {
    if (!selectedItem || paying) return;
    setPaying(true);
    try {
      const res = await base44.functions.invoke("createSponsorRequest", {
        item_id: selectedItem.id,
        weeks,
        origin: window.location.origin,
      });
      const data = res?.data || {};
      if (!data.url) {
        toast({ title: ar ? "تعذّر إنشاء رابط الدفع" : "Couldn't create payment link", variant: "destructive" });
        setPaying(false);
        return;
      }
      popup.start({
        url: data.url,
        invoiceId: data.invoiceId,
        onSuccess: async () => {
          try {
            await base44.functions.invoke("confirmSponsorPayment", { invoiceId: data.invoiceId });
            toast({ title: ar ? "تم تفعيل الرعاية 🚀" : "Sponsorship activated 🚀" });
            onClose?.();
          } catch {
            toast({ title: ar ? "تم الدفع — يُفعّل قريباً" : "Paid — activating shortly", description: ar ? "الرعاية ستظهر خلال لحظات" : "Sponsorship will appear in a moment" });
          }
        },
        onFail: () => setPaying(false),
      });
    } catch {
      toast({ title: ar ? "فشل بدء الدفع" : "Payment failed to start", variant: "destructive" });
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { popup.cancel(); onClose?.(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket size={20} className="text-violet-500" />
            {ar ? "رعاية إعلان" : "Sponsor an item"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "ثبّت إعلانك في أعلى الصفحة الرئيسية ليتميز عن غيرك." : "Pin your listing to the top of the home feed."}
          </DialogDescription>
        </DialogHeader>

        {/* Banner: this is a premium, enterprise-oriented feature */}
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3.5 flex gap-2.5">
          <Building2 size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-violet-800 dark:text-violet-200">{ar ? "مخصصة للشركات والتجار" : "Built for businesses & merchants"}</p>
            <p className="text-xs text-violet-700 dark:text-violet-300 mt-1 leading-relaxed">
              {ar
                ? "الرعاية تثبّت إعلانك في المقدمة لفترة طويلة، وهي مثالية للشركات التي تبيع منتجاتها بعكس الأفراد. الأسعار تعكس هذه القيمة العالية للظهور."
                : "Sponsorship pins your listing at the top for an extended period — ideal for enterprises selling products rather than individuals. Pricing reflects this premium visibility."}
            </p>
          </div>
        </div>

        {/* Listing picker */}
        <div>
          <p className="text-sm font-semibold mb-2">{ar ? "اختر إعلانك" : "Choose your listing"}</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {ar ? "لا توجد إعلانات. أنشئ إعلان أولاً." : "No listings yet. Create a listing first."}
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1.5 pe-1">
              {listings.map((it) => {
                const isDraft = it.status === "draft";
                const isSelected = it.id === selectedId;
                return (
                  <button
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-start transition ${isSelected ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border/60 hover:bg-muted/50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Rocket size={16} className="text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{it.title}</p>
                      <div className="flex items-center gap-1.5">
                        <Price value={it.price} lang={lang} country={it.country} />
                        {isDraft && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            <FileText size={9} /> {ar ? "مسودة" : "Draft"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0"><Sparkles size={12} className="text-white" /></div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Duration slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">{ar ? "مدة الرعاية" : "Sponsorship duration"}</p>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{weeks} {ar ? "أسبوع" : weeks === 1 ? "week" : "weeks"}</span>
          </div>
          <Slider value={[weeks]} min={SPONSOR_MIN_WEEKS} max={SPONSOR_MAX_WEEKS} step={1} onValueChange={(v) => setWeeks(v[0])} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 {ar ? "أسبوع" : "wk"}</span>
            <span>12 {ar ? "أسبوع" : "wks"}</span>
          </div>
        </div>

        {/* Price + pay */}
        <div className="rounded-2xl bg-muted p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{ar ? "الإجمالي" : "Total"}</p>
            <p className="text-xl font-extrabold"><Price value={amount} lang={lang} country="SA" /></p>
          </div>
          <button
            onClick={pay}
            disabled={!selectedId || paying}
            className="px-5 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {paying ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            {paying ? (ar ? "جارٍ الدفع…" : "Paying…") : (ar ? "ادفع ورعّي" : "Pay & Sponsor")}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {ar ? "يُحاسب المبلغ بالريال السعودي. يظهر السعر بعملتك للعلم فقط." : "Charged in SAR. Price shown in your currency for reference."}
        </p>
      </DialogContent>
    </Dialog>
  );
}