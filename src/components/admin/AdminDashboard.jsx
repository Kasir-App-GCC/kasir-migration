import React, { useEffect, useState } from "react";
import { Users, Tag, Flag, LifeBuoy, DollarSign, ShoppingBag, Wallet, X, TrendingUp, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";
import { AGE_RANGES, GENDERS } from "@/lib/demographics";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import AdminQuickActions from "@/components/admin/AdminQuickActions";

export default function AdminDashboard({ onNavigate }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState({ items: [], users: [], offers: [] });
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(false);

  // Clear stale localStorage resets from the testing period — all test data
  // has been purged, so dashboard metrics now reflect real marketplace activity.
  useEffect(() => {
    localStorage.removeItem("admin_dashboard_resets");
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [users, items, reports, tickets, ratings, boosts, verifications, offers] = await Promise.all([
        base44.entities.User.list("-created_date", 500),
        base44.entities.Item.list("-created_date", 500),
        base44.entities.Report.list("-created_date", 200),
        base44.entities.SupportTicket.list("-created_date", 200),
        base44.entities.Rating.list("-created_date", 500),
        base44.entities.BoostRequest.list("-created_date", 500),
        base44.entities.VerificationRequest.list("-created_date", 500),
        base44.entities.Offer.list("-created_date", 500),
      ]);
      // Exclude generated seed/test listings (seller_id starts with "seed-")
      const realItems = (items || []).filter((i) => !(i.seller_id || "").startsWith("seed-"));
      const soldOffers = (offers || []).filter((o) => (o.status === "accepted" || o.status === "completed") && !(o.seller_id || "").startsWith("seed-"));
      const approvedBoosts = (boosts || []).filter((b) => b.status === "approved");
      const boostRevenue = approvedBoosts.reduce((s, b) => s + (b.amount || 0), 0);
      const boostUsers = new Set(approvedBoosts.map((b) => b.user_id).filter(Boolean)).size;
      const approvedVerifications = (verifications || []).filter((v) => v.status === "approved");
      const verificationRevenue = approvedVerifications.length * VERIFICATION_FEE;
      const verificationUsers = new Set(approvedVerifications.map((v) => v.user_id).filter(Boolean)).size;
      const revenue = boostRevenue + verificationRevenue;
      const totalSpent = soldOffers.reduce((s, o) => s + (o.amount || 0), 0);
      const trusted = (users || []).filter((u) => u.is_trusted).length;
      const banned = (users || []).filter((u) => u.is_banned).length;
      const ageBuckets = { under_16: 0, "16_19": 0, "20_29": 0, "30_39": 0, "40_49": 0, "50_plus": 0 };
      const genderBuckets = { male: 0, female: 0 };
      (users || []).forEach((u) => {
        if (u.age_range && ageBuckets[u.age_range] != null) ageBuckets[u.age_range]++;
        if (u.gender && genderBuckets[u.gender] != null) genderBuckets[u.gender]++;
      });
      setStats({
        users: users?.length || 0,
        items: realItems.length,
        sold: soldOffers.length,
        totalSpent,
        revenue,
        boostRevenue,
        boostUsers,
        verificationRevenue,
        verificationUsers,
        trusted,
        banned,
        reports: (reports || []).filter((r) => !r.resolved).length,
        tickets: (tickets || []).filter((t) => t.status === "open").length,
        pendingVerifications: (verifications || []).filter((v) => v.status === "pending").length,
        pendingBoosts: (boosts || []).filter((b) => b.status === "pending").length,
        ageBuckets,
        genderBuckets,
      });
      setRecent({
        items: (items || []).slice(0, 5),
        users: (users || []).slice(0, 5),
        offers: (offers || []).slice(0, 5),
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <div className="py-10 text-center text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</div>;
  if (!stats) return null;

  const cards = [
    { icon: Users, label: ar ? "المستخدمين" : "Users", value: stats.users, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { icon: ShoppingBag, label: ar ? "الإعلانات" : "Listings", value: stats.items, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Tag, label: ar ? "العروض المقبولة" : "Accepted Offers", value: stats.sold, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
    { icon: Wallet, label: ar ? "إنفاق العملاء" : "Customer Spend", value: formatPrice(stats.totalSpent, country), color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
    { icon: DollarSign, label: ar ? "إيرادات المنصة" : "Platform Revenue", value: formatPrice(stats.revenue, country), color: "text-green-500 bg-green-50 dark:bg-green-950/30", onClick: () => setShowRevenue(true) },
    { icon: ShieldCheck, label: ar ? "موثوقون" : "Trusted", value: stats.trusted, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" },
    { icon: Flag, label: ar ? "بلاغات مفتوحة" : "Open Reports", value: stats.reports, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30" },
    { icon: LifeBuoy, label: ar ? "تذاكر مفتوحة" : "Open Tickets", value: stats.tickets, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <div className="space-y-4">
      <AdminQuickActions onNavigate={onNavigate} stats={stats} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => {
          const inner = (
            <>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${c.color}`}>
                <c.icon size={20} />
              </div>
              <p className="text-2xl font-extrabold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </>
          );
          return c.onClick ? (
            <button key={c.label} onClick={c.onClick} className="text-start rounded-2xl bg-card border border-border/60 p-4 hover:shadow-md hover:border-border transition">
              {inner}
            </button>
          ) : (
            <div key={c.label} className="rounded-2xl bg-card border border-border/60 p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {stats.banned > 0 && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-sm text-rose-700 dark:text-rose-300">
          {ar ? `${stats.banned} مستخدم محظور حالياً` : `${stats.banned} user(s) currently banned`}
        </div>
      )}

      <AdminRecentActivity items={recent.items} users={recent.users} offers={recent.offers} />

      <div className="rounded-2xl bg-card border border-border/60 p-4">
        <h3 className="font-bold text-sm mb-3">{ar ? "الديموغرافيا" : "Demographics"}</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{ar ? "الفئة العمرية" : "Age range"}</p>
            <div className="space-y-1.5">
              {AGE_RANGES.map((o) => {
                const count = stats.ageBuckets[o.id] || 0;
                const pct = stats.users ? Math.round((count / stats.users) * 100) : 0;
                return (
                  <div key={o.id} className="flex items-center gap-2">
                    <span className="text-xs w-20 shrink-0">{ar ? o.ar : o.en}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-end">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{ar ? "الجنس" : "Gender"}</p>
            <div className="space-y-1.5">
              {GENDERS.map((o) => {
                const count = stats.genderBuckets[o.id] || 0;
                const pct = stats.users ? Math.round((count / stats.users) * 100) : 0;
                return (
                  <div key={o.id} className="flex items-center gap-2">
                    <span className="text-xs w-28 shrink-0">{ar ? o.ar : o.en}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-end">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRevenue(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{ar ? "تفصيل إيرادات المنصة" : "Platform Revenue Breakdown"}</h3>
              <button onClick={() => setShowRevenue(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 p-4 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center"><TrendingUp size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">{ar ? "التمييز (Boosts)" : "Boosts"}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "إعلانات مميزة مدفوعة" : "Paid featured listings"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ar ? "الإيراد" : "Revenue"}</span>
                  <span className="font-extrabold">{formatPrice(stats.boostRevenue, country)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">{ar ? "عدد البائعين" : "Sellers"}</span>
                  <span className="font-bold">{stats.boostUsers}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900 p-4 bg-cyan-50 dark:bg-cyan-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white flex items-center justify-center"><ShieldCheck size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">{ar ? "التحقق" : "Verification"}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "طلبات توثيق مدفوعة" : "Paid verification requests"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ar ? "الإيراد" : "Revenue"}</span>
                  <span className="font-extrabold">{formatPrice(stats.verificationRevenue, country)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">{ar ? "عدد المستخدمين" : "Users"}</span>
                  <span className="font-bold">{stats.verificationUsers}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
                <span className="font-bold text-sm">{ar ? "الإجمالي" : "Total"}</span>
                <span className="text-xl font-extrabold">{formatPrice(stats.revenue, country)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}