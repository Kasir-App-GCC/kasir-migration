import React from "react";
import { Tag, TrendingDown, Check } from "lucide-react";
import Price from "@/components/Price";

/**
 * Offer tug-of-war bar: visualises the offer amount against the item's asking
 * price on a gradient track, so the negotiation gap is visible at a glance
 * instead of just a number. Falls back to a clean amount pill when no asking
 * price is available.
 */
export default function OfferNegotiationBar({ offerAmount, itemPrice, lang, country }) {
  const ar = lang === "ar";
  const ask = Number(itemPrice) || 0;
  const amt = Number(offerAmount) || 0;

  if (!ask) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-100/70 dark:bg-amber-950/40 rounded-xl">
        <Tag size={15} className="text-amber-600" />
        <span className="text-lg font-extrabold"><Price value={amt} lang={lang} country={country} /></span>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (amt / ask) * 100));
  const atAsking = amt >= ask;
  const gapPct = Math.max(0, Math.round((1 - amt / ask) * 100));

  return (
    <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 p-2.5 space-y-2">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          <Tag size={14} className="text-amber-600" />
          <span className="text-lg font-extrabold leading-none"><Price value={amt} lang={lang} country={country} /></span>
        </div>
        {atAsking ? (
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><Check size={12} /> {ar ? "بسعر الطلب" : "At asking"}</span>
        ) : (
          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1"><TrendingDown size={12} /> {ar ? `${gapPct}% أقل` : `${gapPct}% off`}</span>
        )}
      </div>
      <div className="relative h-2.5 rounded-full bg-amber-200/60 dark:bg-amber-900/40 overflow-hidden">
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 end-0 w-0.5 bg-amber-700/50" />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="font-semibold">{ar ? "سعر الطلب" : "Asking"} · <Price value={ask} lang={lang} country={country} /></span>
      </div>
    </div>
  );
}