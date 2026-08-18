import React, { useEffect, useState } from "react";
import { Users, Tag, Flag, LifeBuoy, TrendingUp, DollarSign, ShoppingBag, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function AdminDashboard() {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getAdminStats");
        const s = res?.data;
        if (!s || s.error) throw new Error(s.error || "Failed");
        setStats({
          users: s.users,
          usersTruncated: s.usersTruncated,
          items: s.items,
          itemsTruncated: s.itemsTruncated,
          sold: s.sold,
          soldTruncated: s.soldTruncated,
          revenue: s.revenue,
          trusted: s.trusted,
          banned: s.banned,
          reports: s.reports,
          tickets: s.tickets,
          avgRating: s.avgRating,
          ratings: s.ratings,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;
  if (!stats) return null;

  const cards = [
    { icon: Users, label: ar ? "المستخدمين" : "Users", value: stats.usersTruncated ? `${stats.users}+` : stats.users, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { icon: ShoppingBag, label: ar ? "الإعلانات" : "Listings", value: stats.itemsTruncated ? `${stats.items}+` : stats.items, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Tag, label: ar ? "المباع" : "Sold", value: stats.soldTruncated ? `${stats.sold}+` : stats.sold, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
    { icon: DollarSign, label: ar ? "الإيرادات" : "Revenue", value: formatPrice(stats.revenue, country), color: "text-green-500 bg-green-50 dark:bg-green-950/30" },
    { icon: TrendingUp, label: ar ? "متوسط التقييم" : "Avg Rating", value: `${stats.avgRating} ★`, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
    { icon: AlertTriangle, label: ar ? "موثوقون" : "Trusted", value: stats.trusted, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" },
    { icon: Flag, label: ar ? "بلاغات مفتوحة" : "Open Reports", value: stats.reports, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30" },
    { icon: LifeBuoy, label: ar ? "تذاكر مفتوحة" : "Open Tickets", value: stats.tickets, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card border border-border/60 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-extrabold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      {stats.banned > 0 && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-sm text-rose-700 dark:text-rose-300">
          {ar ? `${stats.banned} مستخدم محظور حالياً` : `${stats.banned} user(s) currently banned`}
        </div>
      )}
    </div>
  );
}