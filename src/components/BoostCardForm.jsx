import React, { useState, useEffect, useRef } from "react";
import { X, CreditCard, Loader2, ShieldCheck, ExternalLink, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { getCountry, convertCurrency } from "@/lib/countries";
import CurrencySymbol from "@/components/CurrencySymbol";

// Module-level cache for the publishable key (safe to expose to the client).
let pkCache = null;
async function getPublishableKey() {
  if (pkCache) return pkCache;
  try {
    const res = await base44.functions.invoke("getMoyasarPublishableKey", {});
    pkCache = res?.data?.publishable_key || "";
  } catch {
    pkCache = "";
  }
  return pkCache;
}

function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export default function BoostCardForm({ open, itemId, hours, amount, onSuccess, onClose }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("form"); // form | 3ds | done
  const [transactionUrl, setTransactionUrl] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    if (open) getPublishableKey();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  if (!open) return null;

  const cur = getCountry(country || "SA");
  const displayAmount = convertCurrency(amount || 0, "SA", country || "SA");
  const fmt = (n) => Number(n).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 });

  const formatCard = (v) => normalizeDigits(v).replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  const startPolling = (paymentId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("chargeBoostInApp", { payment_id: paymentId });
        const r = res?.data || {};
        if (r.status === "paid") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setStage("done");
          toast({ title: ar ? "تم تفعيل التعزيز ⭐" : "Boost activated ⭐" });
          setTimeout(() => onSuccess(), 700);
        } else if (r.status === "failed") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setError(r.error || (ar ? "فشل التحقق" : "Verification failed"));
          setStage("form");
        }
      } catch {}
      if (attempts > 30) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    }, 3000);
  };

  const submit = async () => {
    setError("");
    const num = normalizeDigits(number).replace(/\D/g, "");
    const mm = normalizeDigits(month).replace(/\D/g, "");
    const yy = normalizeDigits(year).replace(/\D/g, "");
    const cv = normalizeDigits(cvc).replace(/\D/g, "");
    if (num.length < 13) return setError(ar ? "رقم البطاقة غير صحيح" : "Invalid card number");
    if (!name.trim()) return setError(ar ? "أدخل اسم حامل البطاقة" : "Enter cardholder name");
    if (!mm || Number(mm) < 1 || Number(mm) > 12) return setError(ar ? "شهر غير صحيح" : "Invalid month");
    if (yy.length < 4) return setError(ar ? "سنة غير صحيحة" : "Invalid year");
    if (cv.length < 3) return setError(ar ? "CVC غير صحيح" : "Invalid CVC");

    setLoading(true);
    try {
      const pk = await getPublishableKey();
      if (!pk) {
        setError(ar ? "مفتاح الدفع غير مُعد" : "Payment key not configured");
        setLoading(false);
        return;
      }
      // Tokenize the card directly with Moyasar — card data never touches our server.
      const tokRes = await fetch("https://api.moyasar.com/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishable_api_key: pk,
          save_only: true,
          name: name.trim(),
          number: num,
          month: Number(mm),
          year: Number(yy),
          cvc: Number(cv),
        }),
      });
      const tokData = await tokRes.json();
      const token = tokData.token || tokData.id;
      if (!token) {
        setError(tokData?.message || (ar ? "تعذّر حفظ البطاقة" : "Couldn't save card"));
        setLoading(false);
        return;
      }

      const res = await base44.functions.invoke("chargeBoostInApp", {
        item_id: itemId,
        hours,
        token,
        origin: window.location.origin,
      });
      const r = res?.data || {};
      if (r.status === "paid") {
        setStage("done");
        toast({ title: ar ? "تم تفعيل التعزيز ⭐" : "Boost activated ⭐" });
        setTimeout(() => onSuccess(), 700);
      } else if (r.status === "initiated") {
        setStage("3ds");
        setTransactionUrl(r.transaction_url);
        if (r.transaction_url) window.open(r.transaction_url, "_blank");
        startPolling(r.payment_id);
      } else {
        setError(r.error || (ar ? "فشل الدفع" : "Payment failed"));
      }
    } catch (e) {
      setError(ar ? "تعذّر إتمام الدفع" : "Payment couldn't be completed");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-amber-500" /> {ar ? "دفع التعزيز" : "Boost payment"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 mb-4">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {ar ? `${hours} ساعة تعزيز` : `${hours}h boost`}
          </span>
          <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
            {fmt(displayAmount)} {ar ? cur.currencyAr : cur.currency}
          </span>
        </div>

        {stage === "done" ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} className="text-emerald-600" />
            </div>
            <p className="font-bold">{ar ? "تم الدفع وتفعيل التعزيز" : "Paid — boost is live"}</p>
          </div>
        ) : stage === "3ds" ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center mx-auto">
              <Lock size={26} className="text-sky-600" />
            </div>
            <p className="font-bold">{ar ? "تحقق من البطاقة (3DS)" : "Card verification (3DS)"}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar
                ? "فتحنا صفحة التحقق من البنك. أكملها ثم عُد هنا — سنفعّل التعزيز تلقائياً."
                : "We opened your bank's verification page. Complete it and come back — we'll activate the boost automatically."}
            </p>
            <a href={transactionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              <ExternalLink size={15} /> {ar ? "فتح صفحة التحقق" : "Open verification"}
            </a>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 size={13} className="animate-spin" /> {ar ? "في انتظار التأكيد…" : "Waiting for confirmation…"}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "رقم البطاقة" : "Card number"}</label>
              <input
                value={number}
                onChange={(e) => setNumber(formatCard(e.target.value))}
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                dir="ltr"
                className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">{ar ? "اسم حامل البطاقة" : "Cardholder name"}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="NAME ON CARD"
                className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">{ar ? "شهر" : "Month"}</label>
                <input
                  value={month}
                  onChange={(e) => setMonth(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 2))}
                  inputMode="numeric"
                  placeholder="MM"
                  dir="ltr"
                  className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">{ar ? "سنة" : "Year"}</label>
                <input
                  value={year}
                  onChange={(e) => setYear(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="YYYY"
                  dir="ltr"
                  className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">CVC</label>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="123"
                  dir="ltr"
                  className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono"
                />
              </div>
            </div>
            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {ar ? "جارٍ الدفع…" : "Paying…"}
                </>
              ) : (
                <>
                  <CreditCard size={16} /> {ar ? `ادفع ${fmt(displayAmount)} ${cur.currencyAr}` : `Pay ${fmt(displayAmount)} ${cur.currency}`}
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Lock size={11} /> {ar ? "بيانات البطاقة تُرسل مباشرة لـ Moyasar" : "Card details go directly to Moyasar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}