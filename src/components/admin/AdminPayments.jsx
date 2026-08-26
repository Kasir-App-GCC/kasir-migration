import React, { useEffect, useMemo, useState } from "react";
import { Wallet, RefreshCw, TrendingUp, ShieldCheck, Heart, Link2, ExternalLink, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";
import { VERIFICATION_FEE } from "@/lib/verificationPayment";

const TYPE_META = {
  boost: { ar: "تعزيز", en: "Boost", icon: TrendingUp, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  verification: { ar: "توثيق", en: "Verification", icon: ShieldCheck, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  donation: { ar: "دعم", en: "Donation", icon: Heart, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
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
        created_date: b.created_date, moyasar_payment_id: "",
      }));
    const verRows = (verifications || [])
      .filter((v) => v.status === "approved")
      .map((v) => ({
        id: "ver:" + v.id, type: "verification", amount: VERIFICATION_FEE,
        user_id: v.user_id, user_name: v.user_name || v.full_name || "", description: ar ? "رسوم توثيق الحساب" : "Account verification fee",
        created_date: v.created_date, moyasar_payment_id: (v.payment_receipt_url || "").replace("moyasar:", ""),
      }));
    const payRows = (payments || []).map((p) => ({
      id: "pay:" + p.id, type: p.type, amount: Number(p.amount) || 0,
      user_id: p.user_id, user_name: p.user_name || "", description: p.description || "",
      created_date: p.created_date, moyasar_payment_id: p.moyasar_payment_id,
    }));
    const all = [...payRows, ...boostRows, ...verRows].sort(
      (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)
    );
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.user_id && <button onClick={() => nav(`/user/${r.user_id}`)} className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-0.5"><ExternalLink size={10} /> {ar ? "الملف" : "Profile"}</button>}
                    {r.moyasar_payment_id && <span className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">{r.moyasar_payment_id.slice(0, 13)}…</span>}
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