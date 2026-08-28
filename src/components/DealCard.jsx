import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, ShieldAlert, Handshake, CheckCircle, Pencil } from "lucide-react";
import Price from "@/components/Price";
import MeetupFlow from "@/components/MeetupFlow";

// Consolidates the post-acceptance deal surface into one pinned card:
// stage progress, safety warning, the meetup flow, and all transaction
// actions (confirm receipt, request modification, mark as sold, rate,
// dispute). Replaces the old scattered buttons that lived in system
// messages and the offer card.
export default function DealCard({ offer, user, lang, otherName, meetup, onMeetupChange, itemTitle, itemCountry, otherTrusted, ratedOffers, onRate, onConfirm, onDispute, onRequestMod, hasMeetup, meetupCompleted }) {
  const ar = lang === "ar";
  const nav = useNavigate();
  const isBuyer = offer.buyer_id === user.id;
  const isSeller = !isBuyer;
  const completed = offer.status === "completed";
  const [modOpen, setModOpen] = useState(false);
  const [modVal, setModVal] = useState(String(offer.amount));

  const stages = [
    { label: ar ? "السعر" : "Price", done: true },
    { label: ar ? "اللقاء" : "Meetup", done: hasMeetup ? !!meetupCompleted || meetup?.status === "confirmed" : true },
    { label: ar ? "التسليم" : "Handover", done: completed },
  ];

  const canConfirmReceipt = hasMeetup
    ? !!meetupCompleted
    : Date.now() - new Date(offer.updated_date || offer.created_date).getTime() > 3600000;

  const showConfirmReceipt = isBuyer && offer.status === "accepted" && !offer.received_confirmed && onConfirm && canConfirmReceipt;
  const showRequestMod = offer.status === "accepted" && onRequestMod && !hasMeetup && !modOpen;
  const showMarkSold = isSeller && completed;
  const showRate = completed && onRate && !ratedOffers?.has(offer.id);
  const showDispute = offer.status === "accepted" || offer.status === "completed";

  const submitMod = () => {
    const v = Number(modVal);
    if (!v || v <= 0) return;
    onRequestMod(offer, v);
    setModOpen(false);
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.02] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Handshake size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm">{ar ? "الصفقة" : "Deal"}</p>
            {itemTitle && <p className="text-[11px] text-muted-foreground truncate">{itemTitle}</p>}
          </div>
        </div>
        <Price value={offer.amount} lang={lang} country={itemCountry} className="font-extrabold text-sm shrink-0" />
      </div>

      {/* Stage progress */}
      <div className="flex items-center justify-around">
        {stages.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {s.done ? <Check size={14} /> : i + 1}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Safety warning */}
      {!otherTrusted && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <ShieldAlert size={14} className="shrink-0" />
          <span>{isSeller ? (ar ? "تلتقي مع مشترٍ غير موثّق — خطّط لقاءك بأمان" : "Meeting an unverified buyer — plan safely") : (ar ? "تلتقي مع بائع غير موثّق — خطّط لقاءك بأمان" : "Meeting an unverified seller — plan safely")}</span>
        </div>
      )}

      {/* Meetup flow */}
      <MeetupFlow offer={offer} user={user} lang={lang} otherName={otherName} meetup={meetup} onMeetupChange={onMeetupChange} />

      {/* Transaction actions */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        {showConfirmReceipt && (
          <button onClick={() => onConfirm(offer)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
            <Check size={15} /> {ar ? "أكّدت الاستلام" : "Confirm receipt"}
          </button>
        )}
        {showRequestMod && (
          <button onClick={() => { setModVal(String(offer.amount)); setModOpen(true); }} className="w-full py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5">
            <Pencil size={13} /> {ar ? "طلب تعديل العرض" : "Request modification"}
          </button>
        )}
        {modOpen && (
          <div className="flex gap-1.5">
            <input autoFocus value={modVal} onChange={(e) => setModVal(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={ar ? "السعر الجديد" : "New price"} className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-muted outline-none text-sm" />
            <button onClick={submitMod} className="px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{ar ? "إرسال" : "Send"}</button>
            <button onClick={() => setModOpen(false)} className="px-2 rounded-xl bg-muted text-xs">{ar ? "إلغاء" : "Cancel"}</button>
          </div>
        )}
        {showMarkSold && (
          <button onClick={() => nav(`/item/${offer.item_id}?sold=1`)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
            <CheckCircle size={15} /> {ar ? "تعليم كمباع" : "Mark as sold"}
          </button>
        )}
        {showRate && (() => {
          const rateLabel = isBuyer ? (ar ? "قيّم البائع" : "Rate the seller") : (ar ? "قيّم المشتري" : "Rate the buyer");
          return (
            <button onClick={() => onRate(offer)} className="w-full py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5">
              <Star size={13} /> {rateLabel}
            </button>
          );
        })()}
        {showDispute && (
          <button onClick={() => onDispute(offer)} className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
            <ShieldAlert size={13} /> {ar ? "فتح نزاع" : "Open dispute"}
          </button>
        )}
      </div>
    </div>
  );
}