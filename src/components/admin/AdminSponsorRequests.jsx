import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Rocket, Check, X, Loader2, ExternalLink, Clock, BadgeCheck, Globe, Trash2, User as UserIcon, Tag, CalendarClock, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { COUNTRIES } from "@/lib/countries";
import Price from "@/components/Price";
import { timeAgo } from "@/lib/format";

// Admin review board for SponsorRequests, gated by country selection.
// Pending → approve (creates the user's payment invoice) / reject (with optional reason).
// Paid/active → show expiry + de-sponsor action. Approved → invoice link.
export default function AdminSponsorRequests() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [country, setCountry] = useState("");
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!country) { setRequests([]); setItems({}); return; }
    setLoading(true);
    try {
      // Fetch sponsor requests + the items for the selected country in parallel,
      // then join by item_id so each row has the listing's image, seller, and
      // admin_sponsored_until (expiry) without an N+1 fetch per request.
      const [reqs, countryItems] = await Promise.all([
        base44.entities.SponsorRequest.filter({}, "-created_date", 500),
        base44.entities.Item.filter({ country }, "-created_date", 500),
      ]);
      const itemMap = {};
      (countryItems || []).forEach((it) => { itemMap[it.id] = it; });
      const itemIds = new Set(Object.keys(itemMap));
      const filtered = (reqs || []).filter((r) => itemIds.has(r.item_id));
      setRequests(filtered);
      setItems(itemMap);
    } catch {
      setRequests([]); setItems({});
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    load();
    const unsub = base44.entities.SponsorRequest.subscribe(() => load());
    return () => unsub?.();
  }, [load]);

  const review = async (requestId, action, reason = "") => {
    setBusy(requestId + ":" + action);
    try {
      const res = await base44.functions.invoke("reviewSponsorRequest", { request_id: requestId, action, reject_reason: reason });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({ title: action === "approve" ? (ar ? "تمت الموافقة — أُرسل إشعار الدفع للمستخدم" : "Approved — payment notification sent") : (ar ? "تم رفض الطلب" : "Request rejected") });
      setRejectId(""); setRejectReason("");
      await load();
    } catch (e) {
      toast({ title: ar ? "فشلت المراجعة" : "Review failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const desponsor = async (r) => {
    if (!window.confirm(ar ? "إلغاء رعاية هذا الإعلان؟" : "De-sponsor this listing?")) return;
    setBusy(r.id + ":desponsor");
    try {
      await base44.entities.Item.update(r.item_id, { admin_sponsored: false, admin_sponsored_until: null });
      toast({ title: ar ? "تم إلغاء الرعاية" : "De-sponsored" });
      await load();
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const paid = requests.filter((r) => r.status === "paid");
  const rejected = requests.filter((r) => r.status === "rejected");

  const Row = ({ r }) => {
    const item = items[r.item_id];
    const expiry = item?.admin_sponsored_until;
    const isLive = item?.admin_sponsored && expiry && new Date(expiry).getTime() > Date.now();
    return (
      <div className="rounded-2xl bg-card border border-border/60 p-3 flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <button onClick={() => nav(`/item/${r.item_id}`)} className="w-14 h-14 rounded-xl overflow-hidden bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
            {item?.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <Rocket size={22} className="text-violet-500" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => nav(`/item/${r.item_id}`)} className="font-semibold text-sm truncate hover:underline text-start">{r.item_title || "—"}</button>
              <StatusBadge status={r.status} ar={ar} />
            </div>
            <button onClick={() => item?.seller_id && nav(`/user/${item.seller_id}`)} className="text-xs text-muted-foreground truncate hover:underline flex items-center gap-1">
              <UserIcon size={11} /> {r.user_name || "—"}
            </button>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-semibold text-foreground"><Price value={r.amount} lang={lang} country="SA" /></span>
              <span>· {r.weeks} {ar ? "أسبوع" : r.weeks === 1 ? "wk" : "wks"}</span>
              <span>· <Clock size={10} className="inline -mt-0.5" /> {timeAgo(r.created_date, lang)}</span>
              {r.reviewed_at && <span>· {ar ? "رُوجع" : "reviewed"} {timeAgo(r.reviewed_at, lang)}</span>}
            </div>
          </div>
        </div>

        {/* Expiry for live sponsorships */}
        {r.status === "paid" && expiry && (
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isLive ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
            <CalendarClock size={13} className="shrink-0" />
            <span>
              {isLive
                ? (ar ? `مُفعّلة حتى ${new Date(expiry).toLocaleString(ar ? "ar-SA" : "en-US")}` : `Active until ${new Date(expiry).toLocaleString()}`)
                : (ar ? "انتهت مدة الرعاية" : "Sponsorship expired")}
            </span>
          </div>
        )}

        {/* Quick links */}
        <div className="flex items-center gap-3 text-xs">
          <button onClick={() => nav(`/item/${r.item_id}`)} className="text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1 hover:underline">
            <Tag size={11} /> {ar ? "الإعلان" : "Listing"}
          </button>
          {item?.seller_id && (
            <button onClick={() => nav(`/user/${item.seller_id}`)} className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline">
              <UserIcon size={11} /> {ar ? "البائع" : "Seller"}
            </button>
          )}
          {r.invoice_url && (r.status === "approved" || r.status === "paid") && (
            <a href={r.invoice_url} target="_blank" rel="noreferrer" className="text-foreground/70 font-semibold flex items-center gap-1 hover:underline">
              <ExternalLink size={11} /> {ar ? "فاتورة" : "Invoice"}
            </a>
          )}
        </div>

        {/* Actions */}
        {r.status === "pending" && (
          <div className="flex gap-2">
            <button onClick={() => review(r.id, "approve")} disabled={!!busy} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
              {busy === r.id + ":approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {ar ? "موافقة" : "Approve"}
            </button>
            <button onClick={() => { setRejectId(rejectId === r.id ? "" : r.id); setRejectReason(""); }} className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-sm font-bold flex items-center gap-1.5">
              <X size={14} /> {ar ? "رفض" : "Reject"}
            </button>
          </div>
        )}
        {rejectId === r.id && (
          <div className="flex flex-col gap-2">
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={ar ? "سبب الرفض (اختياري)" : "Rejection reason (optional)"} className="w-full text-sm rounded-xl border border-border/60 p-2.5 min-h-[60px] bg-background" />
            <div className="flex gap-2">
              <button onClick={() => review(r.id, "reject", rejectReason)} disabled={!!busy} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">
                {busy === r.id + ":reject" ? <Loader2 size={14} className="animate-spin" /> : (ar ? "تأكيد الرفض" : "Confirm reject")}
              </button>
              <button onClick={() => setRejectId("")} className="px-3 py-2 rounded-xl bg-muted text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        )}
        {r.status === "paid" && isLive && (
          <button onClick={() => desponsor(r)} disabled={!!busy} className="py-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {busy === r.id + ":desponsor" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {ar ? "إلغاء الرعاية" : "De-sponsor"}
          </button>
        )}
        {r.status === "rejected" && r.reject_reason && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2">{r.reject_reason}</p>
        )}
      </div>
    );
  };

  const counts = useMemo(() => ({
    pending: pending.length, approved: approved.length, paid: paid.length, rejected: rejected.length,
  }), [requests]);

  return (
    <div className="space-y-4">
      {/* Country selector — required before any data loads */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex items-center gap-2 shrink-0">
          <Globe size={16} className="text-muted-foreground" />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-semibold min-w-[180px]"
          >
            <option value="">{ar ? "اختر دولة" : "Select country"}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {ar ? c.ar : c.en}</option>
            ))}
          </select>
        </div>
        {country && (
          <button onClick={load} disabled={loading} title={ar ? "تحديث" : "Refresh"} className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-sm font-semibold shrink-0 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {!country ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Globe size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">{ar ? "اختر دولة لعرض طلبات الرعاية" : "Select a country to view sponsorship requests"}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Rocket size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold">{ar ? "لا توجد طلبات رعاية" : "No sponsorship requests"}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            <Stat label={ar ? "بانتظار" : "Pending"} value={counts.pending} color="text-amber-600" />
            <Stat label={ar ? "موافق" : "Approved"} value={counts.approved} color="text-violet-600" />
            <Stat label={ar ? "مدفوع" : "Paid"} value={counts.paid} color="text-emerald-600" />
            <Stat label={ar ? "مرفوض" : "Rejected"} value={counts.rejected} color="text-rose-600" />
          </div>
          {counts.pending > 0 && <Section title={ar ? "بانتظار المراجعة" : "Awaiting review"} items={pending} Row={Row} />}
          {counts.approved > 0 && <Section title={ar ? "موافق عليها — بانتظار الدفع" : "Approved — awaiting payment"} items={approved} Row={Row} />}
          {counts.paid > 0 && <Section title={ar ? "مُفعّلة" : "Active"} items={paid} Row={Row} />}
          {counts.rejected > 0 && <Section title={ar ? "مرفوضة" : "Rejected"} items={rejected} Row={Row} />}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status, ar }) {
  const map = {
    pending: { icon: Clock, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", label: ar ? "بانتظار" : "Pending" },
    approved: { icon: Rocket, cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300", label: ar ? "موافق" : "Approved" },
    paid: { icon: BadgeCheck, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", label: ar ? "مدفوع" : "Paid" },
    rejected: { icon: X, cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", label: ar ? "مرفوض" : "Rejected" },
  };
  const m = map[status] || map.pending;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.cls}`}><m.icon size={10} /> {m.label}</span>;
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3 text-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground font-semibold">{label}</p>
    </div>
  );
}

function Section({ title, items, Row }) {
  return (
    <div>
      <p className="text-sm font-bold mb-2 text-muted-foreground">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((r) => <Row key={r.id} r={r} />)}
      </div>
    </div>
  );
}