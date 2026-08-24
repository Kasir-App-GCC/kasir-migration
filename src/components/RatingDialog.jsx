import React, { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import RatingStars from "@/components/RatingStars";
import ReviewTagChips from "@/components/ReviewTagChips";

const SELLER_TAG_OPTIONS = [
  { en: "Fast replies", ar: "ردود سريعة" },
  { en: "Honest", ar: "صادق" },
  { en: "Item as described", ar: "السلعة مطابقة" },
  { en: "Good quality", ar: "جودة ممتازة" },
  { en: "Friendly", ar: "لطيف" },
  { en: "Fair price", ar: "سعر عادل" },
  { en: "Helpful", ar: "متعاون" },
  { en: "Quick meetup", ar: "استلام سريع" },
  { en: "Well packaged", ar: "تغليف ممتاز" },
  { en: "Slow replies", ar: "ردود بطيئة" },
  { en: "Item not as described", ar: "السلعة غير مطابقة" },
  { en: "Poor quality", ar: "جودة ضعيفة" },
  { en: "Rude", ar: "فظ" },
  { en: "Overpriced", ar: "سعر مرتفع" },
  { en: "No-show", ar: "لم يحضر" },
];
const BUYER_TAG_OPTIONS = [
  { en: "Fast payment", ar: "دفع سريع" },
  { en: "Polite", ar: "مهذب" },
  { en: "Punctual", ar: "ملتزم بالموعد" },
  { en: "Easy to deal with", ar: "سهل التعامل" },
  { en: "Responsive", ar: "يتجاوب بسرعة" },
  { en: "Serious buyer", ar: "مشتري جاد" },
  { en: "Friendly", ar: "لطيف" },
  { en: "Honest", ar: "صادق" },
  { en: "Slow replies", ar: "ردود بطيئة" },
  { en: "Lowball offer", ar: "سعر متدنٍ" },
  { en: "No-show", ar: "لم يحضر" },
  { en: "Rude", ar: "فظ" },
  { en: "Late payment", ar: "تأخر الدفع" },
  { en: "Flaky", ar: "غير جاد" },
];

export default function RatingDialog({ offer, user, lang, onClose, onDone }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const isBuyer = offer.buyer_id === user.id;
  const tagOptions = isBuyer ? SELLER_TAG_OPTIONS : BUYER_TAG_OPTIONS;
  const ratedId = isBuyer ? offer.seller_id : offer.buyer_id;
  const ratedName = isBuyer ? offer.seller_name : offer.buyer_name;
  const role = isBuyer ? "buyer" : "seller";
  const title = isBuyer ? (ar ? "قيّم البائع" : "Rate the seller") : (ar ? "قيّم المشتري" : "Rate the buyer");

  const [score, setScore] = useState(5);
  const [tags, setTags] = useState([]);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const existing = await base44.entities.Rating.filter(
          { rater_user_id: user.id, offer_id: offer.id },
          "-created_date",
          1
        );
        if (existing && existing.length) {
          setAlreadyRated(true);
        }
      } catch {}
      setChecking(false);
    })();
  }, [offer.id, user.id]);

  const submit = async () => {
    if (alreadyRated || submitting) return;
    setSubmitting(true);
    try {
      const tagText = tags.map((k) => tagOptions.find((o) => o.en === k)).filter(Boolean).map((o) => (ar ? o.ar : o.en)).join(" · ");
      const fullReview = [tagText, review].filter(Boolean).join(" · ");
      await base44.functions.invoke("submitRating", { offer_id: offer.id, score, review: fullReview });
      toast({ title: ar ? "تم إرسال التقييم" : "Rating submitted" });
      onDone?.();
    } catch (e) {
      const msg = String(e?.response?.data?.error || e?.message || "");
      if (msg.includes("already_rated")) { setAlreadyRated(true); }
      else toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && onClose?.()} />
      <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={() => onClose?.()} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        {checking ? (
          <div className="py-6 text-center">
            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : alreadyRated ? (
          <div className="py-6 text-center">
            <Star size={32} className="mx-auto mb-2 fill-amber-400 text-amber-400" />
            <p className="font-semibold text-sm">{ar ? "تم تقييم هذا العرض مسبقاً" : "You've already rated this offer"}</p>
            <button onClick={() => onClose?.()} className="mt-4 px-6 py-2.5 rounded-xl bg-muted font-bold text-sm">
              {ar ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">{ar ? "تقييمك" : "Your rating"}</p>
            <RatingStars value={score} size={34} interactive onChange={setScore} />
            <p className="text-xs text-muted-foreground mt-4 mb-2">{ar ? "إضافة سريعة" : "Quick tags"}</p>
            <ReviewTagChips options={tagOptions} selected={tags} onToggle={(k) => setTags((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} lang={lang} />
            <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder={ar ? "اكتب مراجعتك..." : "Write your review..."} rows={3} className="mt-3 w-full px-3.5 py-3 rounded-xl bg-muted text-sm outline-none resize-none" />
            <button onClick={submit} disabled={submitting} className="mt-4 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
              {submitting ? (ar ? "جاري..." : "Submitting...") : (ar ? "إرسال التقييم" : "Submit Rating")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}