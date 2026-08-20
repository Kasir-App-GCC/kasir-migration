import React, { useEffect, useState } from "react";
import { Users, Tag, Flag, LifeBuoy, DollarSign, ShoppingBag, AlertTriangle, Wallet, X, TrendingUp, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";

export default function AdminDashboard() {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(false);

  useEffect(() => {
    (async () => {
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
        // so dashboard stats reflect real marketplace activity only.
        const realItems = (items || []).filter((i) => !(i.seller_id || "").startsWith("seed-"));
        // Total Sales = count of agreed (accepted/completed) offers, not item
        // status — so deleting the item or chat doesn't change the sales count.
        const soldOffers = (offers || []).filter((o) => (o.status === "accepted" || o.status === "completed") && !(o.seller_id || "").startsWith("seed-"));
        // Platform revenue = approved boost fees + approved verification fees.
        // Sold items' prices are the sellers' GMV, NOT the platform's revenue.
        const approvedBoosts = (boosts || []).filter((b) => b.status === "approved");
        const boostRevenue = approvedBoosts.reduce((s, b) => s + (b.amount || 0), 0);
        const boostUsers = new Set(approvedBoosts.map((b) => b.user_id).filter(Boolean)).size;
        const approvedVerifications = (verifications || []).filter((v) => v.status === "approved");
        const verificationRevenue = approvedVerifications.length * VERIFICATION_FEE;
        const verificationUsers = new Set(approvedVerifications.map((v) => v.user_id).filter(Boolean)).size;
        const revenue = boostRevenue + verificationRevenue;
        // Total money spent = sum of agreed (accepted/completed) offer amounts,
        // i.e. the actual transaction value buyers paid, not the listing price.
        const totalSpent = soldOffers.reduce((s, o) => s + (o.amount || 0), 0);
        const trusted = (users || []).filter((u) => u.is_trusted).length;
        const banned = (users || []).filter((u) => u.is_banned).length;
        const openTickets = (tickets || []).filter((t) => t.status === "open").length;
        const openReports = (reports || []).filter((r) => !r.resolved).length;
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
          reports: openReports,
          tickets: openTickets,
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
    { icon: Users, label: ar ? "المستخدمين" : "Users", value: stats.users, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { icon: ShoppingBag, label: ar ? "الإعلانات" : "Listings", value: stats.items, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Tag, label: ar ? "إجمالي المبيعات" : "Total Sales", value: stats.sold, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
    { icon: Wallet, label: ar ? "إجمالي المنفق" : "Total Spent", value: formatPrice(stats.totalSpent, country), color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
    { icon: DollarSign, label: ar ? "إيرادات المنصة" : "Platform Revenue", value: formatPrice(stats.revenue, country), color: "text-green-500 bg-green-50 dark:bg-green-950/30", onClick: () => setShowRevenue(true) },
    { icon: AlertTriangle, label: ar ? "موثوقون" : "Trusted", value: stats.trusted, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" },
    { icon: Flag, label: ar ? "بلاغات مفتوحة" : "Open Reports", value: stats.reports, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30" },
    { icon: LifeBuoy, label: ar ? "تذاكر مفتوحة" : "Open Tickets", value: stats.tickets, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
            <div key={c.label} className="rounded-2xl bg-card border border-border/60 p-4">{inner}</div>
          );
        })}
      </div>
      {stats.banned > 0 && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-sm text-rose-700 dark:text-rose-300">
          {ar ? `${stats.banned} مستخدم محظور حالياً` : `${stats.banned} user(s) currently banned`}
        </div>
      )}

      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRevenue(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{ar ? "تفصيل إيرادات المنصة" : "Platform Revenue Breakdown"}</h3>
              <button onClick={() => setShowRevenue(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {/* Boosts */}
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

              {/* Verification */}
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

              {/* Total */}
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