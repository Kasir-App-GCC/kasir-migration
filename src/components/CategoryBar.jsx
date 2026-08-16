import React from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, getSubcategories } from "@/lib/constants";

export default function CategoryBar({ value, onChange, subcategory, onSubcategory }) {
  const { lang } = useStore();
  const t = useT();
  const subs = value !== "all" ? getSubcategories(value) : [];

  return (
    <div>
      <div className="overflow-x-auto no-scrollbar py-2.5">
        <div className="flex gap-2 px-4 min-w-max">
          {CATEGORIES.map((c) => {
            const active = value === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c.id);
                  onSubcategory?.("");
                }}
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
        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2 px-4 min-w-max">
            <button
              onClick={() => onSubcategory?.("")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                !subcategory
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
              }`}
            >
              {t("all")}
            </button>
            {subs.map((s) => {
              const active = subcategory === s.en;
              return (
                <button
                  key={s.en}
                  onClick={() => onSubcategory?.(active ? "" : s.en)}
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