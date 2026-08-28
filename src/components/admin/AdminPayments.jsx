import React, { useEffect, useRef, useState, useCallback } from "react";
import { Wallet, TrendingUp, ShieldCheck, Heart, Link2, ExternalLink, Search, Copy, Loader2, Rocket, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

const TYPE_META = {
  boost: { ar: "تعزيز", en: "Boost", icon: TrendingUp, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  verification: { ar: "توثيق", en: "Verification", icon: ShieldCheck, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  sponsor: { ar: "رعاية", en: "Sponsorship", icon: Rocket, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  donation: { ar: "دعم", en: "Support", icon: Heart, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  payment_link: { ar: "رابط دفع", en: "Payment Link", icon: Link2, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  broker_fee: { ar: "وسيط عقاري", en: "Broker Fee", icon: Building2, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
};

const TYPE_KEYS = ["boost", "verification", "sponsor", "donation", "payment_link", "broker_fee"];
const EMPTY_COUNTS = { all: 0, ...Object.fromEntries(TYPE_KEYS.map((k) => [k, 0])) };
const EMPTY_TOTALS = { total: 0, byType: Object.fromEntries(TYPE_KEYS.map((k) => [k, 0])) };
const fmt = (n, ar) => Number(n || 0).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 });

export default function AdminPayments() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [countsTruncated, setCountsTruncated] = useState(false);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const reqId = useRef(0);

  const copyId = (id) => {
    if (!id) return;
    try { navigator.clipboard?.writeText(id); toast({ title: ar ? "تم نسخ المعرّف" : "ID copied" }); } catch {}
  };

  const fetchPage = useCallback(async (p, reset) => {
    const id = ++reqId.current;
    if (reset) { setLoading(true); setPage(1); }
    else setLoadingMore(true);
    try {
      const res = await base44.functions.invoke("searchPayments", { q, type: filter, page: reset ? 1 : p, limit: 50 });
      if (id !== reqId.current) return;
      const d = res?.data || res || {};
      setRows((prev) => reset ? (d.rows || []) : [...prev, ...(d.rows || [])]);
      setCounts(d.counts || EMPTY_COUNTS);
      setCountsTruncated(!!d.counts_truncated);
      setTotals(d.totals || EMPTY_TOTALS);
      setHasMore(!!d.has_more);
      setPage(reset ? 1 : p);
    } catch {}
    if (reset) setLoading(false); else setLoadingMore(false);
  }, [q, filter]);

  // Initial: sync Moyasar ledger then load page 1.
  useEffect(() => {
    (async () => {
      try { await base44.functions.invoke("syncMoyasarPayments", {}); } catch {}
      fetchPage(1, true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search / filter change → fresh page 1.
  useEffect(() => {
    const t = setTimeout(() => fetchPage(1, true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  const filterChips = ["all", ...TYPE_KEYS];
  const fmtCount = (n) => countsTruncated && n > 0 ? `${n}+` : `${n}`;

  if (loading) return <div className="py-10 text-center text-muted-foreground"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Wallet size={20} /></div>
          <div className="flex-1">
            <p className="text-xs opacity-90 font-semibold">{ar ? "إجمالي المدفوعات (أحدث السجلات)" : "Total Payments (recent records)"}</p>
            <p className="text-2xl font-extrabold">{fmt(totals.total, ar)} {ar ? "ر.س" : "SAR"}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
          {TYPE_KEYS.map((t) => {
            const m = TYPE_META[t];
            const Icon = m.icon;
            return (
              <div key={t} className="rounded-xl bg-white/10 p-2.5">
                <div className="flex items-center gap-1 mb-0.5"><Icon size={13} /><span className="text-[11px] font-bold opacity-90">{ar ? m.ar : m.en}</span></div>
                <p className="text-sm font-extrabold">{fmt(totals.byType[t] || 0, ar)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-2xl">
          {filterChips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filter === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {c === "all" ? (ar ? "الكل" : "All") : (ar ? TYPE_META[c].ar : TYPE_META[c].en)}
              <span className="ms-1 opacity-70">{fmtCount(c === "all" ? counts.all : (counts[c] || 0))}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted flex-1 min-w-[180px]">
          <Search size={14} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "بحث بالاسم أو الوصف أو معرّف الدفع..." : "Search name, description, or payment ID..."} className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Wallet size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد مدفوعات" : "No payments"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const m = TYPE_META[r.type] || TYPE_META.payment_link;
            const Icon = m.icon;
            return (
              <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}><Icon size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm truncate">{r.user_name || (ar ? "زائر" : "Guest")}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.color}`}>{ar ? m.ar : m.en}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.description || "—"}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    {r.user_id && <button onClick={() => nav(`/user/${r.user_id}`)} className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-0.5"><ExternalLink size={10} /> {ar ? "الملف" : "Profile"}</button>}
                    {r.moyasar_payment_id && (
                      <button onClick={() => copyId(r.moyasar_payment_id)} className="text-[10px] text-muted-foreground font-mono inline-flex items-center gap-1 hover:text-foreground transition" dir="ltr" title={ar ? "نسخ معرّف الدفع" : "Copy payment ID"}>
                        <Copy size={10} /> {r.moyasar_payment_id}
                      </button>
                    )}
                    {r.moyasar_payment_id && (
                      <a href={`https://dashboard.moyasar.com/payments/${r.moyasar_payment_id}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5" title={ar ? "فتح في Moyasar للاسترداد" : "Open in Moyasar to refund"}>
                        <ExternalLink size={10} /> {ar ? "Moyasar" : "Moyasar"}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="font-extrabold text-sm">{fmt(r.amount, ar)} <span className="text-[11px] text-muted-foreground">{ar ? "ر.س" : "SAR"}</span></p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(r.created_date, lang)}</p>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={() => fetchPage(page + 1, false)}
              disabled={loadingMore}
              className="w-full py-3 rounded-2xl bg-muted text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {loadingMore ? <><Loader2 size={15} className="animate-spin" /> {ar ? "جارٍ التحميل…" : "Loading…"}</> : (ar ? "تحميل المزيد" : "Load more")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}