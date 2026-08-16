import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import ItemCard from "@/components/ItemCard";
import RatingStars from "@/components/RatingStars";

export default function UserProfile() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { lang } = useStore();
  const t = useT();
  const [items, setItems] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const name = params.get("name") || "—";
  const avatar = params.get("avatar");

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Item.list("-created_date", 200);
        setItems((all || []).filter((it) => it.seller_id === id));
        const rs = await base44.entities.Rating.filter({ rated_user_id: id }, "-created_date", 50);
        setRatings(rs || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : "—";

  return (
    <div className="pt-3 max-w-3xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>

      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30 shrink-0">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-2xl font-bold">{name?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{name}</h1>
            <div className="flex items-center gap-1.5 text-sm mt-0.5">
              <Star size={14} className="fill-amber-300 text-amber-300" />
              <span className="font-bold">{avg}</span>
              <span className="opacity-70">· {ratings.length} {t("ratings")}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-bold text-lg mt-5 mb-3">{t("myListings")} ({items.length})</h2>
      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p className="font-semibold">{t("emptyFeed")}</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />)}
        </div>
      )}

      <h2 className="font-bold text-lg mt-5 mb-3">{t("reviews")} ({ratings.length})</h2>
      {ratings.length ? (
        <div className="space-y-2.5">
          {ratings.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.rater_name || "—"}</span>
                <RatingStars value={r.score} size={14} />
              </div>
              {r.review && <p className="text-sm text-muted-foreground mt-1.5">{r.review}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(r.created_date, lang)}</p>
            </div>
          ))}
        </div>
      ) : (
        !loading && <div className="text-center py-10 text-muted-foreground"><p className="font-semibold">{t("noReviews")}</p></div>
      )}
    </div>
  );
}