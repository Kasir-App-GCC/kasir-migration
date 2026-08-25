import React, { useState } from "react";
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPaymentTest() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [amount, setAmount] = useState("1.00");
  const [scenario, setScenario] = useState("success");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("testMoyasarPayment", { amount: amt, scenario, origin: window.location.origin });
      if (res?.data?.ok) {
        setResult(res.data);
        toast({ title: ar ? "تمت العملية" : "Payment processed", description: res.data.status });
      } else {
        throw new Error(res?.data?.error || "Payment failed");
      }
    } catch (e) {
      setResult({ ok: false, message: e.message });
      toast({ title: ar ? "فشل الدفع" : "Payment failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
        {ar
          ? "تجربة بوابة الدفع Moyasar في وضع الاختبار. لا يتم خصم أي مبلغ حقيقي. استخدم بطاقات الاختبار المدمجة."
          : "Test the Moyasar payment gateway in test mode. No real charge occurs. Built-in test cards are used."}
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

        <label className="text-sm font-semibold">{ar ? "سيناريو الاختبار" : "Test scenario"}</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "success", label: ar ? "ناجح" : "Success" },
            { id: "declined", label: ar ? "مرفوض" : "Declined" },
            { id: "invalid", label: ar ? "بطاقة غير صالحة" : "Invalid card" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition ${scenario === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          {ar ? "تشغيل اختبار الدفع" : "Run payment test"}
        </button>
      </div>

      {result && (
        <div className={`rounded-2xl p-4 space-y-2 text-sm ${result.ok ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"}`}>
          <div className="flex items-center gap-2 font-bold">
            {result.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.ok ? (ar ? "تمت العملية بنجاح" : "Operation successful") : result.message}
          </div>
          {result.ok && (
            <div className="space-y-1 text-xs font-mono">
              <div>{ar ? "الحالة" : "Status"}: {result.status}</div>
              <div>{ar ? "المعرف" : "ID"}: {result.paymentId}</div>
              <div>{ar ? "المتوقع" : "Expected"}: {result.expected}</div>
              <div>{ar ? "المبلغ" : "Amount"}: {result.amount} SAR</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}