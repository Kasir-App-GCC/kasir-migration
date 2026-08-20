import React, { useEffect, useState } from "react";
import { Users, Tag, Flag, LifeBuoy, DollarSign, ShoppingBag, AlertTriangle, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";

export default function AdminDashboard() {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const soldItems = realItems.filter((i) => i.status === "sold");
        // Platform revenue = approved boost fees + approved verification fees.
        // Sold items' prices are the sellers' GMV, NOT the platform's revenue.
        const boostRevenue = (boosts || []).filter((b) => b.status === "approved").reduce((s, b) => s + (b.amount || 0), 0);
        const verificationRevenue = (verifications || []).filter((v) => v.status === "approved").length * VERIFICATION_FEE;
        const revenue = boostRevenue + verificationRevenue;
        // Total money spent = sum of agreed (accepted/completed) offer amounts,
        // i.e. the actual transaction value buyers paid, not the listing price.
        const totalSpent = (offers || [])
          .filter((o) => (o.status === "accepted" || o.status === "completed") && !(o.seller_id || "").startsWith("seed-"))
          .reduce((s, o) => s + (o.amount || 0), 0);
        const trusted = (users || []).filter((u) => u.is_trusted).length;
        const banned = (users || []).filter((u) => u.is_banned).length;
        const openTickets = (tickets || []).filter((t) => t.status === "open").length;
        const openReports = (reports || []).filter((r) => !r.resolved).length;
        setStats({
          users: users?.length || 0,
          items: realItems.length,
          sold: soldItems.length,
          totalSpent,
          revenue,
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
    { icon: DollarSign, label: ar ? "إيرادات المنصة" : "Platform Revenue", value: formatPrice(stats.revenue, country), color: "text-green-500 bg-green-50 dark:bg-green-950/30" },
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