import React, { useEffect, useState } from "react";
import { Building2, Check, X, ExternalLink, ShieldCheck, Clock, BadgeCheck, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

const REGA_INQUIRY_URL = "https://eservicesredp.rega.gov.sa/e-services/inquiry-about-the-real-estate-broker/form";

export default function AdminRealEstate() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [view, setView] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(null);
  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));

  // Normalize a phone for display: strips a doubled leading country code that
  // older license submissions stored (country_code was prepended to an already-
  // international phone, e.g. +9669665XXXXXXXX → +9665XXXXXXXX).
  const formatPhone = (p) => {
    if (!p) return "-";
    let s = String(p).replace(/\D/g, "");
    if (!s) return "-";
    for (const cc of ["966", "971", "968", "973", "965", "974"]) {
      if (s.startsWith(cc + cc)) { s = s.slice(cc.length); break; }
    }
    return "+" + s;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        base44.entities.User.filter({ re_license_status: "pending" }, "-created_date", 100),
        base44.entities.User.filter({ re_license_status: "approved" }, "-created_date", 100),
      ]);
      setPending(p || []);
      setApproved(a || []);
    } catch {
      setPending([]);
      setApproved([]);
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
      setPending((prev) => prev.filter((x) => x.id !== u.id));
      setApproved((prev) => [u, ...prev]);
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
      setPending((prev) => prev.filter((x) => x.id !== u.id));
      setRejecting(null);
      setReason("");
      toast({ title: ar ? "تم الرفض" : "Rejected" });
    } catch {
      toast({ title: ar ? "تعذّر الرفض" : "Failed to reject", variant: "destructive" });
    }
    setActing(null);
  };

  const revoke = async (u) => {
    setActing(u.id);
    try {
      await base44.entities.User.update(u.id, {
        re_license_status: "rejected",
        re_license_review_reason: ar ? "تم إلغاء الترخيص من قبل الإدارة" : "License revoked by admin",
      });
      try {
        await base44.entities.Notification.create({
          user_id: u.id,
          type: "listing_rejected",
          text: ar ? "تم إلغاء ترخيصك العقاري من قبل الإدارة. يرجى تحديث بياناتك وإعادة الإرسال للمراجعة." : "Your real estate license was revoked by the admin. Please update your details and resubmit for review.",
        });
      } catch {}
      // Archive all active Saudi real estate listings from this broker — an
      // unlicensed broker cannot legally advertise, so their ads must come
      // down immediately (same as the per-ad-license expiry rule).
      try {
        await base44.entities.Item.updateMany(
          { seller_id: u.id, category: "realestate", country: "SA", status: "available", archived: { $ne: true } },
          { $set: { archived: true } }
        );
      } catch {}
      setApproved((prev) => prev.filter((x) => x.id !== u.id));
      toast({ title: ar ? "تم إلغاء الترخيص" : "License revoked" });
    } catch {
      toast({ title: ar ? "تعذّر الإلغاء" : "Failed to revoke", variant: "destructive" });
    }
    setActing(null);
  };

  const userName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.full_name || u.email || "—";

  const renderCard = (u, isPending) => (
    <div key={u.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">{userName(u)}</p>
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold"><Clock size={12} /> {ar ? "قيد المراجعة" : "Pending"}</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold"><BadgeCheck size={12} /> {ar ? "معتمد" : "Approved"}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><p className="text-muted-foreground">{ar ? "نوع الترخيص" : "License type"}</p><p className="font-semibold">{licenseTypeLabel(u.re_license_type)}</p></div>
        <div><p className="text-muted-foreground">{ar ? "رقم الترخيص" : "License number"}</p><p className="font-semibold font-mono">{u.re_license_number || "-"}</p></div>
        <div className="col-span-2"><p className="text-muted-foreground">{ar ? "صاحب الترخيص" : "License holder"}</p><p className="font-semibold">{u.re_license_holder || "-"}</p></div>
        {u.re_establishment_number && <div className="col-span-2"><p className="text-muted-foreground">{ar ? "الرقم الموحد للمنشأة" : "Establishment number"}</p><p className="font-semibold font-mono">{u.re_establishment_number}</p></div>}
        <div><p className="text-muted-foreground">{ar ? "تاريخ الانتهاء" : "Expiry"}</p><p className={`font-semibold ${u.re_license_expiry && new Date(u.re_license_expiry) < new Date() ? "text-rose-600 dark:text-rose-400" : ""}`}>{u.re_license_expiry ? new Date(u.re_license_expiry).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}{u.re_license_expiry && new Date(u.re_license_expiry) < new Date() && (ar ? " · منتهية" : " · expired")}</p></div>
      </div>
      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 space-y-1.5">
        <p className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1"><ShieldCheck size={12} /> {ar ? "قائمة المطابقة قبل الاعتماد" : "Match checklist before approving"}</p>
        <div className="space-y-1">
          {[
            { key: "type", label: ar ? "نوع الوسيط" : "Broker type", value: licenseTypeLabel(u.re_license_type) },
            { key: "holder", label: ar ? "اسم الوسيط" : "Broker name", value: u.re_license_holder || "-" },
            ...(u.re_license_type === "establishment_fal" ? [{ key: "establishment", label: ar ? "الرقم الموحد للمنشأة" : "Establishment number", value: u.re_establishment_number || "-" }] : []),
            { key: "number", label: ar ? "رقم الرخصة" : "License number", value: u.re_license_number || "-" },
            { key: "expiry", label: ar ? "تاريخ الانتهاء" : "Expiry date", value: u.re_license_expiry ? new Date(u.re_license_expiry).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-" },
            { key: "phone", label: ar ? "رقم الجوال" : "Phone number", value: formatPhone(u.re_license_phone || u.phone || "") },
            ...(u.re_license_type === "individual_fal" ? [{ key: "national_id", label: ar ? "رقم الهوية" : "National ID", value: u.re_national_id || "-" }] : []),
          ].map((item) => (
            <label key={item.key} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={!!checked[`${u.id}-${item.key}`]} onChange={() => toggle(`${u.id}-${item.key}`)} className="mt-0.5 w-4 h-4 accent-sky-600 shrink-0" />
              <span className="text-[11px] text-sky-700 dark:text-sky-300 leading-tight">
                <span className="font-semibold">{item.label}: </span>
                <span className="font-mono">{item.value}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={REGA_INQUIRY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition">
          <ShieldCheck size={14} /> {ar ? "تحقق من REGA" : "Verify on REGA"}
        </a>
        {u.re_license_doc && (
          <a href={u.re_license_doc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold">
            <ExternalLink size={14} /> {ar ? "مستند الترخيص" : "License document"}
          </a>
        )}
      </div>
      {isPending ? (
        rejecting === u.id ? (
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
        )
      ) : (
        <button onClick={() => revoke(u)} disabled={acting === u.id} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Ban size={15} /> {ar ? "إلغاء الترخيص" : "Revoke license"}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-indigo-500" />
        <h2 className="font-bold">{ar ? "مراجعة تراخيص الوساطة العقارية" : "Real Estate License Review"}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{ar ? "اعتمد ترخيص البائع مرة واحدة ليتمكن من نشر إعلانات عقارية دون مراجعة لكل إعلان" : "Approve a seller's license once so they can post real estate listings with no per-listing review"}</p>
      <div className="flex gap-1 p-1 bg-muted rounded-2xl">
        <button onClick={() => setView("pending")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${view === "pending" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          {ar ? "قيد المراجعة" : "Pending"} {pending.length > 0 && `(${pending.length})`}
        </button>
        <button onClick={() => setView("approved")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${view === "approved" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          {ar ? "معتمدون" : "Approved"} {approved.length > 0 && `(${approved.length})`}
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : view === "pending" ? (
        pending.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{ar ? "لا توجد تراخيص قيد المراجعة" : "No pending licenses"}</p>
        ) : (
          <div className="space-y-3">{pending.map((u) => renderCard(u, true))}</div>
        )
      ) : (
        approved.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{ar ? "لا يوجد وسطاء معتمدون" : "No approved brokers"}</p>
        ) : (
          <div className="space-y-3">{approved.map((u) => renderCard(u, false))}</div>
        )
      )}
    </div>
  );
}