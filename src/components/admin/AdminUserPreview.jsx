import React, { useEffect, useState } from "react";
import { X, BadgeCheck, Star, Phone, Mail, MapPin, Calendar, Package, ShoppingCart, Clock, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { Image } from "@/components/ui/image";
import RatingStars from "@/components/RatingStars";
import WhatsAppIcon from "@/components/WhatsAppIcon";

function arNum(n) { return new Intl.NumberFormat("ar-SA").format(n); }
function arNoun(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return few;
  return many;
}
function lastActiveLabel(iso, ar) {
  if (!iso) return ar ? "غير معروف" : "Unknown";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return ar ? "الآن" : "now";
  if (mins < 60) return ar ? `قبل ${arNum(mins)} ${arNoun(mins, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ar ? `قبل ${arNum(hrs)} ${arNoun(hrs, "ساعة", "ساعتين", "ساعات", "ساعة")}` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return ar ? `قبل ${arNum(days)} ${arNoun(days, "يوم", "يومين", "أيام", "يوماً")}` : `${days}d ago`;
}

export default function AdminUserPreview({ userId, onClose }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [counts, setCounts] = useState({ active: 0, sold: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [u, ratingList, items] = await Promise.all([
          base44.entities.User.filter({ id: userId }, "-created_date", 1).then((r) => r?.[0] || null),
          base44.entities.Rating.filter({ rated_user_id: userId }, "-created_date", 200).catch(() => []),
          base44.entities.Item.filter({ seller_id: userId }, "-created_date", 500).catch(() => []),
        ]);
        if (cancelled) return;
        setUser(u);
        setRatings(ratingList || []);
        const itemList = items || [];
        setCounts({
          active: itemList.filter((i) => i.status === "available" && i.review_status === "approved" && !i.archived).length,
          sold: itemList.filter((i) => i.status === "sold").length,
          pending: itemList.filter((i) => i.review_status === "pending").length,
        });
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const ratingAvg = ratings.length ? Math.round((ratings.reduce((s, r) => s + (Number(r.score) || 0), 0) / ratings.length) * 10) / 10 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-background rounded-3xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/95 backdrop-blur border-b border-border">
          <h3 className="font-bold text-base">{ar ? "تفاصيل البائع" : "Seller Details"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="py-16"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : !user ? (
          <p className="text-center text-muted-foreground py-16">{ar ? "المستخدم غير موجود" : "User not found"}</p>
        ) : (
          <div className="p-5 space-y-4">
            {/* Header: avatar + name + badges */}
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <Image src={user.avatar} fittingType="fill" className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {(user.first_name || user.full_name || "?").charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-lg truncate">{user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || "-"}</h4>
                  {user.is_trusted && <BadgeCheck size={18} className="text-sky-500 fill-sky-500/20 shrink-0" />}
                </div>
                {user.username && <p className="text-sm text-muted-foreground truncate">@{user.username}</p>}
                <div className="flex items-center gap-1 mt-0.5">
                  <RatingStars value={ratingAvg} size={13} />
                  <span className="text-xs font-semibold">{ratingAvg.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({arNum(ratings.length)})</span>
                </div>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.is_trusted ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" : "bg-muted text-muted-foreground"}`}>
                <ShieldCheck size={12} className="inline -mt-0.5 me-1" />
                {user.is_trusted ? (ar ? "موثّق" : "Verified") : (ar ? "غير موثّق" : "Not verified")}
              </span>
              {user.phone_verified && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {ar ? "هاتف مُؤكَّد" : "Phone verified"}
                </span>
              )}
              {user.is_banned && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {ar ? "محظور" : "Banned"}
                </span>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {user.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={15} className="text-muted-foreground shrink-0" />
                  <span className="truncate selectable" dir="ltr">{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={15} className="text-muted-foreground shrink-0" />
                  <span className="selectable" dir="ltr">{user.country_code || ""} {user.phone}</span>
                </div>
              )}
              {user.whatsapp_enabled && user.whatsapp_number && (
                <div className="flex items-center gap-2 text-sm">
                  <WhatsAppIcon size={15} className="text-emerald-600 shrink-0" />
                  <span className="selectable" dir="ltr">{user.whatsapp_number}</span>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted p-3 text-center">
                <Package size={16} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-lg font-bold">{arNum(counts.active)}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "إعلانات نشطة" : "Active listings"}</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <ShoppingCart size={16} className="mx-auto text-sky-500 mb-1" />
                <p className="text-lg font-bold">{arNum(counts.sold)}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "مبيعات" : "Sold"}</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <Clock size={16} className="mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold">{arNum(counts.pending)}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "قيد المراجعة" : "Pending"}</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="space-y-2 text-sm border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{ar ? "عضو منذ" : "Member since"}:</span>
                <span className="font-semibold">{new Date(user.created_date).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{ar ? "آخر نشاط" : "Last active"}:</span>
                <span className="font-semibold">{lastActiveLabel(user.last_active, ar)}</span>
              </div>
              {user.intent && (
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{ar ? "النية" : "Intent"}:</span>
                  <span className="font-semibold">{ar ? { buy: "شراء", sell: "بيع", both: "شراء وبيع" }[user.intent] : user.intent}</span>
                </div>
              )}
            </div>

            {/* Recent reviews */}
            {ratings.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-semibold mb-2">{ar ? "أحدث التقييمات" : "Recent reviews"}</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ratings.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-xl bg-muted p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{r.rater_name || (ar ? "مستخدم" : "User")}</span>
                        <RatingStars value={Number(r.score) || 0} size={11} />
                      </div>
                      {r.review && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.review}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}