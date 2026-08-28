import React, { useEffect, useState } from "react";
import { Rocket, FileText, Loader2, Sparkles, Building2, Send, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import Price from "@/components/Price";
import { computeSponsorPrice, SPONSOR_MIN_WEEKS, SPONSOR_MAX_WEEKS } from "@/lib/sponsorPricing";
import SponsorPaymentDialog from "@/components/SponsorPaymentDialog";

// Self-service sponsorship dialog: the seller picks one of their listings
// (drafts included, badged), picks a duration (1–12 weeks), and submits a
// REQUEST to the admin. No payment here — once the admin approves, the user
// gets a notification to pay, and on payment the item is instantly sponsored.
export default function SponsorItemDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [weeks, setWeeks] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [blockedIds, setBlockedIds] = useState(() => new Set());
  const [approvedByItem, setApprovedByItem] = useState(() => new Map());
  const [payRequestId, setPayRequestId] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelectedId("");
    setWeeks(1);
    setDone(false);
    Promise.all([
      base44.entities.Item.filter({ seller_id: user.id }, "-created_date", 200),
      base44.entities.SponsorRequest.filter({ user_id: user.id, status: { $in: ["pending", "approved"] } }, "-created_date", 100).catch(() => []),
    ])
      .then(([list, reqs]) => {
        setListings(list || []);
        const pending = new Set();
        const approved = new Map();
        (reqs || []).forEach((r) => {
          if (r.status === "pending") pending.add(r.item_id);
          else if (r.status === "approved") approved.set(r.item_id, r.id);
        });
        setBlockedIds(pending);
        setApprovedByItem(approved);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  const amount = computeSponsorPrice(weeks);
  const selectedItem = listings.find((x) => x.id === selectedId);
  const arWeeks = (n) => (n === 1 ? "أسبوع" : n === 2 ? "أسبوعين" : "أسابيع");

  const submit = async () => {
    if (!selectedItem || submitting) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createSponsorRequest", {
        item_id: selectedItem.id,
        weeks,
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      if (data.already_pending) {
        toast({ title: ar ? "يوجد طلب قيد المراجعة لهذا الإعلان" : "This item already has a pending request", variant: "destructive" });
        return;
      }
      if (data.already_sponsored) {
        toast({ title: ar ? "هذا الإعلان مموّل حالياً" : "This item is already sponsored", variant: "destructive" });
        return;
      }
      setDone(true);
      toast({ title: ar ? "تم إرسال طلب الرعاية ✅" : "Sponsorship request sent ✅", description: ar ? "سيتم إشعارك بعد موافقة الإدارة" : "You'll be notified once the admin approves" });
    } catch (e) {
      toast({ title: ar ? "تعذّر إرسال الطلب" : "Couldn't submit request", description: e?.message || "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket size={20} className="text-violet-500" />
            {ar ? "رعاية إعلان" : "Sponsor an item"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "ثبّت إعلانك في مقدمة الصفحة الرئيسية ليبرز بين الإعلانات." : "Pin your listing to the top of the home feed."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle2 size={30} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-base font-bold">{ar ? "تم إرسال طلبك!" : "Request sent!"}</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {ar ? "تراجع الإدارة طلبك. عند الموافقة، يصلك إشعار لتسديد المبلغ، وبمجرد الدفع يُفعّل إعلانك فوراً في المقدمة." : "The admin will review your request. Once approved, you'll get a notification to pay — and the moment you pay, your listing is sponsored instantly."}
            </p>
            <button onClick={() => onClose?.()} className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm">
              {ar ? "تم" : "Done"}
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3.5 flex gap-2.5">
              <Building2 size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-violet-800 dark:text-violet-200">{ar ? "مخصصة للشركات والتجار" : "Built for businesses & merchants"}</p>
                <p className="text-xs text-violet-700 dark:text-violet-300 mt-1 leading-relaxed">
                  {ar ? "يرسل هذا النموذج طلباً للإدارة للمراجعة. عند الموافقة يصلك إشعار للدفع، وبعده يُثبّت إعلانك في المقدمة." : "This form sends a request to the admin for review. Once approved you'll be notified to pay, and then your listing is pinned to the top."}
                </p>
              </div>
            </div>

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
                    const isCurrentlySponsored = it.admin_sponsored && it.admin_sponsored_until && new Date(it.admin_sponsored_until) > new Date();
                    const isPending = blockedIds.has(it.id);
                    const approvedReqId = approvedByItem.get(it.id);
                    const isAwaitingPayment = !!approvedReqId;
                    const isBlocked = isPending || isCurrentlySponsored;
                    return (
                      <button
                        key={it.id}
                        disabled={isBlocked}
                        onClick={() => (isAwaitingPayment ? setPayRequestId(approvedReqId) : setSelectedId(it.id))}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-start transition ${isBlocked ? "opacity-50 cursor-not-allowed border-border/60" : isAwaitingPayment ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100/60 dark:hover:bg-violet-950/50" : isSelected ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border/60 hover:bg-muted/50"}`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Rocket size={16} className="text-muted-foreground" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{it.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Price value={it.price} lang={lang} country={it.country} />
                            {isDraft && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                <FileText size={9} /> {ar ? "مسودة" : "Draft"}
                              </span>
                            )}
                            {isAwaitingPayment && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-600 text-white">
                                {ar ? "بانتظار الدفع" : "Awaiting payment"}
                              </span>
                            )}
                            {isBlocked && (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isCurrentlySponsored ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                                {isCurrentlySponsored ? (ar ? "مُمول حالياً" : "Sponsored") : (ar ? "قيد المراجعة" : "Under review")}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{ar ? "مدة الرعاية" : "Sponsorship duration"}</p>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{weeks} {ar ? arWeeks(weeks) : weeks === 1 ? "week" : "weeks"}</span>
              </div>
              <div dir="ltr">
                <Slider value={[weeks]} min={SPONSOR_MIN_WEEKS} max={SPONSOR_MAX_WEEKS} step={1} onValueChange={(v) => setWeeks(v[0])} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1 {ar ? "أسبوع" : "wk"}</span>
                  <span>12 {ar ? "أسابيع" : "wks"}</span>
                </div>
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
                className="px-5 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "أرسل الطلب" : "Submit request")}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {ar ? "يُحاسب المبلغ بالريال السعودي بعد الموافقة. يظهر السعر بعملتك للعلم فقط." : "Charged in SAR after approval. Price shown in your currency for reference."}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
    <SponsorPaymentDialog open={!!payRequestId} requestId={payRequestId} onClose={() => setPayRequestId("")} />
    </>
  );
}