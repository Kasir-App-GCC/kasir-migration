import React from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, getSubcategories } from "@/lib/constants";

export default function CategoryBar({ categories, onCategoriesChange, subcategories, onSubcategoriesChange }) {
  const { lang } = useStore();
  const t = useT();

  const toggleCategory = (id) => {
    if (id === "all") {
      onCategoriesChange([]);
      onSubcategoriesChange([]);
      return;
    }
    const next = categories.includes(id) ? categories.filter((c) => c !== id) : [...categories, id];
    onCategoriesChange(next);
    const validSubs = new Set(next.flatMap((cid) => getSubcategories(cid)).map((s) => s.en));
    const pruned = subcategories.filter((s) => validSubs.has(s));
    if (pruned.length !== subcategories.length) onSubcategoriesChange(pruned);
  };

  const subs = categories.length
    ? Array.from(new Map(categories.flatMap((id) => getSubcategories(id)).map((s) => [s.en, s])).values())
    : [];

  const toggleSub = (id) => {
    onSubcategoriesChange(subcategories.includes(id) ? subcategories.filter((s) => s !== id) : [...subcategories, id]);
  };

  return (
    <div>
      <div className="overflow-x-auto no-scrollbar touch-pan-x py-2.5">
        <div className="flex gap-2 px-4 min-w-max">
          {CATEGORIES.map((c) => {
            const active = c.id === "all" ? categories.length === 0 : categories.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition border ${
                  active
                    ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                    : "bg-card text-foreground border-border/70 hover:bg-muted"
                } ${c.featured && !active ? "ring-1 ring-emerald-400/50" : ""}`}
              >
                <c.icon size={16} />
                {lang === "ar" ? c.ar : c.en}
              </button>
            );
          })}
        </div>
      </div>

      {subs.length > 0 && (
        <div className="overflow-x-auto no-scrollbar touch-pan-x pb-2">
          <div className="flex gap-2 px-4 min-w-max">
            <button
              onClick={() => onSubcategoriesChange([])}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                subcategories.length === 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
              }`}
            >
              {t("all")}
            </button>
            {subs.map((s) => {
              const active = subcategories.includes(s.en);
              return (
                <button
                  key={s.en}
                  onClick={() => toggleSub(s.en)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                    active
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-card text-foreground border-border/60 hover:bg-muted"
                  }`}
                >
                  {lang === "ar" ? s.ar : s.en}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}