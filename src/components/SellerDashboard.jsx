import React from "react";
import { Package, Eye, TrendingUp, Star, CheckCircle } from "lucide-react";
import Price from "@/components/Price";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function SellerDashboard({ myListings, ratings }) {
  const { lang, user } = useStore();
  const t = useT();

  const active = myListings.filter((it) => it.status !== "sold");
  const sold = myListings.filter((it) => it.status === "sold");
  const totalViews = myListings.reduce((s, it) => s + (Number(it.views) || 0), 0);
  const revenue = sold.reduce((s, it) => s + (Number(it.price) || 0), 0);
  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : user?.rating?.toFixed(1) || "5.0";
  const conversion = myListings.length ? Math.round((sold.length / myListings.length) * 100) : 0;

  const stats = [
    { icon: Package, label: t("activeListings"), value: active.length, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
    { icon: CheckCircle, label: t("soldItems"), value: sold.length, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { icon: Eye, label: t("totalViews"), value: totalViews, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { icon: Star, label: t("rating"), value: avg, color: "text-rose-600 bg-rose-50 dark:bg-rose-950" },
  ];

  return (
    <div className="rounded-3xl bg-card border border-border/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> {t("sellerDashboard")}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-muted/50 p-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <p className="font-extrabold text-lg leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-3.5">
        <div>
          <p className="text-xs text-muted-foreground">{t("totalRevenue")}</p>
          <p className="font-extrabold text-lg text-emerald-700 dark:text-emerald-300"><Price value={revenue} lang={lang} /></p>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted-foreground">{t("conversionRate")}</p>
          <p className="font-extrabold text-lg">{conversion}%</p>
        </div>
      </div>
    </div>
  );
}