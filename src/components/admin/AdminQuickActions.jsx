import React from "react";
import { Tag, Users, Flag, LifeBuoy, BadgeCheck, Rocket, Bell, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";

// One-tap shortcuts to the most common admin tasks, with badge counts for
// anything that needs immediate attention (open reports, pending verifications,
// etc.) so the admin can triage from the dashboard without scanning every tab.
export default function AdminQuickActions({ onNavigate, stats }) {
  const { lang } = useStore();
  const ar = lang === "ar";

  const actions = [
    { tab: "listings", icon: Tag, label: ar ? "الإعلانات" : "Listings", badge: 0 },
    { tab: "users", icon: Users, label: ar ? "المستخدمون" : "Users", badge: 0 },
    { tab: "reports", icon: Flag, label: ar ? "البلاغات" : "Reports", badge: stats?.reports || 0 },
    { tab: "tickets", icon: LifeBuoy, label: ar ? "التذاكر" : "Tickets", badge: stats?.tickets || 0 },
    { tab: "verifications", icon: BadgeCheck, label: ar ? "التوثيق" : "Verifications", badge: stats?.pendingVerifications || 0 },
    { tab: "sponsor", icon: Rocket, label: ar ? "الرعاية" : "Sponsorship", badge: stats?.pendingSponsors || 0 },
    { tab: "broadcast", icon: Bell, label: ar ? "إشعار" : "Broadcast", badge: 0 },
    { tab: "payments_received", icon: Wallet, label: ar ? "المدفوعات" : "Payments", badge: 0 },
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {actions.map((a) => (
        <button
          key={a.tab}
          onClick={() => onNavigate(a.tab)}
          className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border/60 hover:shadow-md hover:border-border transition"
        >
          {a.badge > 0 && (
            <span className="absolute top-1.5 end-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {a.badge}
            </span>
          )}
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <a.icon size={18} className="text-muted-foreground" />
          </div>
          <span className="text-[11px] font-semibold text-center leading-tight">{a.label}</span>
        </button>
      ))}
    </div>
  );
}