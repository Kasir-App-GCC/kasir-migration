import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Tag, Pencil, ArrowLeftRight, Clock } from "lucide-react";
import Price from "@/components/Price";

export default function OfferCard({ offer, user, lang, t, itemPrice, itemImage, itemTitle, country, onAccept, onReject, onCounter, onModify }) {
  const nav = useNavigate();
  const mine = offer.direction === "buyer_offer" ? offer.buyer_id === user.id : offer.seller_id === user.id;
  const isRecipient = offer.direction === "buyer_offer" ? offer.seller_id === user.id : offer.buyer_id === user.id;
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterVal, setCounterVal] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editVal, setEditVal] = useState(String(offer.amount));
  const [busy, setBusy] = useState(false);

  const whoLabel = offer.direction === "seller_counter"
    ? (mine ? t("yourCounter") : t("counterFromSeller"))
    : (mine ? t("yourOffer2") : t("offerFromBuyer"));

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const submitCounter = () => {
    const v = Number(counterVal);
    if (!v || v <= 0) return;
    run(() => onCounter(offer, v));
  };
  const submitEdit = () => {
    const v = Number(editVal);
    if (!v || v <= 0) return;
    run(() => onModify(offer, v));
  };

  const statusBadge = () => {
    if (offer.status === "accepted")
      return <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={13} /> {t("offerAccepted")}</span>;
    if (offer.status === "rejected")
      return <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><X size={13} /> {t("offerRejected")}</span>;
    if (offer.status === "countered")
      return <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><ArrowLeftRight size={13} /> {t("offerCountered")}</span>;
    if (offer.status === "completed")
      return <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={13} /> {t("completed")}</span>;
    return <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock size={13} /> {t("offerPending")}</span>;
  };

  return (
    <div className={`max-w-[80%] rounded-2xl border-2 ${mine ? "bg-primary/5 border-primary/30 rounded-br-md" : "bg-card border-border/60 rounded-bl-md"} p-3 w-[230px]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-muted-foreground truncate">{whoLabel}</span>
        {statusBadge()}
      </div>
      {(itemImage || itemTitle) && (
        <button
          type="button"
          onClick={() => offer.item_id && nav(`/item/${offer.item_id}`)}
          className="flex items-center gap-2 mb-2 p-1.5 rounded-xl bg-muted/60 hover:bg-muted transition w-full text-start"
        >
          {itemImage && <img src={itemImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
          <div className="min-w-0 flex-1">
            {itemTitle && <p className="text-xs font-semibold truncate">{itemTitle}</p>}
            {itemPrice != null && <p className="text-[11px] text-muted-foreground"><Price value={itemPrice} lang={lang} country={country} /></p>}
          </div>
        </button>
      )}
      {itemPrice != null && Number(itemPrice) !== Number(offer.amount) && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <span className="line-through"><Price value={itemPrice} lang={lang} country={country} /></span>
          <span>· {t("originalPrice")}</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 py-2 bg-amber-100/70 dark:bg-amber-950/40 rounded-xl">
        <Tag size={15} className="text-amber-600" />
        <span className="text-lg font-extrabold"><Price value={offer.amount} lang={lang} country={country} /></span>
      </div>

      {offer.status === "pending" && isRecipient && !counterOpen && (
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <button disabled={busy} onClick={() => run(() => onAccept(offer))} className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
            <Check size={13} /> {t("accept")}
          </button>
          <button disabled={busy} onClick={() => run(() => onReject(offer))} className="py-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
            <X size={13} /> {t("reject")}
          </button>
          <button disabled={busy} onClick={() => setCounterOpen(true)} className="py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
            <ArrowLeftRight size={13} /> {t("counter")}
          </button>
        </div>
      )}

      {offer.status === "pending" && isRecipient && counterOpen && (
        <div className="mt-2.5 flex gap-1.5">
          <input
            autoFocus
            value={counterVal}
            onChange={(e) => setCounterVal(e.target.value.replace(/\D/g, ""))}
            placeholder={t("enterCounter")}
            inputMode="numeric"
            className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-muted outline-none text-sm"
          />
          <button disabled={busy || !counterVal} onClick={submitCounter} className="px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">{t("send")}</button>
          <button onClick={() => setCounterOpen(false)} className="px-2 rounded-xl bg-muted text-xs">{t("cancel")}</button>
        </div>
      )}

      {offer.status === "pending" && mine && !editOpen && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground flex-1">{t("waitingResponse")}</span>
          <button disabled={busy} onClick={() => setEditOpen(true)} className="px-2.5 py-1.5 rounded-xl bg-muted text-xs font-semibold flex items-center gap-1">
            <Pencil size={12} /> {t("modify")}
          </button>
        </div>
      )}

      {offer.status === "pending" && mine && editOpen && (
        <div className="mt-2.5 flex gap-1.5">
          <input
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-muted outline-none text-sm"
          />
          <button disabled={busy || !editVal} onClick={submitEdit} className="px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">{t("save")}</button>
          <button onClick={() => setEditOpen(false)} className="px-2 rounded-xl bg-muted text-xs">{t("cancel")}</button>
        </div>
      )}

      {offer.status === "accepted" && (
        <p className="text-[11px] text-center text-muted-foreground mt-2">{t("agreedArrange")}</p>
      )}
    </div>
  );
}