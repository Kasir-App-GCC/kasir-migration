import React from "react";

// Simple monochrome inline-SVG empty-state illustration + optional CTA.
// Used for "no results" and "empty feed" so they feel less broken.
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, lang }) {
  const ar = lang === "ar";
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-muted-foreground">
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="mb-4 text-muted-foreground/40">
        <rect x="20" y="28" width="80" height="56" rx="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 42h80" stroke="currentColor" strokeWidth="2.5" />
        <path d="M44 28v-6a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="2.5" />
        <path d="M56 60l3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M96 36l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M16 52l-8 8 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
      {Icon && <Icon size={28} className="mb-2 opacity-40" />}
      <p className="font-semibold text-lg text-foreground">{title}</p>
      {description && <p className="text-sm mt-1.5 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-95 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}