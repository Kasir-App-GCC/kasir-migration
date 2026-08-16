import React from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryBar({ value, onChange }) {
  const { lang } = useStore();
  const t = useT();

  return (
    <div className="overflow-x-auto no-scrollbar py-2.5">
      <div className="flex gap-2 px-4 min-w-max">
        {CATEGORIES.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
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
  );
}