import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Users, Tag, Flag, LifeBuoy, ArrowLeft, MessageSquare, ShieldX, BadgeCheck, ShieldCheck, Megaphone, ShieldAlert, Bell, CreditCard, Link2, Building2, Wallet, Rocket } from "lucide-react";
import { useStore } from "@/lib/store";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminListings from "@/components/admin/AdminListings";
import AdminReports from "@/components/admin/AdminReports";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminBlacklist from "@/components/admin/AdminBlacklist";
import AdminVerifications from "@/components/admin/AdminVerifications";
import AdminBuyRequests from "@/components/admin/AdminBuyRequests";
import AdminOtpTest from "@/components/admin/AdminOtpTest";
import AdminPaymentTest from "@/components/admin/AdminPaymentTest";
import AdminPaymentLinks from "@/components/admin/AdminPaymentLinks";
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminBroadcast from "@/components/admin/AdminBroadcast";
import AdminRealEstate from "@/components/admin/AdminRealEstate";
import AdminSponsorRequests from "@/components/admin/AdminSponsorRequests";
import AdminPayments from "@/components/admin/AdminPayments";
import { base44 } from "@/api/base44Client";

export default function Admin() {
  const { lang, user } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "dashboard");
  const [counts, setCounts] = useState({ tickets: 0, reports: 0, verifications: 0, disputes: 0, realestate: 0, sponsor: 0 });

  // Keep the active tab in sync with the URL so notification deep-links open
  // the right board section.
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== tab) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const [tickets, reports, verifications, disputes, realestate, sponsorReqs] = await Promise.allSettled([
          base44.entities.SupportTicket.filter({ status: "open" }, "-created_date", 500),
          base44.entities.Report.list("-created_date", 500),
          base44.entities.VerificationRequest.filter({ status: "pending" }, "-created_date", 500),
          base44.entities.Dispute.filter({ status: "open" }, "-created_date", 500),
          base44.entities.User.filter({ re_license_status: "pending" }, "-created_date", 100),
          base44.entities.SponsorRequest.filter({ status: "pending" }, "-created_date", 200),
        ]);
        setCounts({
          tickets: tickets.value?.length || 0,
          reports: (reports.value || []).filter((r) => !r.resolved).length,
          verifications: (verifications.value || []).filter((r) => !(r.payment_receipt_url || "").startsWith("moyasar:")).length,
          disputes: disputes.value?.length || 0,
          realestate: realestate.value?.length || 0,
          sponsor: sponsorReqs.value?.length || 0,
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

  const tabGroups = [
    { label: "", tabs: [
      { id: "dashboard", icon: LayoutDashboard, label: ar ? "لوحة التحكم" : "Dashboard" },
    ]},
    { label: ar ? "إدارة" : "Manage", tabs: [
      { id: "users", icon: Users, label: ar ? "المستخدمون" : "Users" },
      { id: "messages", icon: MessageSquare, label: ar ? "الرسائل" : "Messages" },
      { id: "listings", icon: Tag, label: ar ? "الإعلانات" : "Listings" },
      { id: "buy_requests", icon: Megaphone, label: ar ? "طلبات الشراء" : "Buy Requests" },
    ]},
    { label: ar ? "إشراف" : "Moderate", tabs: [
      { id: "reports", icon: Flag, label: ar ? "البلاغات" : "Reports" },
      { id: "tickets", icon: LifeBuoy, label: ar ? "التذاكر" : "Tickets" },
      { id: "disputes", icon: ShieldAlert, label: ar ? "النزاعات" : "Disputes" },
      { id: "blacklist", icon: ShieldX, label: ar ? "الحظر" : "Blacklist" },
    ]},
    { label: ar ? "تحقق" : "Verify", tabs: [
      { id: "verifications", icon: BadgeCheck, label: ar ? "التوثيق" : "Verifications" },
      { id: "realestate", icon: Building2, label: ar ? "عقارات" : "Real Estate" },
    ]},
    { label: ar ? "مالية" : "Finance", tabs: [
      { id: "sponsor", icon: Rocket, label: ar ? "رعاية" : "Sponsorship" },
      { id: "payments_received", icon: Wallet, label: ar ? "المدفوعات" : "Payments" },
      { id: "payment_links", icon: Link2, label: ar ? "روابط الدفع" : "Payment Links" },
    ]},
    { label: ar ? "أدوات" : "Tools", tabs: [
      { id: "broadcast", icon: Bell, label: ar ? "إشعار" : "Broadcast" },
      { id: "otp", icon: ShieldCheck, label: ar ? "تجربة OTP" : "OTP Test" },
      { id: "payment", icon: CreditCard, label: ar ? "تجربة الدفع" : "Payment Test" },
    ]},
  ];
  const tabs = tabGroups.flatMap((g) => g.tabs);

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

      <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded-2xl">
        {tabGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {group.label && <span className="px-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50 hidden sm:inline">{group.label}</span>}
            {group.tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => { setTab(tb.id); setSearchParams({ tab: tb.id }, { replace: true }); }}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === tb.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                <tb.icon size={16} /> {tb.label}
                {counts[tb.id] > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
              </button>
            ))}
            {gi < tabGroups.length - 1 && <div className="h-6 w-px bg-border/50 hidden sm:block" />}
          </React.Fragment>
        ))}
      </div>

      {tab === "dashboard" && <AdminDashboard onNavigate={setTab} />}
      {tab === "users" && <AdminUsers />}
      {tab === "messages" && <AdminMessages />}
      {tab === "listings" && <AdminListings />}
      {tab === "buy_requests" && <AdminBuyRequests />}
      {tab === "reports" && <AdminReports />}
      {tab === "tickets" && <AdminTickets />}
      {tab === "blacklist" && <AdminBlacklist />}
      {tab === "verifications" && <AdminVerifications />}
      {tab === "realestate" && <AdminRealEstate />}
      {tab === "sponsor" && <AdminSponsorRequests />}
      {tab === "disputes" && <AdminDisputes />}
      {tab === "broadcast" && <AdminBroadcast />}
      {tab === "otp" && <AdminOtpTest />}
      {tab === "payment" && <AdminPaymentTest />}
      {tab === "payment_links" && <AdminPaymentLinks />}
      {tab === "payments_received" && <AdminPayments />}
    </div>
  );
}