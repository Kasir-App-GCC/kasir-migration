import React, { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const QUICK = [5, 10, 20, 50, 100];

export default function DonationPanel() {
  const { user } = useStore();
  const { toast } = useToast();
  const nav = useNavigate();
  const [selected, setSelected] = useState(10);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = custom ? parseFloat(custom) : selected;

  const donate = async () => {
    if (!amount || amount < 1) {
      toast({ title: "أدخل مبلغاً صحيحاً", variant: "destructive" });
      return;
    }
    if (!user) {
      nav("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createDonation", { amount });
      if (res?.data?.ok) {
        window.location.href = res.data.url;
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      toast({ title: "تعذّر إنشاء رابط التبرع", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Heart size={22} className="fill-white" />
        <h2 className="text-lg font-extrabold">ادعمنا بتبرع</h2>
      </div>
      <p className="text-sm opacity-90 leading-relaxed">
        إذا أعجبك التطبيق وقدّم لك قيمة، تبرعك يساعدنا نستمر ونطوّر ونخلّيها بلا إعلانات. كل مبلغ يفرق ❤️
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => { setSelected(q); setCustom(""); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${(!custom && selected === q) ? "bg-white text-rose-600" : "bg-white/20 hover:bg-white/30"}`}
          >
            {q} ر.س
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="مبلغ مخصص"
          dir="ltr"
          inputMode="decimal"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/20 placeholder-white/60 outline-none focus:ring-2 ring-white/40 text-sm text-center font-bold"
        />
        <button
          onClick={donate}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-bold text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} className="fill-rose-600" />}
          تبرّع
        </button>
      </div>
    </div>
  );
}