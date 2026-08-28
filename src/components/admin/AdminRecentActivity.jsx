import React from "react";
import { Tag, Users, ArrowLeftRight, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { Image } from "@/components/ui/image";

function timeAgo(date, ar) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return ar ? "الآن" : "now";
  if (mins < 60) return ar ? `${mins} د` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return ar ? `${hours} س` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return ar ? `${days} ي` : `${days}d`;
}

const STATUS_STYLES = {
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  countered: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
};

// Compact 3-column feed showing the latest listings, users, and offers so the
// admin can see what's happening at a glance without leaving the dashboard.
export default function AdminRecentActivity({ items, users, offers }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const Empty = () => (
    <p className="text-xs text-muted-foreground/50 py-4 text-center">{ar ? "لا يوجد بعد" : "Nothing yet"}</p>
  );

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
        <Clock size={16} /> {ar ? "النشاط الأخير" : "Recent Activity"}
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Latest Listings */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1"><Tag size={12} /> {ar ? "أحدث الإعلانات" : "Latest Listings"}</p>
          {!items.length ? <Empty /> : items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 text-xs py-1">
              {it.images?.[0] ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <Image src={it.images[0]} fittingType="fill" className="w-full h-full" />
                </div>
              ) : <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{it.title}</p>
                <p className="text-muted-foreground">{formatPrice(it.price, country)}</p>
              </div>
              <span className="text-muted-foreground/50 shrink-0 text-[10px]">{timeAgo(it.created_date, ar)}</span>
            </div>
          ))}
        </div>

        {/* Latest Users */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1"><Users size={12} /> {ar ? "أحدث المستخدمين" : "Latest Users"}</p>
          {!users.length ? <Empty /> : users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 text-xs py-1">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0 flex items-center justify-center font-bold text-[10px]">
                {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{u.full_name || u.username || u.email}</p>
                <p className="text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="text-muted-foreground/50 shrink-0 text-[10px]">{timeAgo(u.created_date, ar)}</span>
            </div>
          ))}
        </div>

        {/* Latest Offers */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1"><ArrowLeftRight size={12} /> {ar ? "أحدث العروض" : "Latest Offers"}</p>
          {!offers.length ? <Empty /> : offers.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-xs py-1">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 shrink-0 flex items-center justify-center">
                <ArrowLeftRight size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{o.item_title || (ar ? "عرض" : "Offer")}</p>
                <p className="text-muted-foreground">{formatPrice(o.amount, country)}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[o.status] || "bg-muted text-muted-foreground"}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}