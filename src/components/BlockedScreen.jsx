import React from "react";
import { ShieldX, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";

export default function BlockedScreen({ reason }) {
  const { lang } = useStore();
  const { logout } = useAuth();
  const ar = lang === "ar";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto">
          <ShieldX size={40} className="text-rose-600" />
        </div>
        <h1 className="text-2xl font-extrabold">{ar ? "تم حظر حسابك" : "Account Suspended"}</h1>
        <p className="text-muted-foreground text-sm">
          {ar
            ? "تم حظر حسابك من استخدام كاسر. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم."
            : "Your account has been suspended from using Kasir. If you believe this is an error, please contact support."}
        </p>
        {reason && (
          <p className="text-xs text-muted-foreground bg-muted rounded-xl p-3">{ar ? "السبب: " : "Reason: "}{reason}</p>
        )}
        <button
          onClick={() => logout()}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {ar ? "تسجيل الخروج" : "Log out"}
        </button>
      </div>
    </div>
  );
}