import React, { useEffect, useMemo, useState } from "react";
import { Wallet, RefreshCw, TrendingUp, ShieldCheck, Heart, Link2, ExternalLink, Search, Trash2, Copy, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";
import { getPaymentsMode, setPaymentsMode } from "@/lib/appSettings";

const TYPE_META = {
  boost: { ar: "تعزيز", en: "Boost", icon: TrendingUp, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  verification: { ar: "توثيق", en: "Verification", icon: ShieldCheck, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  donation: { ar: "دعم", en: "Support", icon: Heart, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  payment_link: { ar: "رابط دفع", en: "Payment Link", icon: Link2, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
};

const fmt = (n, ar) => Number(n || 0).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 });

export default function AdminPayments() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [boostSyncing, setBoostSyncing] = useState(false);
  const [mode, setMode] = useState("redirect");
  const [modeLoading, setModeLoading] = useState(false);

  const copyId = (id) => {
    if (!id) return;
    try { navigator.clipboard?.writeText(id); toast({ title: ar ? "تم نسخ المعرّف" : "ID copied" }); } catch {}
  };

  const build = async () => {
    const [payments, boosts, verifications] = await Promise.all([
      base44.entities.Payment.list("-created_date", 500).catch(() => []),
      base44.entities.BoostRequest.list("-created_date", 500).catch(() => []),
      base44.entities.VerificationRequest.list("-created_date", 500).catch(() => []),
    ]);
    const boostRows = (boosts || [])
      .filter((b) => b.status === "approved" && !b.is_free)
      .map((b) => ({
        id: "boost:" + b.id, type: "boost", amount: Number(b.amount) || 0,
        user_id: b.user_id, user_name: b.user_name || "", description: b.item_title || "",
        created_date: b.created_date,
        moyasar_payment_id: (b.receipt_url || "").startsWith("moyasar:") ? b.receipt_url.slice("moyasar:".length) : "",
        moyasar_invoice_id: "",
      }));
    const verRows = (verifications || [])
      .filter((v) => v.status === "approved")
      .map((v) => ({
        id: "ver:" + v.id, type: "verification", amount: VERIFICATION_FEE,
        user_id: v.user_id, user_name: v.user_name || v.full_name || "", description: ar ? "رسوم توثيق الحساب" : "Account verification fee",
        created_date: v.created_date,
        moyasar_payment_id: (v.payment_receipt_url || "").startsWith("moyasar:") ? v.payment_receipt_url.slice("moyasar:".length) : "",
        moyasar_invoice_id: "",
      }));
    const payRows = (payments || []).map((p) => ({
      id: "pay:" + p.id, type: p.type, amount: Number(p.amount) || 0,
      user_id: p.user_id, user_name: p.user_name || "", description: p.description || "",
      created_date: p.created_date, moyasar_payment_id: p.moyasar_payment_id,
      moyasar_invoice_id: p.moyasar_invoice_id,
    }));
    let all = [...payRows, ...boostRows, ...verRows].sort(
      (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)
    );
    // Resolve real display names for rows that have a user_id but no stored
    // name (older boost/verification records were created before names were
    // captured). The Moyasar metadata only stores user_id, never PII.
    const idsToResolve = Array.from(new Set(all.filter((r) => r.user_id && !r.user_name).map((r) => r.user_id)));
    if (idsToResolve.length) {
      try {
        const res = await base44.functions.invoke("getPublicProfiles", { user_ids: idsToResolve });
        const map = res?.data?.results || {};
        all = all.map((r) => {
          if (!r.user_id || r.user_name) return r;
          const p = map[r.user_id];
          if (!p) return r;
          const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || p.full_name || "";
          return { ...r, user_name: name || r.user_name };
        });
      } catch {}
    }
    setRows(all);
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncMoyasarPayments", {});
      await build();
      toast({
        title: ar ? "تمت المزامنة" : "Synced",
        description: ar ? `${res?.data?.new || 0} دفعة جديدة من ${res?.data?.scanned || 0}` : `${res?.data?.new || 0} new of ${res?.data?.scanned || 0} scanned`,
      });
    } catch (e) {
      toast({ title: ar ? "فشلت المزامنة" : "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Reconcile paid Moyasar boost invoices directly via the API — activates any
  // pending boosts even when the webhook/redirect couldn't fire (e.g. preview
  // environment). Idempotent, so it's safe to run repeatedly.
  const syncBoosts = async () => {
    setBoostSyncing(true);
    try {
      const res = await base44.functions.invoke("syncBoostPayments", {});
      await build();
      toast({
        title: ar ? "تمت مزامنة التعزيزات" : "Boosts reconciled",
        description: ar
          ? `${res?.data?.activated || 0} تعزيز مُفعّل · ${res?.data?.already || 0} مُفعّل سابقاً (من ${res?.data?.boostFound || 0})`
          : `${res?.data?.activated || 0} activated · ${res?.data?.already || 0} already live (of ${res?.data?.boostFound || 0} boosts)`,
      });
    } catch (e) {
      toast({ title: ar ? "فشلت مزامنة التعزيزات" : "Boost sync failed", variant: "destructive" });
    } finally {
      setBoostSyncing(false);
    }
  };

  // Delete every record that feeds the "Total Payments Received" figure:
  // all Payment ledger rows, approved paid boosts, and approved verifications.
  // Pending boosts/verifications and free-boost records are preserved.
  const clearAll = async () => {
    setClearing(true);
    try {
      await Promise.all([
        base44.entities.Payment.deleteMany({}),
        base44.entities.BoostRequest.deleteMany({ status: "approved", is_free: { $ne: true } }),
        base44.entities.VerificationRequest.deleteMany({ status: "approved" }),
      ]);
      await build();
      toast({ title: ar ? "تم حذف جميع المعاملات" : "All transactions cleared" });
    } catch (e) {
      toast({ title: ar ? "فشل الحذف" : "Failed to clear", variant: "destructive" });
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { await sync(); } catch {}
      finally { setLoading(false); }
      try { setMode(await getPaymentsMode()); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMode = async () => {
    const next = mode === "inapp" ? "redirect" : "inapp";
    setModeLoading(true);
    try {
      await setPaymentsMode(next);
      setMode(next);
      toast({ title: next === "inapp" ? (ar ? "الدفع داخل التطبيق مُفعّل" : "In-app payments enabled") : (ar ? "التحويل لـ Moyasar مُفعّل" : "Moyasar redirect enabled") });
    } catch {
      toast({ title: ar ? "تعذّر التحديث" : "Couldn't update", variant: "destructive" });
    } finally {
      setModeLoading(false);
    }
  };

  const totals = useMemo(() => {
    const byType = {};
    for (const r of rows) byType[r.type] = (byType[r.type] || 0) + (r.amount || 0);
    const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
    return { total, byType };
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.type !== filter) return false;
      if (!ql) return true;
      return (r.user_name || "").toLowerCase().includes(ql) || (r.description || "").toLowerCase().includes(ql) || (r.moyasar_payment_id || "").toLowerCase().includes(ql);
    });
  }, [rows, filter, q]);

  const filterChips = ["all", "boost", "verification", "donation", "payment_link"];

  if (loading) return <div className="py-10 text-center text-muted-foreground"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {/* Total revenue */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Wallet size={20} /></div>
            <div>
              <p className="text-xs opacity-90 font-semibold">{ar ? "إجمالي المدفوعات المُستلمة" : "Total Payments Received"}</p>
              <p className="text-2xl font-extrabold">{fmt(totals.total, ar)} {ar ? "ر.س" : "SAR"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sync} disabled={syncing} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 transition">
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> {ar ? "مزامنة" : "Sync"}
            </button>
            <button onClick={syncBoosts} disabled={boostSyncing} title={ar ? "تفعيل التعزيزات المدفوعة عبر Moyasar" : "Activate paid boosts via Moyasar API"} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 transition">
              <RefreshCw size={15} className={boostSyncing ? "animate-spin" : ""} /> {ar ? "تعزيزات" : "Boosts"}
            </button>
            {confirmClear ? (
              <>
                <button onClick={clearAll} disabled={clearing} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 transition">
                  {clearing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={15} />} {ar ? "تأكيد الحذف" : "Confirm clear"}
                </button>
                <button onClick={() => setConfirmClear(false)} disabled={clearing} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold transition">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-sm font-bold flex items-center gap-1.5 transition">
                <Trash2 size={15} /> {ar ? "حذف الكل" : "Clear all"}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {["boost", "verification", "donation", "payment_link"].map((t) => {
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

      {/* In-app payments toggle */}
      <div className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <CreditCard size={17} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold">{ar ? "الدفع داخل التطبيق" : "In-app payments"}</p>
            <p className="text-[11px] text-muted-foreground">{ar ? "البطاقة داخل التطبيق بدل التحويل لصفحة Moyasar" : "Card form in-app instead of redirecting to Moyasar"}</p>
          </div>
        </div>
        <button onClick={toggleMode} disabled={modeLoading} className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${mode === "inapp" ? "bg-emerald-500" : "bg-muted-foreground/30"}`}>
          <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${mode === "inapp" ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-2xl">
          {filterChips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filter === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {c === "all" ? (ar ? "الكل" : "All") : (ar ? TYPE_META[c].ar : TYPE_META[c].en)}
              <span className="ms-1 opacity-70">{c === "all" ? rows.length : (rows.filter((r) => r.type === c).length)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted flex-1 min-w-[180px]">
          <Search size={14} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "بحث بالاسم أو الوصف..." : "Search name or description..."} className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      {/* Ledger */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Wallet size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد مدفوعات" : "No payments"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const m = TYPE_META[r.type] || TYPE_META.payment_link;
            const Icon = m.icon;
            return (
              <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}><Icon size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm truncate">{r.user_name || (ar ? "غير معروف" : "Unknown")}</span>
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
        </div>
      )}
    </div>
  );
}