import React, { useState, useEffect, useRef } from "react";
import { CreditCard, Loader2, CheckCircle2, XCircle, Lock, ExternalLink, Apple } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

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

// Official Moyasar test cards (test mode — no real charge). The Visa/Mada
// "success" cards are non-3DS, so a tokenized charge returns "paid" instantly.
const TEST_CARDS = [
  { id: "visa_ok", label: "Visa ✓", number: "4111111111111111", hint: "paid · no 3DS" },
  { id: "mada_ok", label: "Mada ✓", number: "4201320111111010", hint: "paid · no 3DS" },
  { id: "declined", label: "Declined", number: "4123120000000000", hint: "failed" },
];

export default function AdminPaymentTest() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [amount, setAmount] = useState("1.00");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("idle"); // idle | 3ds | done
  const [result, setResult] = useState(null);
  const [transactionUrl, setTransactionUrl] = useState("");
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [applePaying, setApplePaying] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    getPublishableKey();
    setApplePayAvailable(typeof window !== "undefined" && !!window.ApplePaySession && window.ApplePaySession.canMakePayments());
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const formatCard = (v) => normalizeDigits(v).replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  const fillTestCard = (c) => {
    setNumber(formatCard(c.number));
    setName("Test Admin");
    setMonth("03");
    setYear("30");
    setCvc("111");
    setError("");
  };

  const startPolling = (paymentId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("testMoyasarPayment", { action: "status", payment_id: paymentId });
        const r = res?.data || {};
        if (r.status === "paid") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setStage("done");
          setResult({ ok: true, status: "paid", payment_id: paymentId, method: "card" });
          toast({ title: ar ? "تم الدفع بنجاح ✓" : "Payment succeeded ✓" });
        } else if (r.status === "failed") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setStage("idle");
          setError(r.source?.message || (ar ? "فشل التحقق" : "Verification failed"));
        }
      } catch {}
      if (attempts > 40) { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
    }, 3000);
  };

  const chargeWithToken = async (sourceType, token) => {
    const res = await base44.functions.invoke("testMoyasarPayment", {
      action: "charge",
      source_type: sourceType,
      token,
      amount: parseFloat(amount),
      origin: window.location.origin,
    });
    return res?.data || {};
  };

  const submit = async () => {
    setError("");
    setResult(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError(ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
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
      if (!pk) { setError(ar ? "مفتاح الدفع غير مُعد" : "Payment key not configured"); setLoading(false); return; }
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
      if (!token) { setError(tokData?.message || (ar ? "تعذّر حفظ البطاقة" : "Couldn't save card")); setLoading(false); return; }

      const r = await chargeWithToken("token", token);
      if (r.status === "paid") {
        setStage("done");
        setResult({ ok: true, status: "paid", payment_id: r.payment_id, method: "card" });
        toast({ title: ar ? "تم الدفع بنجاح ✓" : "Payment succeeded ✓" });
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

  const onApplePay = async () => {
    setError("");
    setResult(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError(ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount"); return; }
    if (!applePayAvailable) {
      setError(ar ? "Apple Pay يتطلب Safari ونطاقاً موثّقاً" : "Apple Pay requires Safari & a verified domain");
      return;
    }
    setApplePaying(true);
    try {
      const pk = await getPublishableKey();
      if (!pk) { setError(ar ? "مفتاح الدفع غير مُعد" : "Payment key not configured"); setApplePaying(false); return; }
      const request = {
        countryCode: "SA",
        currencyCode: "SAR",
        supportedNetworks: ["mada", "visa", "masterCard"],
        merchantCapabilities: ["supports3DS", "supportsDebit", "supportsCredit"],
        total: { label: "Kasir Test", amount: amt.toFixed(2) },
      };
      const session = new window.ApplePaySession(5, request);
      session.onvalidatemerchant = async (event) => {
        try {
          const r = await fetch("https://api.moyasar.com/v1/applepay/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              validation_url: event.validationURL,
              display_name: "Kasir",
              domain_name: window.location.hostname,
              publishable_api_key: pk,
            }),
          });
          const sessionObj = await r.json();
          session.completeMerchantValidation(sessionObj);
        } catch (e) {
          session.completeMerchantValidation(e);
        }
      };
      session.onpaymentauthorized = async (event) => {
        try {
          const r = await chargeWithToken("applepay", event.payment.token);
          if (r.status === "paid") {
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
            setStage("done");
            setResult({ ok: true, status: "paid", payment_id: r.payment_id, method: "applepay" });
            toast({ title: ar ? "تم الدفع عبر Apple Pay ✓" : "Apple Pay succeeded ✓" });
          } else {
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            setError(r.error || r.status || (ar ? "فشل Apple Pay" : "Apple Pay failed"));
          }
        } catch (e) {
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          setError(e.message || (ar ? "فشل Apple Pay" : "Apple Pay failed"));
        }
      };
      session.oncancel = () => {};
      session.begin();
    } catch (e) {
      setError(e.message || (ar ? "تعذّر تشغيل Apple Pay" : "Couldn't start Apple Pay"));
    }
    setApplePaying(false);
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
        {ar
          ? "تجربة بوابة الدفع Moyasar في وضع الاختبار. أدخل بيانات البطاقة (أو استخدم بطاقة اختبار) لتظهر العملية كـ PAID في لوحة Moyasar."
          : "Test the Moyasar gateway in test mode. Enter card details (or use a test card) — a successful charge shows as PAID on the Moyasar dashboard."}
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
        <label className="text-sm font-semibold">{ar ? "المبلغ (ريال سعودي)" : "Amount (SAR)"}</label>
        <div className="relative">
          <CreditCard size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.00"
            dir="ltr"
            inputMode="decimal"
            className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm text-start"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold">{ar ? "بطاقات اختبار سريعة" : "Quick test cards"}</label>
          <div className="flex flex-wrap gap-2">
            {TEST_CARDS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => fillTestCard(c)}
                className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/70 text-xs font-semibold flex flex-col items-start"
              >
                <span>{c.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">{c.number}</span>
              </button>
            ))}
          </div>
        </div>

        {stage !== "done" && (
          <>
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
                <input value={month} onChange={(e) => setMonth(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 2))} inputMode="numeric" placeholder="MM" dir="ltr" className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">{ar ? "سنة" : "Year"}</label>
                <input value={year} onChange={(e) => setYear(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="YYYY" dir="ltr" className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">CVC</label>
                <input value={cvc} onChange={(e) => setCvc(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="123" dir="ltr" className="w-full px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm font-mono" />
              </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> {ar ? "جارٍ الدفع…" : "Paying…"}</>
              ) : (
                <><CreditCard size={16} /> {ar ? "ادفع بالبطاقة" : "Pay with card"}</>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-border/60 flex-1" />
              <span className="text-[11px] text-muted-foreground font-semibold">{ar ? "أو" : "or"}</span>
              <div className="h-px bg-border/60 flex-1" />
            </div>

            <button
              onClick={onApplePay}
              disabled={!applePayAvailable || applePaying}
              title={applePayAvailable ? "" : (ar ? "يتطلب Safari ونطاقاً موثّقاً لدى Moyasar" : "Requires Safari & a domain verified with Moyasar")}
              className={`w-full py-3.5 rounded-2xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition ${applePayAvailable ? "active:scale-[0.99]" : "opacity-50 cursor-not-allowed"}`}
            >
              {applePaying ? <Loader2 size={16} className="animate-spin" /> : <Apple size={16} />}
              {ar ? "ادفع بـ Apple Pay" : "Pay with Apple Pay"}
            </button>
            {!applePayAvailable && (
              <p className="text-[11px] text-muted-foreground text-center">{ar ? "Apple Pay غير متاح في هذا المتصفح/النطاق" : "Apple Pay not available on this browser/domain"}</p>
            )}

            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Lock size={11} /> {ar ? "بيانات البطاقة تُرسل مباشرة لـ Moyasar" : "Card details go directly to Moyasar"}
            </p>
          </>
        )}

        {stage === "3ds" && (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center mx-auto">
              <Lock size={26} className="text-sky-600" />
            </div>
            <p className="font-bold">{ar ? "تحقق من البطاقة (3DS)" : "Card verification (3DS)"}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar ? "فتحنا صفحة التحقق من البنك. أكملها وسنتحقق تلقائياً." : "We opened your bank's verification page. Complete it — we'll confirm automatically."}
            </p>
            <a href={transactionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              <ExternalLink size={15} /> {ar ? "فتح صفحة التحقق" : "Open verification"}
            </a>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 size={13} className="animate-spin" /> {ar ? "في انتظار التأكيد…" : "Waiting for confirmation…"}
            </div>
          </div>
        )}

        {stage === "done" && result?.ok && (
          <div className="rounded-2xl p-4 space-y-2 text-sm bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={18} /> {ar ? "تم الدفع — PAID" : "Payment succeeded — PAID"}
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div>{ar ? "الحالة" : "Status"}: <span className="font-bold">{result.status}</span></div>
              <div>{ar ? "المعرّف" : "ID"}: {result.payment_id}</div>
              <div>{ar ? "الطريقة" : "Method"}: {result.method}</div>
              <div>{ar ? "المبلغ" : "Amount"}: {amount} SAR</div>
              {result.payment_id && (
                <a href={`https://dashboard.moyasar.com/payments/${result.payment_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-1">
                  <ExternalLink size={11} /> {ar ? "فتح في لوحة Moyasar" : "Open in Moyasar dashboard"}
                </a>
              )}
            </div>
            <button onClick={() => { setStage("idle"); setResult(null); }} className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
              {ar ? "تجربة أخرى" : "Run another test"}
            </button>
          </div>
        )}

        {error && stage !== "3ds" && stage !== "done" && (
          <div className="rounded-2xl p-3 text-sm bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}