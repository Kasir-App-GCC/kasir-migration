import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, ExternalLink, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

const STATUS = {
  pending: { en: "Awaiting payment", ar: "بانتظار الدفع", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  approved: { en: "Approved", ar: "موافق", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

export default function AdminBoosts() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBuyers, setShowBuyers] = useState(false);
  const [buyerNames, setBuyerNames] = useState({});

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

  // Existing boost records were created with an empty user_name (auth.me() has
  // no `name` field), so resolve each buyer's display name from their user_id.
  useEffect(() => {
    const ids = buyers.map((b) => b.user_id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getPublicProfiles", { user_ids: ids });
        if (!cancelled) setBuyerNames(res?.data?.results || {});
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [buyers]);

  const resolveBuyerName = (b) => {
    const p = b.user_id ? buyerNames[b.user_id] : null;
    if (p) return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || p.full_name || b.user_name || "—";
    return b.user_name || "—";
  };

  const load = async () => {
    try {
      const list = await base44.entities.BoostRequest.list("-created_date", 200);
      setRequests(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
                  <button onClick={() => b.user_id && nav(`/user/${b.user_id}`)} className="font-semibold text-sm truncate hover:underline text-start">{resolveBuyerName(b)}</button>
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
            <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">{ar ? "بانتظار إتمام الدفع" : "Awaiting payment"}</p>
          )}
        </div>
      ))}
    </div>
  );
}