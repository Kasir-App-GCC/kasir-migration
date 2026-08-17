import React from "react";

export default function ReviewTagChips({ options, selected, onToggle, lang }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.en);
        return (
          <button
            key={opt.en}
            type="button"
            onClick={() => onToggle(opt.en)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {lang === "ar" ? opt.ar : opt.en}
          </button>
        );
      })}
    </div>
  );
}