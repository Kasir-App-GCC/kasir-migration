import React from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function FeaturedCarouselSkeleton() {
  const t = useT();
  return (
    <section className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-700 dark:to-slate-900 text-white p-4 overflow-hidden">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles size={18} />
        <h2 className="font-extrabold text-lg">{t("featuredStrip")}</h2>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 w-40">
            <div className="aspect-square rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-3.5 bg-white/10 rounded animate-pulse mt-2 w-3/4" />
            <div className="h-3 bg-white/10 rounded animate-pulse mt-1.5 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}