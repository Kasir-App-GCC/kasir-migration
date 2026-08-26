import React, { useEffect, useState } from "react";
import { Building2, Check, X, ExternalLink, ShieldCheck, Clock, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

export default function AdminRealEstate() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.User.filter({ re_license_status: "pending" }, "-created_date", 100);
      setUsers(list || []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const licenseTypeLabel = (t) => {
    const map = {
      individual_fal: ar ? "رخصة فال (فرد)" : "FAL (Individual)",
      establishment_fal: ar ? "رخصة فال (منشأة)" : "FAL (Establishment)",
    };
    return map[t] || t || "-";
  };

  const approve = async (u) => {
    setActing(u.id);
    try {
      await base44.entities.User.update(u.id, { re_license_status: "approved", re_license_review_reason: "" });
      // Auto-approve all of this seller's pending real estate listings so the
      // backlog from the old per-listing flow is cleared in one action.
      try {
        await base44.entities.Item.updateMany(
          { seller_id: u.id, category: "realestate", review_status: "pending" },
          { $set: { review_status: "approved", review_reason: "" } }
        );
      } catch {}
      try {
        await base44.entities.Notification.create({
          user_id: u.id,
          type: "listing_approved",
          text: ar ? "تم اعتماد ترخيصك العقاري — يمكنك الآن نشر إعلانات عقارية" : "Your real estate license was approved — you can now post real estate listings",
        });
      } catch {}
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast({ title: ar ? "تم الاعتماد" : "Approved" });
    } catch {
      toast({ title: ar ? "تعذّر الاعتماد" : "Failed to approve", variant: "destructive" });
    }
    setActing(null);
  };

  const reject = async (u) => {
    if (!reason.trim()) return;
    setActing(u.id);
    try {
      await base44.entities.User.update(u.id, { re_license_status: "rejected", re_license_review_reason: reason.trim() });
      try {
        await base44.entities.Notification.create({
          user_id: u.id,
          type: "listing_rejected",
          text: ar ? `تم رفض ترخيصك العقاري: ${reason.trim()}` : `Your real estate license was rejected: ${reason.trim()}`,
        });
      } catch {}
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setRejecting(null);
      setReason("");
      toast({ title: ar ? "تم الرفض" : "Rejected" });
    } catch {
      toast({ title: ar ? "تعذّر الرفض" : "Failed to reject", variant: "destructive" });
    }
    setActing(null);
  };

  const userName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.full_name || u.email || "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-indigo-500" />
        <h2 className="font-bold">{ar ? "مراجعة تراخيص الوساطة العقارية" : "Real Estate License Review"}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{ar ? "اعتمد ترخيص البائع مرة واحدة ليتمكن من نشر إعلانات عقارية دون مراجعة لكل إعلان" : "Approve a seller's license once so they can post real estate listings with no per-listing review"}</p>
      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-10">{ar ? "لا توجد تراخيص قيد المراجعة" : "No pending licenses"}</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">{userName(u)}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold"><Clock size={12} /> {ar ? "قيد المراجعة" : "Pending"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">{ar ? "نوع الترخيص" : "License type"}</p><p className="font-semibold">{licenseTypeLabel(u.re_license_type)}</p></div>
                <div><p className="text-muted-foreground">{ar ? "رقم الترخيص" : "License number"}</p><p className="font-semibold font-mono">{u.re_license_number || "-"}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">{ar ? "صاحب الترخيص" : "License holder"}</p><p className="font-semibold">{u.re_license_holder || "-"}</p></div>
                {u.re_establishment_number && <div className="col-span-2"><p className="text-muted-foreground">{ar ? "الرقم الموحد للمنشأة" : "Establishment number"}</p><p className="font-semibold font-mono">{u.re_establishment_number}</p></div>}
                <div><p className="text-muted-foreground">{ar ? "تاريخ الانتهاء" : "Expiry"}</p><p className={`font-semibold ${u.re_license_expiry && new Date(u.re_license_expiry) < new Date() ? "text-rose-600 dark:text-rose-400" : ""}`}>{u.re_license_expiry ? new Date(u.re_license_expiry).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}{u.re_license_expiry && new Date(u.re_license_expiry) < new Date() && (ar ? " · منتهية" : " · expired")}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={u.re_license_link || "https://eservicesredp.rega.gov.sa/auth/queries/Elanat"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition">
                  <ShieldCheck size={14} /> {ar ? "تحقق من REGA" : "Verify on REGA"}
                </a>
                {u.re_license_doc && (
                  <a href={u.re_license_doc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold">
                    <ExternalLink size={14} /> {ar ? "مستند الترخيص" : "License document"}
                  </a>
                )}
              </div>
              {rejecting === u.id ? (
                <div className="space-y-2">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ar ? "سبب الرفض" : "Rejection reason"} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-rose-500/30 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => reject(u)} disabled={!reason.trim() || acting === u.id} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">{ar ? "تأكيد الرفض" : "Confirm reject"}</button>
                    <button onClick={() => { setRejecting(null); setReason(""); }} className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold">{ar ? "إلغاء" : "Cancel"}</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => approve(u)} disabled={acting === u.id} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <Check size={15} /> {ar ? "اعتماد" : "Approve"}
                  </button>
                  <button onClick={() => setRejecting(u.id)} disabled={acting === u.id} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <X size={15} /> {ar ? "رفض" : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}