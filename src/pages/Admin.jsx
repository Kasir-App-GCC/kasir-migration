import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Users, Tag, Flag, LifeBuoy, ArrowLeft, MessageSquare, ShieldX, BadgeCheck, TrendingUp, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminListings from "@/components/admin/AdminListings";
import AdminReports from "@/components/admin/AdminReports";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminBlacklist from "@/components/admin/AdminBlacklist";
import AdminVerifications from "@/components/admin/AdminVerifications";
import AdminBoosts from "@/components/admin/AdminBoosts";
import AdminOtpTest from "@/components/admin/AdminOtpTest";
import { base44 } from "@/api/base44Client";

export default function Admin() {
  const { lang, user } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "dashboard");
  const [counts, setCounts] = useState({ tickets: 0, reports: 0, verifications: 0, boosts: 0 });

  // Keep the active tab in sync with the URL so notification deep-links open
  // the right board section.
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== tab) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const [tickets, reports, verifications, boosts] = await Promise.allSettled([
          base44.entities.SupportTicket.filter({ status: "open" }, "-created_date", 500),
          base44.entities.Report.list("-created_date", 500),
          base44.entities.VerificationRequest.filter({ status: "pending" }, "-created_date", 500),
          base44.entities.BoostRequest.filter({ status: "pending" }, "-created_date", 500),
        ]);
        setCounts({
          tickets: tickets.value?.length || 0,
          reports: (reports.value || []).filter((r) => !r.resolved).length,
          verifications: verifications.value?.length || 0,
          boosts: boosts.value?.length || 0,
        });
      } catch {}
    })();
  }, [tab]);

  if (user?.role !== "admin") {
    return (
      <div className="pt-10 text-center text-muted-foreground">
        <p className="font-semibold">{ar ? "غير مصرح" : "Unauthorized"}</p>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: ar ? "لوحة التحكم" : "Dashboard" },
    { id: "users", icon: Users, label: ar ? "المستخدمون" : "Users" },
    { id: "messages", icon: MessageSquare, label: ar ? "الرسائل" : "Messages" },
    { id: "listings", icon: Tag, label: ar ? "الإعلانات" : "Listings" },
    { id: "reports", icon: Flag, label: ar ? "البلاغات" : "Reports" },
    { id: "tickets", icon: LifeBuoy, label: ar ? "التذاكر" : "Tickets" },
    { id: "blacklist", icon: ShieldX, label: ar ? "الحظر" : "Blacklist" },
    { id: "verifications", icon: BadgeCheck, label: ar ? "التوثيق" : "Verifications" },
    { id: "boosts", icon: TrendingUp, label: ar ? "التعزيزات" : "Boosts" },
    { id: "otp", icon: ShieldCheck, label: ar ? "تجربة OTP" : "OTP Test" },
  ];

  return (
    <div className="pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => nav("/profile")} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center shrink-0">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold">{ar ? "لوحة الإدارة" : "Admin Panel"}</h1>
          <p className="text-xs text-muted-foreground">{ar ? "تحكم كامل في التطبيق" : "Full control over the app"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-2xl">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => { setTab(tb.id); setSearchParams({ tab: tb.id }, { replace: true }); }}
            className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === tb.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            <tb.icon size={16} /> {tb.label}
            {counts[tb.id] > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <AdminDashboard />}
      {tab === "users" && <AdminUsers />}
      {tab === "messages" && <AdminMessages />}
      {tab === "listings" && <AdminListings />}
      {tab === "reports" && <AdminReports />}
      {tab === "tickets" && <AdminTickets />}
      {tab === "blacklist" && <AdminBlacklist />}
      {tab === "verifications" && <AdminVerifications />}
      {tab === "boosts" && <AdminBoosts />}
      {tab === "otp" && <AdminOtpTest />}
    </div>
  );
}