import React from "react";
import { useT } from "@/lib/i18n";

// Returns a localized day label for a timestamp relative to "now":
// "Today", "Yesterday", weekday name, or a full date for older messages.
export function dayLabel(date, lang, t) {
  const d = new Date(date);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { weekday: "long" });
  }
  return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
}

// Decides whether a date separator should be shown before the item at index i,
// based on whether its day differs from the previous item's day.
export function shouldShowSeparator(timeline, i) {
  if (i === 0) return true;
  const cur = new Date(timeline[i].created_date);
  const prev = new Date(timeline[i - 1].created_date);
  return cur.toDateString() !== prev.toDateString();
}

export default function ChatDateSeparator({ date, lang, t }) {
  return (
    <div className="flex justify-center my-2">
      <span className="px-3 py-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
        {dayLabel(date, lang, t)}
      </span>
    </div>
  );
}