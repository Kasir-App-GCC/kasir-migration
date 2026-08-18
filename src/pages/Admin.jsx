import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Tag, Flag, LifeBuoy, ArrowLeft, MessageSquare, ShieldX } from "lucide-react";
import { useStore } from "@/lib/store";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminListings from "@/components/admin/AdminListings";
import AdminReports from "@/components/admin/AdminReports";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminBlacklist from "@/components/admin/AdminBlacklist";

export default function Admin() {
  const { lang, user } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [tab, setTab] = useState("dashboard");

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

      <div className="flex gap-1 p-1 bg-muted rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`shrink-0 px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${tab === tb.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            <tb.icon size={16} /> {tb.label}
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
    </div>
  );
}