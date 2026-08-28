import React, { useEffect, useState } from "react";
import { Users, Tag, Flag, LifeBuoy, DollarSign, ShoppingBag, Wallet, X, TrendingUp, ShieldCheck, Rocket, Heart, Link2, Building2, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import DemographicsCharts from "@/components/admin/DemographicsCharts";

export default function AdminDashboard({ onNavigate }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
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
      const [users, items, reports, tickets, offers, sponsorReqs, pendingBoosts, pendingVerifs, payRes] = await Promise.all([
        base44.entities.User.list("-created_date", 500),
        base44.entities.Item.list("-created_date", 500),
        base44.entities.Report.list("-created_date", 200),
        base44.entities.SupportTicket.list("-created_date", 200),
        base44.entities.Offer.list("-created_date", 500),
        base44.entities.SponsorRequest.list("-created_date", 200),
        base44.entities.BoostRequest.filter({ status: "pending" }, "-created_date", 200).catch(() => []),
        base44.entities.VerificationRequest.filter({ status: "pending" }, "-created_date", 200).catch(() => []),
        // searchPayments aggregates ALL paid services server-side: boosts,
        // verifications, sponsorships, app support, payment links, broker fees.
        base44.functions.invoke("searchPayments", { type: "all", page: 1, limit: 10 }).catch(() => null),
      ]);
      const realItems = (items || []).filter((i) => !(i.seller_id || "").startsWith("seed-"));
      const soldOffers = (offers || []).filter((o) => (o.status === "accepted" || o.status === "completed") && !(o.seller_id || "").startsWith("seed-"));
      // Customer Spend only aggregates offers the buyer confirmed receiving
      // (received_confirmed = true). A stored reset date lets admins zero the
      // metric so only receipts after that point are counted.
      const spendResetDate = localStorage.getItem("customer_spend_reset_date");
      const confirmedReceipts = (offers || []).filter(
        (o) => o.received_confirmed === true &&
               !(o.seller_id || "").startsWith("seed-") &&
               (!spendResetDate || new Date(o.updated_date) >= new Date(spendResetDate))
      );
      const totalSpent = confirmedReceipts.reduce((s, o) => s + (o.amount || 0), 0);
      const trusted = (users || []).filter((u) => u.is_trusted).length;
      const banned = (users || []).filter((u) => u.is_banned).length;
      const ageBuckets = { under_16: 0, "16_19": 0, "20_29": 0, "30_39": 0, "40_49": 0, "50_plus": 0 };
      const genderBuckets = { male: 0, female: 0 };
      (users || []).forEach((u) => {
        if (u.age_range && ageBuckets[u.age_range] != null) ageBuckets[u.age_range]++;
        if (u.gender && genderBuckets[u.gender] != null) genderBuckets[u.gender]++;
      });

      // Revenue from searchPayments — the single source of truth for platform
      // income across ALL paid services.
      const payData = payRes?.data || payRes || {};
      const payTotals = payData.totals || { total: 0, byType: {} };
      const payCounts = payData.counts || {};

      setStats({
        users: users?.length || 0,
        items: realItems.length,
        sold: soldOffers.length,
        totalSpent,
        revenue: payTotals.total || 0,
        revenueByType: payTotals.byType || {},
        boostUsers: payCounts.boost || 0,
        verificationUsers: payCounts.verification || 0,
        trusted,
        banned,
        reports: (reports || []).filter((r) => !r.resolved).length,
        tickets: (tickets || []).filter((t) => t.status === "open").length,
        pendingVerifications: (pendingVerifs || []).length,
        pendingBoosts: (pendingBoosts || []).length,
        pendingSponsors: (sponsorReqs || []).filter((s) => s.status === "pending").length,
        ageBuckets,
        genderBuckets,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const resetCustomerSpend = () => {
    if (!window.confirm(ar ? "تصفير إنفاق العملاء؟ سيُحتسب فقط ما يأتي بعد الآن." : "Reset Customer Spend? Only receipts from now on will be counted.")) return;
    localStorage.setItem("customer_spend_reset_date", new Date().toISOString());
    fetchStats();
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</div>;
  if (!stats) return null;

  const cards = [
    { icon: Users, label: ar ? "المستخدمين" : "Users", value: stats.users, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { icon: ShoppingBag, label: ar ? "الإعلانات" : "Listings", value: stats.items, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Tag, label: ar ? "العروض المقبولة" : "Accepted Offers", value: stats.sold, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
    { icon: Wallet, label: ar ? "إنفاق العملاء" : "Customer Spend", value: formatPrice(stats.totalSpent, country), color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30", onReset: resetCustomerSpend },
    { icon: DollarSign, label: ar ? "إيرادات المنصة" : "Platform Revenue", value: formatPrice(stats.revenue, country), color: "text-green-500 bg-green-50 dark:bg-green-950/30", onClick: () => setShowRevenue(true) },
    { icon: ShieldCheck, label: ar ? "موثوقون" : "Trusted", value: stats.trusted, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" },
    { icon: Flag, label: ar ? "بلاغات مفتوحة" : "Open Reports", value: stats.reports, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30" },
    { icon: LifeBuoy, label: ar ? "تذاكر مفتوحة" : "Open Tickets", value: stats.tickets, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  ];

  const REVENUE_TYPES = [
    { key: "boost", icon: TrendingUp, label: ar ? "التعزيز" : "Boosts", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
    { key: "verification", icon: ShieldCheck, label: ar ? "التوثيق" : "Verification", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20" },
    { key: "sponsor", icon: Rocket, label: ar ? "الرعاية" : "Sponsorship", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/20" },
    { key: "donation", icon: Heart, label: ar ? "الدعم" : "App Support", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "payment_link", icon: Link2, label: ar ? "روابط الدفع" : "Payment Links", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20" },
    { key: "broker_fee", icon: Building2, label: ar ? "وسيط عقاري" : "Broker Fees", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
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
            <div key={c.label} className="relative rounded-2xl bg-card border border-border/60 p-4">
              {c.onReset && (
                <button
                  onClick={c.onReset}
                  className="absolute top-2 end-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition"
                  title={ar ? "تصفير" : "Reset"}
                >
                  <RotateCcw size={14} />
                </button>
              )}
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

      <DemographicsCharts stats={stats} />

      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRevenue(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{ar ? "تفصيل إيرادات المنصة" : "Platform Revenue Breakdown"}</h3>
              <button onClick={() => setShowRevenue(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {REVENUE_TYPES.map((rt) => {
                const Icon = rt.icon;
                const amount = stats.revenueByType[rt.key] || 0;
                return (
                  <div key={rt.key} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${rt.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-bold text-sm flex-1">{rt.label}</span>
                    <span className="font-extrabold text-sm">{formatPrice(amount, country)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-2xl bg-muted p-4 mt-2">
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