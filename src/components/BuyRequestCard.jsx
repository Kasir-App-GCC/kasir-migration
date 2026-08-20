import React from "react";
import { MapPin, Clock, Tag, MessageCircle, Trash2, CheckCircle2, BadgeCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSellerInfo } from "@/lib/useTrusted";
import { CATEGORIES, getSubcategories } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import TrustedBadge from "@/components/TrustedBadge";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { localizeBuyRequestTag } from "@/lib/buyRequestTags";

export default function BuyRequestCard({ req, tab, canContact, onChat, onClose, onDelete, onUserClick, onVerify }) {
  const { lang } = useStore();
  const cat = CATEGORIES.find((c) => c.id === req.category);
  const subs = (req.subcategory || []).map((s) => getSubcategories(req.category).find((x) => x.en === s)).filter(Boolean);
  const sellerInfo = useSellerInfo(req.user_id);

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-sm leading-snug">{req.title}</h3>
        {req.budget != null && (
          <span className="shrink-0 px-2 py-1 rounded-lg bg-violet-500 text-white text-xs font-bold">
            <Price value={req.budget} lang={lang} country={req.country} />
          </span>
        )}
      </div>
      {req.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{req.description}</p>
      )}
      {req.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {req.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-semibold">
              {localizeBuyRequestTag(tag, lang)}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {cat && (
          <span className="inline-flex items-center gap-1">
            <Tag size={12} />
            {lang === "ar" ? cat.ar : cat.en}
          </span>
        )}
        {subs.map((sub) => (
          <span key={sub.en} className="inline-flex items-center gap-1">
            <Tag size={12} />
            {lang === "ar" ? sub.ar : sub.en}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} />
          {req.city || (lang === "ar" ? "كل المدن" : "Any city")}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />
          {timeAgo(req.created_date, lang)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <button
          onClick={() => onUserClick(req.user_id)}
          className="text-xs font-semibold hover:underline inline-flex items-center gap-1"
        >
          {req.user_name?.split(" ")[0]}
          {sellerInfo.trusted && <TrustedBadge size={13} />}
        </button>
        {tab === "browse" ? (
          canContact ? (
            <div className="flex gap-2">
              {req.whatsapp_enabled && req.whatsapp_number && (
                <a
                  href={`https://wa.me/${req.whatsapp_number.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                  title={lang === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
                >
                  <WhatsAppIcon size={16} />
                </a>
              )}
              <button
                onClick={() => onChat(req)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition"
              >
                <MessageCircle size={14} />
                {lang === "ar" ? "تواصل" : "Chat"}
              </button>
            </div>
          ) : (
            <button
              onClick={onVerify}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/40 transition"
            >
              <BadgeCheck size={14} />
              {lang === "ar" ? "وثّق للتواصل" : "Verify to contact"}
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onClose(req.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted text-xs font-semibold hover:bg-muted/70 transition"
            >
              <CheckCircle2 size={13} />
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
            <button
              onClick={() => onDelete(req.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-200 transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}