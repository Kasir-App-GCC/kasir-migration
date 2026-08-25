import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Star, Tag, CheckCircle, Check, X, ArrowLeftRight, Pencil, BadgeCheck, TrendingUp, TrendingDown, Flag, LifeBuoy, Clock, Radar, UserPlus, Scale, Megaphone } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import DisputeReviewDialog from "@/components/DisputeReviewDialog";

export default function NotificationItem({ n, onMarkRead, onClick }) {
  const { lang, user } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [showDispute, setShowDispute] = useState(false);

  const handle = () => {
    if (n.type === "admin_report" || n.type === "admin_ticket" || n.type === "admin_verification" || n.type === "admin_boost" || n.type === "admin_dispute") {
      nav(`/admin?tab=${n.adminTab}`);
      onClick?.();
      return;
    }
    if (n.type === "new_follower") { onMarkRead?.(n); if (n.actorId) nav(`/user/${n.actorId}`); onClick?.(); return; }
    if (n.type === "price_drop") { onMarkRead?.(n); if (n.itemId) nav(`/item/${n.itemId}`); onClick?.(); return; }
    if (n.type === "dispute_resolved" || n.type === "dispute_opened") { onMarkRead?.(n); setShowDispute(true); return; }
    if (n.type === "admin_message" && n.disputeId && user?.role === "admin") { onMarkRead?.(n); nav(`/admin?tab=disputes`); onClick?.(); return; }
    if (n.type === "support_resolved") { onMarkRead?.(n); onClick?.(); return; }
    if (n.type === "rate") { onMarkRead?.(n); if (n.roomId) nav(`/chat/${n.roomId}`); else if (n.itemId) nav(`/item/${n.itemId}`); }
    else if (n.type === "sold" || n.type === "boost_approved" || n.type === "saved_search_match") { onMarkRead?.(n); if (n.itemId) nav(`/item/${n.itemId}`); }
    else if (n.type === "message" || n.type === "offer") nav(`/chat/${n.roomId}`);
    else if (n.roomId) { onMarkRead?.(n); nav(`/chat/${n.roomId}`); }
    onClick?.();
  };

  return (
    <>
    <button
      onClick={handle}
      className={`w-full flex items-start gap-3 p-2.5 rounded-xl bg-card border border-border/60 hover:bg-muted/50 transition text-start ${n.unread ? "ring-1 ring-primary/30" : ""}`}
    >
      {n.type === "sold" ? (
        n.image ? (
          <Image src={n.image} alt={n.name} fittingType="fill" className="w-10 h-10 rounded-xl shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 shrink-0 flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
        )
      ) : n.type === "offer_received" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
          <Tag size={18} />
        </div>
      ) : n.type === "offer_accepted" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <Check size={18} />
        </div>
      ) : n.type === "offer_rejected" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          <X size={18} />
        </div>
      ) : n.type === "offer_countered" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <ArrowLeftRight size={18} />
        </div>
      ) : n.type === "offer_modified" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <Pencil size={18} />
        </div>
      ) : n.type === "boost_approved" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <TrendingUp size={18} />
        </div>
      ) : n.type === "verification_submitted" || n.type === "verification_approved" || n.type === "verification_rejected" ? (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "verification_approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" : n.type === "verification_rejected" ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300" : "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300"}`}>
          <BadgeCheck size={18} />
        </div>
      ) : n.type === "admin_report" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          <Flag size={18} />
        </div>
      ) : n.type === "admin_ticket" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
          <LifeBuoy size={18} />
        </div>
      ) : n.type === "admin_verification" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <BadgeCheck size={18} />
        </div>
      ) : n.type === "admin_boost" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <TrendingUp size={18} />
        </div>
      ) : n.type === "admin_dispute" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          <Scale size={18} />
        </div>
      ) : n.type === "support_resolved" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <LifeBuoy size={18} />
        </div>
      ) : n.type === "offer_reminder" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <Clock size={18} />
        </div>
      ) : n.type === "saved_search_match" ? (
        n.image ? (
          <Image src={n.image} alt={n.name} fittingType="fill" className="w-10 h-10 rounded-xl shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300 shrink-0 flex items-center justify-center">
            <Radar size={18} />
          </div>
        )
      ) : n.type === "new_follower" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
          <UserPlus size={18} />
        </div>
      ) : n.type === "price_drop" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <TrendingDown size={18} />
        </div>
      ) : n.type === "dispute_resolved" || n.type === "dispute_opened" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
          <Scale size={18} />
        </div>
      ) : n.type === "rate" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <Star size={18} className="fill-amber-400 text-amber-400" />
        </div>
      ) : n.type === "admin_message" ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
          <Megaphone size={18} />
        </div>
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "message" ? "bg-primary/10 text-primary" : n.type === "offer" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300"}`}>
          {n.type === "message" ? <MessageCircle size={18} /> : n.type === "offer" ? <Tag size={18} /> : <Star size={18} className="fill-amber-400 text-amber-400" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{n.name || "—"}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(n.date, lang)}</span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-normal break-words">
          {n.text || (n.type === "rating" ? `${t("newRating")} · ${n.score}★` : n.type === "offer" ? t("offerMessage") : "")}
        </p>
      </div>
      {n.unread && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
    </button>
      {showDispute && (
        <DisputeReviewDialog
          disputeId={n.disputeId}
          chatroomId={n.roomId}
          onClose={() => setShowDispute(false)}
        />
      )}
    </>
  );
}