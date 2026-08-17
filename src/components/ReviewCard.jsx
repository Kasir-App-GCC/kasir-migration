import React from "react";
import { useNavigate } from "react-router-dom";
import RatingStars from "@/components/RatingStars";
import { timeAgo } from "@/lib/format";

export default function ReviewCard({ rating, item, lang, t }) {
  const nav = useNavigate();
  const img = item?.images?.[0] || (item ? `https://picsum.photos/seed/${encodeURIComponent(item.title || item.id)}/100/100` : null);
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{rating.rater_name || "—"}</span>
        <RatingStars value={rating.score} size={14} />
      </div>
      {rating.review && <p className="text-sm text-muted-foreground mt-1.5">{rating.review}</p>}
      <div className="flex items-end justify-between gap-2 mt-2">
        {item ? (
          <button
            onClick={() => nav(`/item/${item.id}`)}
            className="flex items-center gap-2 group min-w-0"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <img src={img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary line-clamp-1 text-start">{item.title}</span>
          </button>
        ) : (
          <span />
        )}
        <p className="text-[11px] text-muted-foreground shrink-0">{timeAgo(rating.created_date, lang)}</p>
      </div>
    </div>
  );
}