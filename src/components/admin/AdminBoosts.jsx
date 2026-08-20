import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, X, CheckCircle2, ExternalLink, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";
import { sendPush } from "@/lib/notify";

const STATUS = {
  pending: { en: "Pending", ar: "قيد المراجعة", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  approved: { en: "Approved", ar: "موافق", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

export default function AdminBoosts() {
  const { lang, user: admin } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [showBuyers, setShowBuyers] = useState(false);

  // Aggregate approved boosts per buyer to track who purchased boosts.
  const buyers = useMemo(() => {
    const map = new Map();
    (requests || []).filter((r) => r.status === "approved").forEach((r) => {
      const key = r.user_id || r.user_name || "unknown";
      const cur = map.get(key) || { user_id: r.user_id, user_name: r.user_name || "—", count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(r.amount || 0);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [requests]);

  const buyersRevenue = useMemo(() => buyers.reduce((s, b) => s + b.total, 0), [buyers]);

  const load = async () => {
    try {
      const list = await base44.entities.BoostRequest.list("-created_date", 200);
      setRequests(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (r) => {
    setActing(r.id);
    try {
      const until = new Date(Date.now() + (r.hours || 0) * 3600000).toISOString();
      await base44.entities.Item.update(r.item_id, { featured: true, featured_until: until, featured_cross_country: !!r.cross_country });
      await base44.entities.BoostRequest.update(r.id, { status: "approved", reviewed_by: admin.id });
      try {
        await base44.entities.Notification.create({
          user_id: r.user_id,
          type: "boost_approved",
          item_id: r.item_id,
          item_title: r.item_title,
          text: ar ? "تم تفعيل تعزيز إعلانك ⭐" : "Your listing has been promoted ⭐",
        });
      } catch {}
      sendPush({ user_id: r.user_id, title: ar ? "كاشر" : "Kasir", content: ar ? "تمت الموافقة على تعزيز إعلانك ⭐" : "Your boost was approved ⭐", action_url: `/item/${r.item_id}` });
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)));
      toast({ title: ar ? "تم تفعيل التعزيز" : "Boost activated" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally { setActing(null); }
  };

  const reject = async (r) => {
    setActing(r.id);
    try {
      await base44.entities.BoostRequest.update(r.id, { status: "rejected", reviewed_by: admin.id });
      sendPush({ user_id: r.user_id, title: ar ? "كاشر" : "Kasir", content: ar ? "تم رفض طلب التعزيز" : "Your boost request was declined" });
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "rejected" } : x)));
      toast({ title: ar ? "تم الرفض" : "Rejected" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally { setActing(null); }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      {buyers.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
          <button onClick={() => setShowBuyers((v) => !v)} className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Users size={18} /></div>
              <div className="text-start">
                <p className="font-bold text-sm">{ar ? "مشترو التعزيز" : "Boost Buyers"}</p>
                <p className="text-xs text-muted-foreground">{buyers.length} {ar ? "بائع" : "sellers"} · {buyersRevenue.toLocaleString(ar ? "ar-SA" : "en-US")} {ar ? "ر.س" : "SAR"}</p>
              </div>
            </div>
            {showBuyers ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>
          {showBuyers && (
            <div className="divide-y divide-border/40 border-t border-border/40">
              {buyers.map((b) => (
                <div key={b.user_id || b.user_name} className="flex items-center justify-between p-3">
                  <button onClick={() => b.user_id && nav(`/user/${b.user_id}`)} className="font-semibold text-sm truncate hover:underline text-start">{b.user_name}</button>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-muted-foreground">{b.count} {ar ? "تعزيز" : "boosts"}</span>
                    <span className="font-bold">{b.total.toLocaleString(ar ? "ar-SA" : "en-US")} {ar ? "ر.س" : "SAR"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {requests.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <TrendingUp size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد طلبات تعزيز" : "No boost requests"}</p>
        </div>
      ) : requests.map((r) => (
        <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-3.5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">{r.item_title || "—"}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS[r.status]?.color}`}>{STATUS[r.status]?.[ar ? "ar" : "en"]}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.user_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{ar ? "المدة" : "Duration"}: {r.hours}{ar ? "س" : "h"}{r.cross_country ? ` · ${ar ? "كل الدول" : "All countries"}` : ""}</p>
              <p className="text-xs text-muted-foreground">{ar ? "المبلغ" : "Amount"}: {Number(r.amount || 0).toLocaleString(ar ? "ar-SA" : "en-US")} {ar ? "ر.س" : "SAR"}</p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(r.created_date, lang)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {r.item_id && <button onClick={() => nav(`/item/${r.item_id}`)} className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"><ExternalLink size={12} /> {ar ? "عرض الإعلان" : "View item"}</button>}
            {r.receipt_url && <a href={r.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"><ExternalLink size={12} /> {ar ? "عرض الإيصال" : "View receipt"}</a>}
          </div>
          {r.status === "pending" && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40">
              <button onClick={() => approve(r)} disabled={acting === r.id} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"><CheckCircle2 size={13} /> {ar ? "تفعيل" : "Approve"}</button>
              <button onClick={() => reject(r)} disabled={acting === r.id} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"><X size={13} /> {ar ? "رفض" : "Reject"}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}