import React, { useEffect, useState, useCallback } from "react";
import { Rocket, Check, X, Loader2, ExternalLink, Clock, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import Price from "@/components/Price";
import { timeAgo } from "@/lib/format";

// Admin review board for SponsorRequests. Pending → approve (creates the
// user's payment invoice) / reject (with optional reason). Approved requests
// show the invoice link; paid ones show the active sponsorship.
export default function AdminSponsorRequests() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SponsorRequest.filter({}, "-created_date", 200);
      setItems(list || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      setRejectId("");
      setRejectReason("");
      await load();
    } catch (e) {
      toast({ title: ar ? "فشلت المراجعة" : "Review failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const pending = items.filter((r) => r.status === "pending");
  const approved = items.filter((r) => r.status === "approved");
  const paid = items.filter((r) => r.status === "paid");
  const rejected = items.filter((r) => r.status === "rejected");

  const Row = ({ r }) => (
    <div className="rounded-2xl bg-card border border-border/60 p-3 flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
          <Rocket size={22} className="text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{r.item_title || "—"}</p>
            <StatusBadge status={r.status} ar={ar} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{r.user_name || "—"}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground"><Price value={r.amount} lang={lang} country="SA" /></span>
            <span>· {r.weeks} {ar ? "أسبوع" : r.weeks === 1 ? "wk" : "wks"}</span>
            <span>· <Clock size={10} className="inline -mt-0.5" /> {timeAgo(r.created_date, lang)}</span>
          </div>
        </div>
      </div>

      {r.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => review(r.id, "approve")}
            disabled={!!busy}
            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busy === r.id + ":approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {ar ? "موافقة" : "Approve"}
          </button>
          <button
            onClick={() => { setRejectId(rejectId === r.id ? "" : r.id); setRejectReason(""); }}
            className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-sm font-bold flex items-center gap-1.5"
          >
            <X size={14} /> {ar ? "رفض" : "Reject"}
          </button>
        </div>
      )}
      {rejectId === r.id && (
        <div className="flex flex-col gap-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={ar ? "سبب الرفض (اختياري)" : "Rejection reason (optional)"}
            className="w-full text-sm rounded-xl border border-border/60 p-2.5 min-h-[60px] bg-background"
          />
          <div className="flex gap-2">
            <button onClick={() => review(r.id, "reject", rejectReason)} disabled={!!busy} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">
              {busy === r.id + ":reject" ? <Loader2 size={14} className="animate-spin" /> : (ar ? "تأكيد الرفض" : "Confirm reject")}
            </button>
            <button onClick={() => setRejectId("")} className="px-3 py-2 rounded-xl bg-muted text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>
          </div>
        </div>
      )}
      {r.status === "approved" && r.invoice_url && (
        <a href={r.invoice_url} target="_blank" rel="noreferrer" className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
          <ExternalLink size={12} /> {ar ? "رابط دفع Moyasar" : "Moyasar invoice"}
        </a>
      )}
      {r.status === "rejected" && r.reject_reason && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2">{r.reject_reason}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Stat label={ar ? "بانتظار" : "Pending"} value={pending.length} color="text-amber-600" />
        <Stat label={ar ? "موافق" : "Approved"} value={approved.length} color="text-violet-600" />
        <Stat label={ar ? "مدفوع" : "Paid"} value={paid.length} color="text-emerald-600" />
        <Stat label={ar ? "مرفوض" : "Rejected"} value={rejected.length} color="text-rose-600" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Rocket size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold">{ar ? "لا توجد طلبات رعاية" : "No sponsorship requests"}</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && <Section title={ar ? "بانتظار المراجعة" : "Awaiting review"} items={pending} Row={Row} />}
          {approved.length > 0 && <Section title={ar ? "موافق عليها — بانتظار الدفع" : "Approved — awaiting payment"} items={approved} Row={Row} />}
          {paid.length > 0 && <Section title={ar ? "مُفعّلة" : "Active"} items={paid} Row={Row} />}
          {rejected.length > 0 && <Section title={ar ? "مرفوضة" : "Rejected"} items={rejected} Row={Row} />}
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